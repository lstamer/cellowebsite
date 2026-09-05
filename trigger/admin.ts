import { logger, schedules } from "@trigger.dev/sdk";

import { logAdminEvent } from "@/lib/admin/events";
import {
  getWebsiteLeadAlertRow,
  listWebsiteLeadsNeedingAlert,
} from "@/lib/inquiries/supabase";
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
