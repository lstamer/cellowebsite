import { logger, schedules } from "@trigger.dev/sdk";

import { getAdminDb } from "@/lib/admin/db";
import { logAdminEvent } from "@/lib/admin/events";
import {
  alertEmailInquiry,
  applyEmailClassification,
  classifyEmail,
  looksAutomated,
  storeEmailMessage,
} from "@/lib/inquiries/email";
import { getGmailMessage, gmailConfigured, listGmailMessageIds } from "@/lib/inquiries/gmail";

/**
 * Polls Luke's Google Workspace inbox every five minutes. New inbound mail is
 * stored, classified, linked to a person and, when it is an enquiry, pushed
 * to Telegram. Mail Luke sent is stored as outgoing so the thread reads
 * whole. Read-only against Gmail: nothing is labelled, archived or sent.
 */
export const pollGmailInquiries = schedules.task({
  id: "poll-gmail-inquiries",
  cron: "*/5 * * * *",
  queue: { name: "email", concurrencyLimit: 1 },
  retry: { maxAttempts: 1 },
  run: async () => {
    if (!gmailConfigured()) {
      logger.info("Gmail is not configured; skipping");
      return { skipped: true };
    }

    const db = getAdminDb();
    const ownAddress = (process.env.GMAIL_OWN_ADDRESS?.trim() || "luke@stamer.co.za").toLowerCase();
    const { data: state } = await db.from("email_sync_state").select("last_synced_at").eq("id", 1).maybeSingle();
    const lastSynced = state?.last_synced_at ? new Date(String(state.last_synced_at)) : null;
    // Overlap by an hour so a slow delivery is never missed; duplicates are
    // filtered by the unique gmail_message_id.
    const since = lastSynced ? new Date(lastSynced.getTime() - 3_600_000) : new Date(Date.now() - 2 * 86_400_000);
    const query = `after:${Math.floor(since.getTime() / 1000)} -in:chats -in:drafts -in:trash -in:spam`;

    let stored = 0;
    let inquiries = 0;
    let errors = 0;

    try {
      const ids = await listGmailMessageIds(query, 100);
      for (const ref of ids.reverse()) {
        try {
          const message = await getGmailMessage(ref.id);
          const direction = message.from.email === ownAddress || message.labels.includes("SENT") ? "outgoing" : "incoming";
          const result = await storeEmailMessage(message, direction);
          if (!result.isNew) continue;
          stored += 1;
          if (direction === "outgoing") {
            await db.from("inquiry_email_threads").update({ status: "replied", updated_at: new Date().toISOString() }).eq("id", result.threadId).eq("status", "alerted");
            continue;
          }

          // Only the first inbound message of a thread is classified; later
          // replies inherit the thread's classification.
          const { data: thread } = await db.from("inquiry_email_threads").select("classification").eq("id", result.threadId).single();
          if (thread?.classification === "inquiry") {
            await db.from("inquiry_email_threads").update({ status: "new", updated_at: new Date().toISOString() }).eq("id", result.threadId);
            continue;
          }
          if (thread?.classification === "not_inquiry") continue;

          if (looksAutomated(message)) {
            await db.from("inquiry_email_threads").update({ classification: "not_inquiry" }).eq("id", result.threadId);
            continue;
          }

          const classification = await classifyEmail(message);
          await applyEmailClassification(result.threadId, message, classification);
          if (classification.is_inquiry && classification.confidence >= 0.5) {
            inquiries += 1;
            await alertEmailInquiry(result.threadId, message, classification);
          }
        } catch (error) {
          errors += 1;
          const description = error instanceof Error ? error.message : "Unknown error";
          logger.error("Email message failed", { id: ref.id, description });
          await logAdminEvent({
            level: "error",
            source: "email",
            kind: "email_message_failed",
            message: `An email could not be processed: ${description}`,
            context: { gmailMessageId: ref.id },
          });
        }
      }

      await db
        .from("email_sync_state")
        .update({ last_synced_at: new Date().toISOString(), last_error: errors ? `${errors} messages failed` : null, updated_at: new Date().toISOString() })
        .eq("id", 1);
    } catch (error) {
      const description = error instanceof Error ? error.message : "Unknown error";
      await db.from("email_sync_state").update({ last_error: description, updated_at: new Date().toISOString() }).eq("id", 1);
      await logAdminEvent({
        level: "error",
        source: "email",
        kind: "gmail_poll_failed",
        message: `Gmail polling failed: ${description}`,
      });
      throw error;
    }

    return { stored, inquiries, errors };
  },
});
