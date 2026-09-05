/**
 * Site + integration health.
 *
 * Two halves:
 *   - `runInternalHealthChecks()` is what `/api/health` executes inside the
 *     Vercel function: a Supabase round-trip, Telegram `getMe`, a Zernio
 *     authenticated GET, and AI Gateway reachability.
 *   - `runHealthProbe()` is the scheduled trigger.dev task: it probes the
 *     public site from outside, calls `/api/health`, adds the data-derived
 *     checks, stores every result, and on a state change writes an admin
 *     event and (rate-limited by the RPC) one Telegram message.
 */
import { z } from "zod";

import { describeError, logAdminEvent } from "@/lib/admin/events";
import { requireEnv } from "@/lib/inquiries/env";
import { getSupabaseAdmin } from "@/lib/inquiries/supabase";
import { sendTelegramMessage } from "@/lib/inquiries/telegram";

export interface HealthCheckResult {
  check: string;
  ok: boolean;
  latencyMs: number | null;
  detail: Record<string, unknown>;
}

const PROBE_TIMEOUT_MS = 10_000;

async function timed(
  check: string,
  run: () => Promise<{ ok: boolean; detail?: Record<string, unknown> }>,
): Promise<HealthCheckResult> {
  const started = Date.now();
  try {
    const result = await run();
    return {
      check,
      ok: result.ok,
      latencyMs: Date.now() - started,
      detail: result.detail ?? {},
    };
  } catch (error) {
    return {
      check,
      ok: false,
      latencyMs: Date.now() - started,
      detail: { message: describeError(error) },
    };
  }
}

function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(PROBE_TIMEOUT_MS), cache: "no-store" });
}

export async function runInternalHealthChecks(): Promise<HealthCheckResult[]> {
  return Promise.all([
    timed("supabase", async () => {
      const { error } = await getSupabaseAdmin()
        .from("inquiry_brain_docs")
        .select("slug", { head: true, count: "exact" })
        .limit(1);
      if (error) return { ok: false, detail: { message: error.message } };
      return { ok: true };
    }),
    timed("telegram", async () => {
      const response = await fetchWithTimeout(
        `https://api.telegram.org/bot${requireEnv("TELEGRAM_BOT_TOKEN")}/getMe`,
      );
      const body = (await response.json().catch(() => null)) as { ok?: boolean; result?: { username?: string } } | null;
      return {
        ok: response.ok && body?.ok === true,
        detail: { status: response.status, bot: body?.result?.username ?? null },
      };
    }),
    timed("zernio", async () => {
      const response = await fetchWithTimeout(
        "https://zernio.com/api/v1/inbox/conversations?limit=1",
        { headers: { Authorization: `Bearer ${requireEnv("ZERNIO_API_KEY")}` } },
      );
      // 2xx: authenticated and reachable. 401/403: key problem. 5xx: outage.
      // A 404 on this listing endpoint still proves auth + reachability.
      const ok = response.status < 500 && response.status !== 401 && response.status !== 403;
      return { ok, detail: { status: response.status } };
    }),
    timed("ai_gateway", async () => {
      const response = await fetchWithTimeout("https://ai-gateway.vercel.sh/v1/models", {
        headers: { Authorization: `Bearer ${requireEnv("AI_GATEWAY_API_KEY")}` },
      });
      const ok = response.status < 500 && response.status !== 401 && response.status !== 403;
      return { ok, detail: { status: response.status, model: process.env.AI_MODEL ?? null } };
    }),
  ]);
}

const internalHealthSchema = z.object({
  checks: z.array(
    z.object({
      check: z.string(),
      ok: z.boolean(),
      latencyMs: z.number().nullable(),
      detail: z.record(z.string(), z.unknown()),
    }),
  ),
});

