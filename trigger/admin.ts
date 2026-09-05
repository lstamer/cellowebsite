import { logger, schedules } from "@trigger.dev/sdk";

import { logAdminEvent } from "@/lib/admin/events";
import { runInternalChecks, type HealthCheckResult } from "@/lib/admin/health";
import {
  getLatestHealthStates,
  pruneAnalyticsAndHealth,
  recordHealthChecks,
} from "@/lib/admin/health-store";
import { requireEnv } from "@/lib/inquiries/env";
import {
  getWebsiteLeadAlertRow,
  listWebsiteLeadsNeedingAlert,
} from "@/lib/inquiries/supabase";
import { sendTelegramMessage } from "@/lib/inquiries/telegram";
import { deliverWebsiteLeadAlert } from "@/lib/inquiries/website-leads";

/**
 * Resend Telegram lead alerts that failed at request time.
 *
 * The form request already stored the lead and tried once; this sweep is what
 * turns "best-effort" into "never silently lost". The claim RPC caps attempts
 * at five, after which the row stays 'failed' and the console shows it.
 */
export const retryLeadAlerts = schedules.task({
  id: "retry-lead-alerts",
  cron: "*/5 * * * *",
  queue: { name: "lead-alerts", concurrencyLimit: 1 },
  retry: { maxAttempts: 2 },
  run: async () => {
    const leadIds = await listWebsiteLeadsNeedingAlert(20);
    if (leadIds.length === 0) {
      return { checked: 0, sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const leadId of leadIds) {
      const lead = await getWebsiteLeadAlertRow(leadId);
      if (!lead) continue;

      const outcome = await deliverWebsiteLeadAlert(lead, { attemptSource: "retry" });
      if (outcome.status === "sent") sent += 1;
      if (outcome.status === "failed") {
        failed += 1;
        logger.warn("Lead alert retry failed", { leadId, error: outcome.error });
      }
    }

    if (failed > 0) {
      await logAdminEvent({
        level: "warn",
        source: "trigger",
        kind: "lead_alert_retry_sweep",
        message: `Lead alert retry sweep: ${sent} sent, ${failed} still failing.`,
        context: { checked: leadIds.length, sent, failed },
      });
    }

    return { checked: leadIds.length, sent, failed };
  },
});

// ---------------------------------------------------------------------------
// Site health
// ---------------------------------------------------------------------------

async function probe(target: string, url: string, headers: Record<string, string>, timeoutMs: number): Promise<{ response: Response | null; result: HealthCheckResult }> {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "stamer-health-probe", ...headers },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "follow",
    });
    return {
      response,
      result: {
        target,
        ok: response.ok,
        statusCode: response.status,
        latencyMs: Date.now() - started,
        detail: response.ok ? null : `HTTP ${response.status}`,
      },
    };
  } catch (error) {
    return {
      response: null,
      result: {
        target,
        ok: false,
        statusCode: null,
        latencyMs: Date.now() - started,
        detail: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

/**
 * Every five minutes: fetch the public site, run the integration checks
 * through /api/health on the deployed app, store one health_checks row per
 * target, and tell Luke on Telegram when a target changes state. Only
 * transitions alert, so a long outage is one message down and one back up.
 */
export const healthProbe = schedules.task({
  id: "health-probe",
  cron: "*/5 * * * *",
  queue: { name: "health", concurrencyLimit: 1 },
  retry: { maxAttempts: 1 },
  run: async () => {
    const siteUrl = (process.env.SITE_URL?.trim() || "https://stamer.co.za").replace(/\/$/, "");
    const secret = process.env.HEALTH_PROBE_SECRET?.trim();
    const results: HealthCheckResult[] = [];

    const site = await probe("site", `${siteUrl}/`, {}, 15_000);
    results.push(site.result);

    if (secret) {
      const internal = await probe("api_health", `${siteUrl}/api/health`, { "x-health-secret": secret }, 30_000);
      const body = internal.response
        ? ((await internal.response.json().catch(() => null)) as { checks?: HealthCheckResult[] } | null)
        : null;
      if (Array.isArray(body?.checks)) {
        results.push(...body.checks);
      } else {
        results.push({ ...internal.result, ok: false, detail: internal.result.detail ?? "Unexpected response" });
      }
    } else {
      // No secret configured: run the checks from this worker instead.
      results.push(...(await runInternalChecks()));
    }

    const previous = await getLatestHealthStates(results.map((result) => result.target));
    await recordHealthChecks(results);

    const changed = results.filter((result) => {
      const before = previous.get(result.target);
      return before === undefined ? !result.ok : before !== result.ok;
    });

    for (const result of changed) {
      const recovered = result.ok;
      await logAdminEvent({
        level: recovered ? "info" : "error",
        source: "health",
        kind: recovered ? "health_recovered" : "health_failed",
        message: recovered
          ? `${result.target} is healthy again (${result.latencyMs} ms).`
          : `${result.target} is failing: ${result.detail ?? "no detail"}`,
        context: { target: result.target, statusCode: result.statusCode, latencyMs: result.latencyMs },
      });
      try {
        await sendTelegramMessage({
          chatId: requireEnv("TELEGRAM_CHAT_ID"),
          text: recovered
            ? `✅ Health: ${result.target} recovered (${result.latencyMs} ms).`
            : `🚨 Health: ${result.target} is failing.\n${result.detail ?? "No detail"}\nSee admin.stamer.co.za/health`,
        });
      } catch (error) {
        logger.warn("Health alert could not be sent to Telegram", {
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      checked: results.length,
      failing: results.filter((result) => !result.ok).map((result) => result.target),
    };
  },
});

/** Daily housekeeping so the analytics and health tables stay small. */
export const pruneAnalytics = schedules.task({
  id: "prune-analytics-and-health",
  cron: "17 3 * * *",
  retry: { maxAttempts: 2 },
  run: async () => {
    const pruned = await pruneAnalyticsAndHealth();
    logger.info("Pruned analytics and health rows", pruned);
    return pruned;
  },
});
