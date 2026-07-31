import { z } from "zod";

import { requireEnv } from "@/lib/inquiries/env";
import {
  splitReplyBubbles,
  type InquiryAnalysis,
  type InquiryMessageRow,
  type MediaAssetRow,
} from "@/lib/inquiries/schema";

const telegramResponseSchema = z.object({
  ok: z.literal(true),
  result: z.unknown(),
});

export class TelegramApiError extends Error {
  constructor(
    message: string,
    public readonly uncertain: boolean,
  ) {
    super(message);
    this.name = "TelegramApiError";
  }
}

async function callTelegram(
  method: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(
      `https://api.telegram.org/bot${requireEnv("TELEGRAM_BOT_TOKEN")}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
  } catch (error) {
    throw new TelegramApiError(
      `Telegram ${method} network error: ${error instanceof Error ? error.message : "unknown error"}`,
      true,
    );
  }
  const raw = await response.text();

  if (!response.ok) {
    throw new TelegramApiError(
      `Telegram ${method} failed (${response.status}): ${raw.slice(0, 500)}`,
      false,
    );
  }

  try {
    return telegramResponseSchema.parse(JSON.parse(raw)).result;
  } catch (error) {
    throw new TelegramApiError(
      `Telegram ${method} returned an invalid success response: ${error instanceof Error ? error.message : "unknown error"}`,
      true,
    );
  }
}

function displayValue(value: string | number | boolean | null): string {
  if (value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const text = String(value);
  return text.length <= 180 ? text : `${text.slice(0, 177)}…`;
}

export function buildTelegramReviewText(input: {
  analysis: InquiryAnalysis;
  messages: InquiryMessageRow[];
  mediaAssets?: MediaAssetRow[];
}): string {
  const { analysis } = input;
  const transcript = input.messages
    .map((message) => `• ${message.body?.trim() || "[attachment]"}`)
    .join("\n");
  const details = [
    `Name: ${displayValue(analysis.event.contact_name)}`,
    `Event: ${displayValue(analysis.event.event_type)}`,
    `Date: ${displayValue(analysis.event.event_date_text)}`,
    `Location: ${displayValue(analysis.event.location ?? analysis.event.venue)}`,
    `Source: ${analysis.source}`,
  ].join("\n");
  const mediaLine =
    input.mediaAssets && input.mediaAssets.length > 0
      ? `Attachments on approve: ${input.mediaAssets
          .map((asset) => `${asset.title} (${asset.media_type})`)
          .join(", ")}\n`
      : "";
  const bubbles = splitReplyBubbles(analysis.draft_reply);
  const proposedReply =
    bubbles.length > 1
      ? bubbles
          .map((bubble, index) => `[bubble ${index + 1}/${bubbles.length}]\n${bubble}`)
          .join("\n\n")
      : analysis.draft_reply;
  const fixed = [
    "🎻 New WhatsApp enquiry",
    "",
    bubbles.length > 1
      ? `Proposed reply — sent as ${bubbles.length} separate WhatsApp bubbles, exactly as shown:`
      : "Proposed reply — this exact text will be sent:",
    proposedReply,
    "",
    `${mediaLine}Intent: ${analysis.intents.join(", ")}`,
    `Lead: ${analysis.lead_temperature}`,
    `Confidence: ${Math.round(analysis.confidence * 100)}%`,
    "",
    details,
    "",
    "Summary:",
    analysis.summary,
    "",
    "Reply to this card with your own text to send that instead — I'll learn from it.",
    "",
  ].join("\n");
  const transcriptHeader = "Incoming message burst:\n";
  const remaining = Math.max(0, 4_000 - fixed.length - transcriptHeader.length - 3);
  const visibleTranscript =
    transcript.length <= remaining
      ? transcript
      : `${transcript.slice(0, Math.max(0, remaining - 24))}\n[…transcript truncated]`;
  const text = `${fixed}${transcriptHeader}${visibleTranscript}`;

  return text.slice(0, 4_000);
}

export async function sendTelegramReview(input: {
  approvalId: string;
  analysis: InquiryAnalysis;
  messages: InquiryMessageRow[];
  mediaAssets?: MediaAssetRow[];
}): Promise<{ chatId: string; messageId: number }> {
  const chatId = requireEnv("TELEGRAM_CHAT_ID");
  const result = await callTelegram("sendMessage", {
    chat_id: chatId,
    text: buildTelegramReviewText(input),
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Approve", callback_data: `inq:a:${input.approvalId}` },
          { text: "Reject", callback_data: `inq:r:${input.approvalId}` },
        ],
      ],
    },
  });
  const parsed = z.object({ message_id: z.number().int() }).parse(result);

  return { chatId, messageId: parsed.message_id };
}

/**
 * Push a website form submission into the same Telegram chat that carries the
 * WhatsApp review cards, so every inbound lead lands in one place.
 *
 * Website leads arrive already structured, so there is nothing to draft or
 * approve — this is a notification with an optional one-tap reply shortcut.
 * It never throws: it resolves to false when Telegram is unconfigured or the
 * call fails, letting the caller fall back to another channel.
 */
export async function sendTelegramLeadAlert(input: {
  text: string;
  replyUrl?: string;
  replyLabel?: string;
}): Promise<boolean> {
  try {
    const chatId = requireEnv("TELEGRAM_CHAT_ID");
    const isTappable = input.replyUrl?.startsWith("https://");

    await callTelegram("sendMessage", {
      chat_id: chatId,
      text: input.text.slice(0, 4_000),
      ...(isTappable
        ? {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: input.replyLabel ?? "Reply on WhatsApp",
                    url: input.replyUrl,
                  },
                ],
              ],
            },
          }
        : {}),
    });

    return true;
  } catch (error) {
    console.error("Telegram lead alert failed:", error);
    return false;
  }
}

export async function sendTelegramMessage(input: {
  chatId: string | number;
  text: string;
  replyToMessageId?: number;
}): Promise<void> {
  await callTelegram("sendMessage", {
    chat_id: input.chatId,
    text: input.text.slice(0, 4_000),
    ...(input.replyToMessageId
      ? { reply_parameters: { message_id: input.replyToMessageId } }
      : {}),
  });
}

export async function answerTelegramCallback(input: {
  callbackQueryId: string;
  text: string;
  showAlert?: boolean;
}): Promise<void> {
  await callTelegram("answerCallbackQuery", {
    callback_query_id: input.callbackQueryId,
    text: input.text.slice(0, 200),
    show_alert: input.showAlert ?? false,
  });
}

export async function editTelegramReview(input: {
  chatId: string | number;
  messageId: number;
  text: string;
}): Promise<void> {
  await callTelegram("editMessageText", {
    chat_id: input.chatId,
    message_id: input.messageId,
    text: input.text.slice(0, 4_096),
    reply_markup: { inline_keyboard: [] },
  });
}
