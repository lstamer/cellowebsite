import { logger, schedules } from "@trigger.dev/sdk";

import { describeError, logAdminEvent } from "@/lib/admin/events";
import { runHealthProbe } from "@/lib/admin/health";
import { deliverLeadAlert } from "@/lib/inquiries/lead-alert";
import {
  claimPendingWebsiteLeadAlerts,
  getExhaustedWebsiteLeadAlerts,
  skipWebsiteLeadAlert,
} from "@/lib/inquiries/supabase";

const MAX_ALERT_ATTEMPTS = 5;

/**
 * Website lead alerts that did not land on the first try are re-sent here.
 *
 * The request path posts the card in `after()`; if Telegram is down or the
 * function is frozen before the send completes, the lead sits in 'pending' or
 * 'failed' and this sweep picks it up within five minutes. After five
 * attempts the lead is parked as 'skipped' with a needs-attention event so
 * the admin console shows it and the sweep stops hammering Telegram.
 */
export const retryLeadAlerts = schedules.task({
  id: "retry-lead-alerts",
  cron: "*/5 * * * *",
  queue: { name: "lead-alerts", concurrencyLimit: 1 },
  retry: { maxAttempts: 2 },
  run: async () => {
    const claimed = await claimPendingWebsiteLeadAlerts(20, MAX_ALERT_ATTEMPTS);
    let sent = 0;
    let failed = 0;

    for (const record of claimed) {
      const outcome = await deliverLeadAlert({
        leadId: record.leadId,
        record,
        claimed: true,
        triggeredBy: "retry",
      });

      if (outcome.status === "sent") {
        sent += 1;
        await logAdminEvent({
          level: "info",
          source: "telegram",
          kind: "lead_alert_recovered",
          message: `Telegram alert for ${record.firstName} delivered on attempt ${record.alertAttempts}.`,
          entityType: "website_lead",
          entityId: record.leadId,
        });
      } else {
        failed += 1;
      }
    }

    // Anything that just hit the cap gets one loud event and is parked.
    let exhausted = 0;
    try {
      const done = await getExhaustedWebsiteLeadAlerts(MAX_ALERT_ATTEMPTS);
      for (const lead of done) {
        await skipWebsiteLeadAlert({
          leadId: lead.leadId,
          reason: `Gave up after ${MAX_ALERT_ATTEMPTS} attempts: ${lead.error ?? "unknown error"}`,
        });
        await logAdminEvent({
          level: "error",
          source: "telegram",
          kind: "lead_alert_needs_attention",
          message: `Telegram alert for ${lead.firstName} could not be delivered after ${MAX_ALERT_ATTEMPTS} attempts. Open the lead in the admin and resend once Telegram is healthy.`,
          entityType: "website_lead",
          entityId: lead.leadId,
          context: { lastError: lead.error },
        });
        exhausted += 1;
      }
    } catch (error) {
      logger.warn("Could not sweep exhausted lead alerts", {
        message: describeError(error),
      });
    }

    return { claimed: claimed.length, sent, failed, exhausted };
  },
});

/**
 * Site + integration health every five minutes: public homepage TTFB, the
 * internal /api/health round-trip (Supabase, Telegram, Zernio, AI Gateway),
 * and the data-derived checks (stuck approvals, failed outbox rows, failed
 * alerts). State changes write an admin event and one Telegram message.
 */
export const healthProbe = schedules.task({
  id: "health-probe",
  cron: "*/5 * * * *",
  queue: { name: "health", concurrencyLimit: 1 },
  retry: { maxAttempts: 1 },
  run: async () => {
    const result = await runHealthProbe();
    logger.info("Health probe complete", {
      failing: result.checks.filter((check) => !check.ok).map((check) => check.check),
      transitions: result.transitions,
    });
    return result;
  },
});
