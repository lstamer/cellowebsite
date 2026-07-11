import { z } from "zod";

import { requireEnv } from "@/lib/inquiries/env";
import type {
  InquiryAnalysis,
  InquiryMessageRow,
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
  const fixed = [
    "🎻 New WhatsApp enquiry",
    "",
    "Proposed reply — this exact text will be sent:",
    analysis.draft_reply,
    "",
    `Intent: ${analysis.intents.join(", ")}`,
    `Lead: ${analysis.lead_temperature}`,
    `Confidence: ${Math.round(analysis.confidence * 100)}%`,
    "",
    details,
    "",
    "Summary:",
    analysis.summary,
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
