/**
 * Website lead alerts: the Telegram card Luke gets for every form submission.
 *
 * Shared by the two form routes (which send immediately after the Supabase
 * write) and the retry sweep in trigger/admin.ts (which resends anything that
 * failed). Both render from the stored lead row so a retried card is
 * byte-identical to the one that should have gone out the first time.
 */
import { logAdminEvent } from "@/lib/admin/events";
import { toWaMeDigits } from "@/lib/inquiries/phone";
import {
  claimWebsiteLeadAlert,
  completeWebsiteLeadAlert,
  failWebsiteLeadAlert,
  type WebsiteLeadAlertRow,
} from "@/lib/inquiries/supabase";
import { sendTelegramLeadAlert } from "@/lib/inquiries/telegram";

export function formatGuestCount(count: number | null): string {
  if (count === null) return "Not specified";
  if (count >= 200) return "200+";
  return String(count);
}

/**
 * The exact Telegram text for a lead. Pinned by route tests; change only when
 * Luke asks for the notification to change.
 */
export function buildLeadAlertText(lead: WebsiteLeadAlertRow): string {
  const fullName =
    `${lead.first_name.trim()} ${(lead.last_name ?? "").trim()}`.trim() || "Unknown";

  if (lead.source === "contact_form") {
    const lines = [
      "🎻 New inquiry from stamer.co.za (home page form)",
      "",
      `👤 Name: ${fullName}`,
      `🎉 Inquiry type: ${lead.event_type ?? "General inquiry"}`,
      `✉️ Email: ${lead.email.trim()}`,
    ];
    if (lead.phone?.trim()) lines.push(`📞 Phone: ${lead.phone.trim()}`);
    if (lead.message?.trim()) lines.push("", `💬 Message: ${lead.message.trim()}`);
    return lines.join("\n");
  }

  const lines = [
    "🎻 New inquiry from stamer.co.za",
    "",
    `👤 Name: ${fullName}`,
    `👋 Role: ${lead.booker_role ?? "Not provided"}`,
    `🎉 Event: ${lead.event_type ?? "Not specified"}`,
    `📅 Date: ${lead.event_date_text ?? "Not specified"}`,
    `📍 Location: ${lead.location?.trim() || "Not provided"}`,
    `✉️ Email: ${lead.email.trim()}`,
  ];

  if (lead.phone?.trim()) lines.push(`📞 Phone: ${lead.phone.trim()}`);
  if (lead.whatsapp?.trim()) lines.push(`💬 WhatsApp: ${lead.whatsapp.trim()}`);
  lines.push(
    `📨 Preferred contact: ${lead.contact_preference === "email" ? "Email" : "WhatsApp"}`,
  );
  if (lead.guest_count !== null) {
    lines.push(`👥 Guests: ${formatGuestCount(lead.guest_count)}`);
  }
  if (lead.performance_minutes !== null) {
    lines.push(`⏱ Performance: ${lead.performance_minutes} min`);
  }
  if (lead.message?.trim()) lines.push("", `💬 Message: ${lead.message.trim()}`);

  return lines.join("\n");
}

export type LeadAlertOutcome =
  | { status: "sent"; messageId?: number }
  | { status: "failed"; error: string }
  | { status: "not_claimed" };

/**
 * Claim, send, and record the outcome of one lead's Telegram alert.
 *
 * Never throws for a Telegram failure: the caller (a form request or the
 * sweep) has already done its important work, and the failure is recorded on
 * the row and in admin_events for the retry sweep and the console.
 */
export async function deliverWebsiteLeadAlert(
  lead: WebsiteLeadAlertRow,
  options: { attemptSource: "request" | "retry" } = { attemptSource: "request" },
): Promise<LeadAlertOutcome> {
  let claimed: boolean;
  try {
    claimed = await claimWebsiteLeadAlert(lead.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await logAdminEvent({
      level: "error",
      source: "supabase",
      kind: "lead_alert_claim_failed",
      message: `Could not claim the Telegram alert for a website lead: ${message}`,
      leadId: lead.id,
      context: { attemptSource: options.attemptSource },
    });
    return { status: "failed", error: message };
  }

  if (!claimed) return { status: "not_claimed" };

  const replyDigits = toWaMeDigits(lead.whatsapp ?? lead.phone ?? "") ?? lead.whatsapp_digits;
  const alert = await sendTelegramLeadAlert({
    text: buildLeadAlertText(lead),
    replyUrl: replyDigits ? `https://wa.me/${replyDigits}` : undefined,
    replyLabel: `Message ${lead.first_name.trim() || "them"} on WhatsApp`,
    availabilityLeadId: lead.whatsapp_digits ? lead.id : undefined,
  });

  if (alert.ok && alert.chatId && alert.messageId !== undefined) {
    try {
      await completeWebsiteLeadAlert({
        leadId: lead.id,
        chatId: alert.chatId,
        messageId: alert.messageId,
      });
    } catch (error) {
      // The card is in Luke's chat but the row does not know it. Worst case
      // the sweep resends once; the event makes that visible.
      await logAdminEvent({
        level: "warn",
        source: "supabase",
        kind: "lead_alert_complete_failed",
        message: `Telegram alert sent but the card ids could not be stored: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        leadId: lead.id,
        context: { messageId: alert.messageId, attemptSource: options.attemptSource },
      });
    }
    if (options.attemptSource === "retry") {
      await logAdminEvent({
        level: "info",
        source: "telegram",
        kind: "lead_alert_recovered",
        message: "Telegram lead alert delivered by the retry sweep.",
        leadId: lead.id,
      });
    }
    return { status: "sent", messageId: alert.messageId };
  }

  const errorMessage = alert.ok
    ? "Telegram accepted the alert but returned no message id"
    : (alert.error ?? "Unknown Telegram error");

  try {
    await failWebsiteLeadAlert({ leadId: lead.id, errorMessage });
  } catch (error) {
    console.error("Failed to record lead alert failure:", error);
  }
  await logAdminEvent({
    level: "error",
    source: "telegram",
    kind: "lead_alert_failed",
    message: `Telegram lead alert failed: ${errorMessage}`,
    leadId: lead.id,
    context: { attemptSource: options.attemptSource },
  });

  return { status: "failed", error: errorMessage };
}
