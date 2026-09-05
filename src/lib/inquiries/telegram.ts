import { z } from "zod";

import { requireEnv } from "@/lib/inquiries/env";
import {
  splitReplyBubbles,
  type InquiryAnalysis,
  type InquiryMessageRow,
  type MediaAssetRow,
  type WebsiteLeadDetails,
} from "@/lib/inquiries/schema";

type InlineKeyboardButton =
  | { text: string; callback_data: string }
  | { text: string; url: string };

export type InlineKeyboard = { inline_keyboard: InlineKeyboardButton[][] };

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
    "Type a message (or reply to this card) with your own text to send that instead — I'll learn from it.",
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
          { text: "Dismiss", callback_data: `inq:d:${input.approvalId}` },
        ],
        // Second row on purpose: Suggest changes is a different class of
        // action, and a mis-tap next to Approve sends a real customer message.
        [
          {
            text: "✏️ Suggest changes",
            callback_data: `inq:sc:${input.approvalId}`,
          },
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
  // When set, the alert gains Available / Unavailable buttons whose taps
  // trigger the AI-drafted first outbound message for this website lead.
  availabilityLeadId?: string;
}): Promise<{
  ok: boolean;
  chatId?: string;
  messageId?: number;
  /** Why the send failed; only set when ok is false. */
  error?: string;
}> {
  try {
    const chatId = requireEnv("TELEGRAM_CHAT_ID");
    const isTappable = input.replyUrl?.startsWith("https://");

    const keyboard: InlineKeyboardButton[][] = [];
    if (isTappable && input.replyUrl) {
      keyboard.push([
        {
          text: input.replyLabel ?? "Reply on WhatsApp",
          url: input.replyUrl,
        },
      ]);
    }
    if (input.availabilityLeadId) {
      keyboard.push([
        {
          text: "Available ✅",
          callback_data: `wl:a:${input.availabilityLeadId}`,
        },
        {
          text: "Unavailable ❌",
          callback_data: `wl:u:${input.availabilityLeadId}`,
        },
      ]);
    }

    const result = await callTelegram("sendMessage", {
      chat_id: chatId,
      text: input.text.slice(0, 4_000),
      ...(keyboard.length > 0
        ? { reply_markup: { inline_keyboard: keyboard } }
        : {}),
    });
    const parsed = z
      .object({ message_id: z.number().int() })
      .safeParse(result);

    return {
      ok: true,
      chatId,
      messageId: parsed.success ? parsed.data.message_id : undefined,
    };
  } catch (error) {
    console.error("Telegram lead alert failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown Telegram error",
    };
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
  // Defaults to clearing the buttons; pass a keyboard to replace them (e.g.
  // the approved website-lead card swaps in the tap-to-send wa.me button).
  replyMarkup?: InlineKeyboard;
}): Promise<void> {
  await callTelegram("editMessageText", {
    chat_id: input.chatId,
    message_id: input.messageId,
    text: input.text.slice(0, 4_096),
    reply_markup: input.replyMarkup ?? { inline_keyboard: [] },
  });
}

// Swap a card's buttons without touching its text — used on the lead alert,
// whose original text is not reconstructable at edit time.
export async function editTelegramReplyMarkup(input: {
  chatId: string | number;
  messageId: number;
  replyMarkup: InlineKeyboard;
}): Promise<void> {
  await callTelegram("editMessageReplyMarkup", {
    chat_id: input.chatId,
    message_id: input.messageId,
    reply_markup: input.replyMarkup,
  });
}

// wa.me deep links open WhatsApp with the message prefilled, so the "send" is
// a single tap on Luke's phone. Telegram URL buttons tolerate roughly 2k
// characters; past that the link degrades to a bare chat-open and the card
// body carries the text for copy-paste.
export const WA_ME_URL_MAX = 2_000;

export function buildWaMePrefill(
  digits: string,
  text: string,
): { url: string; truncated: boolean } {
  const collapsed = splitReplyBubbles(text).join("\n\n") || text.trim();
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(collapsed)}`;

  if (url.length <= WA_ME_URL_MAX) {
    return { url, truncated: false };
  }

  return { url: `https://wa.me/${digits}`, truncated: true };
}

function leadDetailLines(lead: WebsiteLeadDetails): string {
  const rows: Array<[string, string | number | boolean | null]> = [
    ["Name", [lead.firstName, lead.lastName].filter(Boolean).join(" ")],
    ["Event", lead.eventType],
    [
      "Date",
      lead.dateFlexible
        ? `${lead.eventDateText ?? "TBD"} (flexible)`
        : lead.eventDateText,
    ],
    ["Location", lead.location],
    ["Guests", lead.guestCount],
    [
      "Performance",
      lead.performanceMinutes === null ? null : `${lead.performanceMinutes} min`,
    ],
    ["Role", lead.bookerRole],
  ];

  return rows
    .map(([label, value]) => `${label}: ${displayValue(value ?? null)}`)
    .join("\n");
}

