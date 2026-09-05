/**
 * Email enquiry handling: classify an inbound message, store the thread, link
 * the person, and alert Telegram. Pure helpers are exported for tests; the
 * scheduled task in trigger/email.ts drives them.
 */
import { generateText, Output } from "ai";
import { z } from "zod";

import { getAdminDb } from "@/lib/admin/db";
import { logAdminEvent } from "@/lib/admin/events";
import { requireEnv } from "@/lib/inquiries/env";
import { trimQuotedReply, type GmailMessage } from "@/lib/inquiries/gmail";
import { sendTelegramLeadAlert } from "@/lib/inquiries/telegram";

export const emailClassificationSchema = z.object({
  is_inquiry: z.boolean(),
  confidence: z.number().min(0).max(1),
  summary: z.string().max(400),
  contact_name: z.string().nullable(),
  event_type: z.string().nullable(),
  event_date_text: z.string().nullable(),
  location: z.string().nullable(),
  reason: z.string().max(200),
});

export type EmailClassification = z.infer<typeof emailClassificationSchema>;

export const EMAIL_CLASSIFIER_INSTRUCTIONS = `You triage emails received by Luke Stamer, a Cape Town cellist who plays weddings, private events and corporate functions.

Decide whether the email is a genuine enquiry about hiring Luke to perform (or a reply within such a conversation). Newsletters, receipts, notifications, marketing, calendar invites, spam and personal chit-chat are not enquiries.

Rules:
- Use only what the email says. Unknown fields must be null.
- contact_name is the sender's name as they signed or introduced themselves, not the email address.
- event_date_text is the date exactly as written; do not resolve it.
- summary is one or two plain sentences describing what they want.
- Never invent prices or availability. You only classify.`;

const NOISE_SENDERS = /no-?reply|noreply|notifications?@|mailer-daemon|postmaster|newsletter|billing@|receipts?@|support@|calendar-notification/i;

/** Cheap pre-filter so obvious automation never reaches the model. */
export function looksAutomated(message: Pick<GmailMessage, "from" | "labels" | "subject">): boolean {
  if (message.from.email && NOISE_SENDERS.test(message.from.email)) return true;
  if (message.labels.some((label) => ["CATEGORY_PROMOTIONS", "CATEGORY_SOCIAL", "CATEGORY_UPDATES", "SPAM"].includes(label))) return true;
  if (message.subject && /unsubscribe|your (order|invoice|receipt)|verification code|password reset/i.test(message.subject)) return true;
  return false;
}

export async function classifyEmail(message: GmailMessage): Promise<EmailClassification> {
  requireEnv("AI_GATEWAY_API_KEY");
  const model = requireEnv("AI_MODEL");
  const body = trimQuotedReply(message.bodyText).slice(0, 6_000);
  const result = await generateText({
    model,
    instructions: EMAIL_CLASSIFIER_INSTRUCTIONS,
    output: Output.object({ schema: emailClassificationSchema }),
    prompt: [
      `From: ${message.from.name ?? ""} <${message.from.email ?? "unknown"}>`,
      `Subject: ${message.subject ?? "(no subject)"}`,
      `Received: ${message.receivedAt}`,
      "",
      body || "(empty body)",
    ].join("\n"),
  });
  return emailClassificationSchema.parse(result.output);
}

export function buildEmailAlertText(input: {
  fromName: string | null;
  fromEmail: string | null;
  subject: string | null;
  classification: EmailClassification;
}): string {
  const lines = [
    "🎻 New inquiry by email",
    "",
    `👤 Name: ${input.classification.contact_name ?? input.fromName ?? "Unknown"}`,
    `✉️ Email: ${input.fromEmail ?? "Unknown"}`,
    `📝 Subject: ${input.subject ?? "(no subject)"}`,
  ];
  if (input.classification.event_type) lines.push(`🎉 Event: ${input.classification.event_type}`);
  if (input.classification.event_date_text) lines.push(`📅 Date: ${input.classification.event_date_text}`);
  if (input.classification.location) lines.push(`📍 Location: ${input.classification.location}`);
  lines.push("", `💬 ${input.classification.summary}`);
  return lines.join("\n");
}

export interface StoredEmailMessage {
  threadId: string;
  messageId: string;
  isNew: boolean;
}