async function dataDerivedChecks(): Promise<HealthCheckResult[]> {
  const supabase = getSupabaseAdmin();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  return Promise.all([
    timed("lead_alerts", async () => {
      const { count, error } = await supabase
        .from("inquiry_website_leads")
        .select("id", { head: true, count: "exact" })
        .eq("alert_status", "failed");
      if (error) throw new Error(error.message);
      return { ok: (count ?? 0) === 0, detail: { failedAlerts: count ?? 0, message: count ? `${count} lead alert(s) failed` : undefined } };
    }),
    timed("approvals", async () => {
      const { count: uncertain, error } = await supabase
        .from("inquiry_approval_requests")
        .select("id", { head: true, count: "exact" })
        .in("status", ["failed", "send_uncertain"]);
      if (error) throw new Error(error.message);
      const { count: stale, error: staleError } = await supabase
        .from("inquiry_approval_requests")
        .select("id", { head: true, count: "exact" })
        .eq("status", "pending")
        .lt("created_at", dayAgo);
      if (staleError) throw new Error(staleError.message);
      const problems = (uncertain ?? 0) + (stale ?? 0);
      return {
        ok: problems === 0,
        detail: {
          uncertainSends: uncertain ?? 0,
          pendingOver24h: stale ?? 0,
          message: problems ? `${uncertain ?? 0} uncertain send(s), ${stale ?? 0} review(s) waiting >24h` : undefined,
        },
      };
    }),
    timed("outbox", async () => {
      const { count, error } = await supabase
        .from("inquiry_outbox_events")
        .select("id", { head: true, count: "exact" })
        .eq("status", "failed");
      if (error) throw new Error(error.message);
      return { ok: (count ?? 0) === 0, detail: { failed: count ?? 0, message: count ? `${count} outbox event(s) failed` : undefined } };
    }),
  ]);
}

export interface HealthProbeSummary {
  checks: HealthCheckResult[];
  transitions: Array<{ check: string; ok: boolean }>;
}

export async function runHealthProbe(): Promise<HealthProbeSummary> {
  const origin = (process.env.SITE_ORIGIN ?? "https://stamer.co.za").replace(/\/$/, "");
  const results: HealthCheckResult[] = [];

  results.push(
    await timed("site", async () => {
      const response = await fetchWithTimeout(`${origin}/`, { redirect: "follow" });
      return { ok: response.ok, detail: { status: response.status } };
    }),
  );

  const internal = await timed("api_health", async () => {
    const secret = process.env.HEALTH_PROBE_SECRET;
    if (!secret) {
      return { ok: false, detail: { message: "HEALTH_PROBE_SECRET is not set" } };
    }
    const response = await fetchWithTimeout(`${origin}/api/health`, {
      headers: { "x-health-secret": secret },
    });
    if (!response.ok) {
      return { ok: false, detail: { status: response.status, message: `/api/health returned ${response.status}` } };
    }
    const parsed = internalHealthSchema.safeParse(await response.json());
    if (!parsed.success) {
      return { ok: false, detail: { message: "Unparseable /api/health body" } };
    }
    results.push(...parsed.data.checks);
    return { ok: true, detail: { checks: parsed.data.checks.length } };
  });
  results.push(internal);

  try {
    results.push(...(await dataDerivedChecks()));
  } catch (error) {
    results.push({
      check: "data_checks",
      ok: false,
      latencyMs: null,
      detail: { message: describeError(error) },
    });
  }

  const transitions: Array<{ check: string; ok: boolean }> = [];
  const supabase = getSupabaseAdmin();

  for (const result of results) {
    const { data, error } = await supabase.rpc("record_health_check", {
      p_check: result.check,
      p_ok: result.ok,
      p_latency_ms: result.latencyMs,
      p_detail: result.detail,
    });
    if (error) {
      await logAdminEvent({
        level: "warning",
        source: "health",
        kind: "health_record_failed",
        message: `Could not store health result for ${result.check}: ${error.message}`,
      });
      continue;
    }

    const state = z
      .object({ flipped: z.boolean(), alert: z.boolean() })
      .safeParse(data);
    if (!state.success || !state.data.flipped) continue;

    transitions.push({ check: result.check, ok: result.ok });
    const message = result.ok
      ? `Health: ${result.check} recovered.`
      : `Health: ${result.check} is failing. ${String(result.detail.message ?? "")}`.trim();

    await logAdminEvent({
      level: result.ok ? "info" : "error",
      source: "health",
      kind: result.ok ? "health_recovered" : "health_failing",
      message,
      entityType: "health",
      entityId: result.check,
      context: result.detail,
    });

    if (state.data.alert && process.env.TELEGRAM_CHAT_ID) {
      try {
        await sendTelegramMessage({
          chatId: requireEnv("TELEGRAM_CHAT_ID"),
          text: `${result.ok ? "✅" : "🚨"} ${message}`,
        });
      } catch (error) {
        await logAdminEvent({
          level: "warning",
          source: "telegram",
          kind: "health_alert_not_sent",
          message: `Health alert for ${result.check} could not be sent: ${describeError(error)}`,
        });
      }
    }
  }

  // Keep the samples table bounded; best-effort.
  await supabase.rpc("prune_health_checks").then(() => undefined, () => undefined);

  return { checks: results, transitions };
}