export function buildTelegramWebsiteLeadReviewText(input: {
  lead: WebsiteLeadDetails;
  draft: string;
}): string {
  const { lead } = input;
  const availabilityLine =
    lead.availability === "available"
      ? "You marked this date: AVAILABLE ✅"
      : "You marked this date: UNAVAILABLE ❌";
  const messageBlock = lead.message ? `\nTheir message:\n${lead.message}\n` : "";

  const text = [
    `🌐 Website lead reply — ${lead.firstName}`,
    "",
    availabilityLine,
    "",
    "Draft reply — this exact text will be prefilled in WhatsApp:",
    input.draft,
    "",
    leadDetailLines(lead),
    messageBlock,
    "Approve to get a tap-to-send WhatsApp button, or type a message (or reply to this card) with your own text to send that instead — I'll learn from it.",
  ].join("\n");

  return text.slice(0, 4_000);
}

export async function sendTelegramWebsiteLeadReview(input: {
  leadId: string;
  lead: WebsiteLeadDetails;
  draft: string;
}): Promise<{ chatId: string; messageId: number }> {
  const chatId = requireEnv("TELEGRAM_CHAT_ID");
  const result = await callTelegram("sendMessage", {
    chat_id: chatId,
    text: buildTelegramWebsiteLeadReviewText(input),
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Approve", callback_data: `wl:s:${input.leadId}` },
          { text: "Dismiss", callback_data: `wl:d:${input.leadId}` },
        ],
        [
          {
            text: "✏️ Suggest changes",
            callback_data: `wl:sc:${input.leadId}`,
          },
        ],
      ],
    },
  });
  const parsed = z.object({ message_id: z.number().int() }).parse(result);

  return { chatId, messageId: parsed.message_id };
}

function formatServiceWindowHint(iso: string | null): string {
  if (!iso) return "";

  const expires = new Date(iso);
  if (Number.isNaN(expires.getTime())) return "";

  const formatted = expires.toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `\nWhatsApp's reply window closes ${formatted} — answer before then so the reply can still send.`;
}

export function buildTelegramAvailabilityQuestionText(input: {
  contactName: string | null;
  eventDateText: string | null;
  eventContext: string | null;
  serviceWindowExpiresAt: string | null;
}): string {
  const who = input.contactName?.trim() || "A WhatsApp enquiry";
  const dateLine = input.eventDateText
    ? `📅 Are you available on ${input.eventDateText}?`
    : "📅 Are you available for this enquiry? (No date given yet.)";
  const context = input.eventContext ? `\n${input.eventContext}\n` : "";

  const text = [
    dateLine,
    "",
    `${who} is asking about availability.`,
    context,
    "Your answer unblocks the reply draft: the AI will state it as fact, then show you the draft to approve as usual.",
    formatServiceWindowHint(input.serviceWindowExpiresAt),
  ].join("\n");

  return text.slice(0, 4_000);
}

export async function sendTelegramAvailabilityQuestion(input: {
  checkId: string;
  contactName: string | null;
  eventDateText: string | null;
  eventContext: string | null;
  serviceWindowExpiresAt: string | null;
}): Promise<{ chatId: string; messageId: number }> {
  const chatId = requireEnv("TELEGRAM_CHAT_ID");
  const result = await callTelegram("sendMessage", {
    chat_id: chatId,
    text: buildTelegramAvailabilityQuestionText(input),
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Available ✅", callback_data: `inq:v:a:${input.checkId}` },
          { text: "Unavailable ❌", callback_data: `inq:v:u:${input.checkId}` },
        ],
      ],
    },
  });
  const parsed = z.object({ message_id: z.number().int() }).parse(result);

  return { chatId, messageId: parsed.message_id };
}

export async function sendTelegramOverrideConfirm(input: {
  confirmId: string;
  targetName: string;
  overrideText: string;
  chatId: string | number;
  replyToMessageId: number;
}): Promise<{ messageId: number }> {
  const result = await callTelegram("sendMessage", {
    chat_id: input.chatId,
    text: `Send this to ${input.targetName}?\n\n${input.overrideText}`.slice(
      0,
      4_000,
    ),
    reply_parameters: { message_id: input.replyToMessageId },
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Send", callback_data: `ovr:s:${input.confirmId}` },
          { text: "Cancel", callback_data: `ovr:c:${input.confirmId}` },
        ],
      ],
    },
  });
  const parsed = z.object({ message_id: z.number().int() }).parse(result);

  return { messageId: parsed.message_id };
}