/** Upserts the thread and inserts the message. Returns isNew=false on a duplicate message. */
export async function storeEmailMessage(message: GmailMessage, direction: "incoming" | "outgoing"): Promise<StoredEmailMessage> {
  const db = getAdminDb();
  const { data: existing, error: existingError } = await db
    .from("inquiry_email_messages")
    .select("id, thread_id")
    .eq("gmail_message_id", message.id)
    .maybeSingle();
  if (existingError) throw new Error(`Email lookup failed: ${existingError.message}`);
  if (existing) return { threadId: String(existing.thread_id), messageId: String(existing.id), isNew: false };

  const { data: thread, error: threadError } = await db
    .from("inquiry_email_threads")
    .upsert(
      {
        gmail_thread_id: message.threadId,
        subject: message.subject,
        // The first inbound sender is the contact; an outgoing first message
        // (Luke started the thread) leaves it for the reply to fill in.
        ...(direction === "incoming" ? { from_email: message.from.email, from_name: message.from.name } : {}),
        last_message_at: message.receivedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "gmail_thread_id" },
    )
    .select("id, first_message_at")
    .single();
  if (threadError || !thread) throw new Error(`Email thread upsert failed: ${threadError?.message ?? "no row"}`);
  if (!thread.first_message_at) {
    await db.from("inquiry_email_threads").update({ first_message_at: message.receivedAt }).eq("id", thread.id);
  }

  const { data: inserted, error: insertError } = await db
    .from("inquiry_email_messages")
    .insert({
      thread_id: thread.id,
      gmail_message_id: message.id,
      direction,
      from_email: message.from.email,
      from_name: message.from.name,
      to_email: message.to,
      subject: message.subject,
      body_text: message.bodyText,
      snippet: message.snippet.slice(0, 500),
      received_at: message.receivedAt,
    })
    .select("id")
    .single();
  if (insertError || !inserted) {
    if (insertError?.code === "23505") return { threadId: String(thread.id), messageId: "", isNew: false };
    throw new Error(`Email message insert failed: ${insertError?.message ?? "no row"}`);
  }
  return { threadId: String(thread.id), messageId: String(inserted.id), isNew: true };
}

export async function applyEmailClassification(threadId: string, message: GmailMessage, classification: EmailClassification): Promise<void> {
  const db = getAdminDb();
  const isInquiry = classification.is_inquiry && classification.confidence >= 0.5;

  let personId: string | null = null;
  if (isInquiry && message.from.email) {
    const { data } = await db.rpc("upsert_inquiry_person", {
      p_phone_e164: null,
      p_display_name: classification.contact_name ?? message.from.name,
      p_email: message.from.email,
    });
    personId = typeof data === "string" ? data : null;
  }

  const { error } = await db
    .from("inquiry_email_threads")
    .update({
      classification: isInquiry ? "inquiry" : "not_inquiry",
      summary: classification.summary,
      event_type: classification.event_type,
      event_date_text: classification.event_date_text,
      location: classification.location,
      from_name: classification.contact_name ?? message.from.name,
      person_id: personId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId);
  if (error) throw new Error(`Email classification update failed: ${error.message}`);
}

export async function alertEmailInquiry(threadId: string, message: GmailMessage, classification: EmailClassification): Promise<void> {
  const db = getAdminDb();
  const text = buildEmailAlertText({ fromName: message.from.name, fromEmail: message.from.email, subject: message.subject, classification });
  const alert = await sendTelegramLeadAlert({
    text,
    replyUrl: message.from.email ? `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(message.from.email)}&su=${encodeURIComponent(`Re: ${message.subject ?? "your enquiry"}`)}` : undefined,
    replyLabel: "Reply by email",
  });

  if (alert.ok) {
    await db
      .from("inquiry_email_threads")
      .update({ status: "alerted", telegram_chat_id: alert.chatId ? Number(alert.chatId) : null, telegram_message_id: alert.messageId ?? null, alert_error: null })
      .eq("id", threadId);
    return;
  }

  await db.from("inquiry_email_threads").update({ alert_error: alert.error ?? "Unknown Telegram error" }).eq("id", threadId);
  await logAdminEvent({
    level: "error",
    source: "telegram",
    kind: "email_alert_failed",
    message: `Telegram alert for an email enquiry failed: ${alert.error ?? "unknown error"}`,
    context: { threadId, from: message.from.email, subject: message.subject },
  });
}
