/**
 * The Telegram alert for a website enquiry, shared by the request path
 * (`/api/leads`, `/api/contact`) and the `retry-lead-alerts` task.
 *
 * Both render from the same database-shaped record so a retried card reads
 * exactly like a first-time one, and both drive the lead's alert state machine
 * (`alert_status`) through the RPCs in 2026090501.
 */
import { z } from "zod";

import { describeError, logAdminEvent } from "@/lib/admin/events";
import { loadTemplateOverrides } from "@/lib/admin/template-store";
import { renderNamedTemplate } from "@/lib/admin/templates";
import {
  claimWebsiteLeadAlert,
  completeWebsiteLeadAlert,
  failWebsiteLeadAlert,
} from "@/lib/inquiries/supabase";
import { sendTelegramLeadAlert } from "@/lib/inquiries/telegram";

export const leadAlertRecordSchema = z.object({
  leadId: z.string().uuid(),
  source: z.enum(["lead_form", "contact_form"]),
  firstName: z.string(),
  lastName: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  whatsappDigits: z.string().nullable(),
  contactPreference: z.string().nullable(),
  eventType: z.string().nullable(),
  eventDateText: z.string().nullable(),
  location: z.string().nullable(),
  guestCount: z.number().int().nullable(),
  performanceMinutes: z.number().int().nullable(),
  bookerRole: z.string().nullable(),
  message: z.string().nullable(),
});

export type LeadAlertRecord = z.infer<typeof leadAlertRecordSchema>;

export const LEAD_SOURCE_LABELS: Record<LeadAlertRecord["source"], string> = {
  lead_form: "Booking form (/book)",
  contact_form: "Contact form (home page)",
};

function formatGuestCount(count: number | null): string {
  if (count === null) return "";
  if (count >= 200) return "200+";
  return String(count);
}

export function buildLeadAlertText(lead: LeadAlertRecord): string {
  const fullName = `${lead.firstName.trim()} ${lead.lastName?.trim() ?? ""}`.trim() || "Unknown";
  const preference =
    lead.contactPreference === "email"
      ? "Email"
      : lead.contactPreference === "whatsapp"
        ? "WhatsApp"
        : "";

  return renderNamedTemplate("telegram.lead_alert", {
    source_label: LEAD_SOURCE_LABELS[lead.source],
    name: fullName,
    role: lead.bookerRole ?? "",
    event_type: lead.eventType ?? "",
    event_date: lead.eventDateText ?? "",
    location: lead.location ?? "",
    email: lead.email.trim(),
    phone: lead.phone?.trim() ?? "",
    whatsapp: lead.whatsapp?.trim() ?? "",
    contact_preference: preference,
    guest_count: formatGuestCount(lead.guestCount),
    performance: lead.performanceMinutes === null ? "" : `${lead.performanceMinutes} min`,
    message: lead.message?.trim() ?? "",
  });
}

export type LeadAlertOutcome =
  | { status: "sent"; messageId?: number }
  | { status: "failed"; attempts: number; error: string }
  | { status: "not_claimed"; leadStatus: string | null };

/**
 * Claim, send, and record one lead alert. Never throws: every outcome is
 * written to the lead row and, on failure, to `admin_events`.
 */
export async function deliverLeadAlert(input: {
  leadId: string;
  /** When the caller already holds the record (the retry task does), skip the claim RPC's read. */
  record?: LeadAlertRecord;
  claimed?: boolean;
  triggeredBy: "request" | "retry" | "admin";
}): Promise<LeadAlertOutcome> {
  let record = input.record;

  if (!input.claimed) {
    let claim;
    try {
      claim = await claimWebsiteLeadAlert(input.leadId);
    } catch (error) {
      const message = describeError(error);
      await logAdminEvent({
        level: "error",
        source: "supabase",
        kind: "lead_alert_claim_failed",
        message: `Could not claim the Telegram alert for a website lead: ${message}`,
        entityType: "website_lead",
        entityId: input.leadId,
        context: { triggeredBy: input.triggeredBy },
      });
      return { status: "failed", attempts: 0, error: message };
    }

    if (!claim.claimed) {
      return { status: "not_claimed", leadStatus: claim.status };
    }
    record = claim.record;
  }

  if (!record) {
    return { status: "not_claimed", leadStatus: null };
  }

  await loadTemplateOverrides();

  const text = buildLeadAlertText(record);
  const replyDigits = record.whatsappDigits;
  const alert = await sendTelegramLeadAlert({
    text,
    replyUrl: replyDigits ? `https://wa.me/${replyDigits}` : undefined,
    replyLabel: `Message ${record.firstName.trim() || "them"} on WhatsApp`,
    availabilityLeadId: replyDigits ? record.leadId : undefined,
  });

  if (alert.ok && alert.chatId) {
    try {
      // The card's message id is what lets the Available / Unavailable taps
      // and later edits find it. If Telegram accepted the message but hid the
      // id, the lead is still marked sent so it is not posted twice.
      await completeWebsiteLeadAlert({
        leadId: record.leadId,
        chatId: alert.chatId,
        messageId: alert.messageId ?? 0,
      });
    } catch (error) {
      await logAdminEvent({
        level: "warning",
        source: "supabase",
        kind: "lead_alert_card_not_recorded",
        message: `Telegram alert sent but its card ids could not be stored: ${describeError(error)}`,
        entityType: "website_lead",
        entityId: record.leadId,
        context: { messageId: alert.messageId, triggeredBy: input.triggeredBy },
      });
    }
    return { status: "sent", messageId: alert.messageId };
  }

  const errorMessage = alert.error ?? "Telegram rejected the alert";
  let attempts = 0;
  try {
    attempts = (await failWebsiteLeadAlert({ leadId: record.leadId, error: errorMessage })).attempts;
  } catch (error) {
    await logAdminEvent({
      level: "error",
      source: "supabase",
      kind: "lead_alert_failure_not_recorded",
      message: `Telegram alert failed AND the failure could not be recorded: ${describeError(error)}`,
      entityType: "website_lead",
      entityId: record.leadId,
    });
  }

  await logAdminEvent({
    level: "error",
    source: "telegram",
    kind: "lead_alert_failed",
    message: `Telegram alert for ${record.firstName} (${LEAD_SOURCE_LABELS[record.source]}) failed: ${errorMessage}`,
    entityType: "website_lead",
    entityId: record.leadId,
    context: { attempts, triggeredBy: input.triggeredBy },
  });

  return { status: "failed", attempts, error: errorMessage };
}