export function buildTelegramSuggestChangesPromptText(input: {
  targetName: string;
  currentDraft: string;
}): string {
  const text = [
    `✏️ Suggest changes — reply for ${displayValue(input.targetName)}`,
    "",
    "Send me a voicenote now (or type your notes) describing what you want changed. I'll redraft and show you the new version to approve.",
    "",
    "Current draft:",
    input.currentDraft,
  ].join("\n");

  return text.slice(0, 4_000);
}

export async function sendTelegramSuggestChangesPrompt(input: {
  requestId: string;
  targetName: string;
  currentDraft: string;
  // Optional so the prompt can be threaded under the card Luke just tapped,
  // matching how sendTelegramOverrideConfirm replies in place.
  chatId?: string | number;
  replyToMessageId?: number;
}): Promise<{ chatId: string | number; messageId: number }> {
  const chatId = input.chatId ?? requireEnv("TELEGRAM_CHAT_ID");
  const result = await callTelegram("sendMessage", {
    chat_id: chatId,
    text: buildTelegramSuggestChangesPromptText(input),
    ...(input.replyToMessageId
      ? { reply_parameters: { message_id: input.replyToMessageId } }
      : {}),
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚫 Cancel", callback_data: `sug:x:${input.requestId}` }],
      ],
    },
  });
  const parsed = z.object({ message_id: z.number().int() }).parse(result);

  return { chatId, messageId: parsed.message_id };
}

export function buildTelegramRedraftText(input: {
  draft: string;
  targetName: string;
  instructions: string;
  revision: number;
  // The attachments already chosen for this enquiry. A revision rewrites the
  // words only: complete_suggest_change_request updates the draft text and
  // leaves proposed_media_slugs untouched, so these still send on Approve.
  // Without them the card's "this exact text will be sent" reads as text-only
  // and Luke approves a message carrying a clip he may have asked to drop.
  //
  // Optional because the caller in trigger/inquiries.ts owns the media read;
  // it SHOULD pass the target's current attachment set (the same
  // getMediaAssetsBySlugs result the send path uses) so the card can name it.
  // Omitted renders nothing, exactly as before.
  mediaAssets?: MediaAssetRow[];
}): string {
  // Same presentation as the first-draft card, plus the one thing that card
  // does not have to say: a revision cannot change this set either way.
  const mediaLines =
    input.mediaAssets && input.mediaAssets.length > 0
      ? [
          `Attachments on approve: ${input.mediaAssets
            .map((asset) => `${asset.title} (${asset.media_type})`)
            .join(", ")}`,
          "A revision changes the words only, so these attachments are unchanged and still send on approve.",
          "",
        ]
      : [];
  // The new draft is the whole point of the card, so it lives in the fixed
  // section and the transcribed instructions absorb whatever budget is left.
  const fixed = [
    `✏️ Revision ${input.revision} — reply for ${displayValue(input.targetName)}`,
    "",
    "Proposed reply — this exact text will be sent:",
    input.draft,
    "",
    ...mediaLines,
  ].join("\n");
  const instructionsHeader = "You asked for:\n";
  const remaining = Math.max(
    0,
    4_000 - fixed.length - instructionsHeader.length - 3,
  );
  const collapsed = input.instructions.trim().replace(/\s+/g, " ");
  const visibleInstructions =
    collapsed.length <= remaining
      ? `"${collapsed}"`
      : `"${collapsed.slice(0, Math.max(0, remaining - 26))}…" [notes truncated]`;
  const text = `${fixed}${instructionsHeader}${visibleInstructions}`;

  return text.slice(0, 4_000);
}

export async function sendTelegramRedraftReview(input: {
  target: "approval" | "website_lead";
  targetId: string;
  draft: string;
  targetName: string;
  instructions: string;
  revision: number;
  // Forwarded straight to buildTelegramRedraftText: the attachments that still
  // send when this card's Approve is tapped. The caller should supply them.
  mediaAssets?: MediaAssetRow[];
}): Promise<{ chatId: string; messageId: number }> {
  const chatId = requireEnv("TELEGRAM_CHAT_ID");
  const verbs =
    input.target === "approval"
      ? { approve: "inq:a", dismiss: "inq:d", suggest: "inq:sc" }
      : { approve: "wl:s", dismiss: "wl:d", suggest: "wl:sc" };
  const result = await callTelegram("sendMessage", {
    chat_id: chatId,
    text: buildTelegramRedraftText(input),
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Approve",
            callback_data: `${verbs.approve}:${input.targetId}`,
          },
          {
            text: "Dismiss",
            callback_data: `${verbs.dismiss}:${input.targetId}`,
          },
        ],
        // The loop has to be repeatable, so every redraft can itself be redrafted.
        [
          {
            text: "✏️ Suggest changes",
            callback_data: `${verbs.suggest}:${input.targetId}`,
          },
        ],
      ],
    },
  });
  const parsed = z.object({ message_id: z.number().int() }).parse(result);

  return { chatId, messageId: parsed.message_id };
}
