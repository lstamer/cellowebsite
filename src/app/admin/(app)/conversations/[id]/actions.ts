"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/components/admin/controls";
import { requireAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { logAdminEvent } from "@/lib/admin/events";
import {
  claimInquiryOutboxEvent,
  completeInquiryOutboxEvent,
  createAdminReply,
  releaseInquiryOutboxEvent,
} from "@/lib/inquiries/supabase";
import { triggerApprovedResponse } from "@/lib/inquiries/triggering";

/**
 * Sends a reply Luke wrote in the admin. The RPC creates an already-approved
 * approval plus its outbox event; the send itself runs in the Trigger.dev
 * task through claim_inquiry_approval_send, so the 24-hour window and the
 * duplicate-send guards apply exactly as they do for Telegram approvals.
 */
export async function sendAdminReplyAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const conversationId = String(formData.get("conversation_id") ?? "");
  const reply = String(formData.get("reply") ?? "").trim();
  if (!conversationId) return { ok: false, message: "Missing conversation id." };
  if (reply.length < 2) return { ok: false, message: "Write the reply first." };
  if (reply.length > 4_000) return { ok: false, message: "WhatsApp messages are limited to 4,000 characters." };

  let result;
  try {
    result = await createAdminReply({ conversationId, reply, actor: session.email });
  } catch (error) {
    return { ok: false, message: `Could not queue the reply: ${error instanceof Error ? error.message : "unknown error"}` };
  }

  if (!result.ok) {
    return {
      ok: false,
      message:
        result.reason === "window_closed"
          ? "The 24-hour WhatsApp window has closed. Reply from your phone, or send an approved template."
          : "No inbound message exists on this thread yet, so nothing can be replied to.",
    };
  }

  await recordAudit({
    actor: session.email,
    table: "inquiry_approval_requests",
    rowId: result.approvalId,
    action: "insert",
    after: { conversation_id: conversationId, final_reply: reply, source: "admin" },
    note: "Reply sent from the admin",
  });

  const claimed = await claimInquiryOutboxEvent(result.outboxId);
  if (claimed) {
    try {
      await triggerApprovedResponse(result.approvalId);
      await completeInquiryOutboxEvent(claimed.id, claimed.claimToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown trigger error";
      await releaseInquiryOutboxEvent(claimed.id, claimed.claimToken, message);
      await logAdminEvent({
        level: "warn",
        source: "trigger",
        kind: "admin_reply_trigger_failed",
        message: `The admin reply was queued but Trigger.dev could not be reached: ${message}. The outbox dispatcher will retry.`,
        conversationId,
      });
    }
  }

  revalidatePath(`/admin/conversations/${conversationId}`);
  return { ok: true, message: "Queued. It sends within seconds and appears in the thread once Zernio confirms." };
}
