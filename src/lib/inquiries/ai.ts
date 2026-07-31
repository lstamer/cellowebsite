import { createHash } from "node:crypto";

import { generateText, Output } from "ai";

import { requireEnv } from "@/lib/inquiries/env";
import {
  BUBBLE_DELIMITER,
  inquiryDraftSchema,
  inquiryExtractionSchema,
  type BrainDocRow,
  type InquiryAnalysis,
  type InquiryExtraction,
  type InquiryMessageRow,
  type MediaAssetRow,
  type ReplyExampleRow,
} from "@/lib/inquiries/schema";
import {
  getActiveBrainDocs,
  getActiveMediaAssets,
  getMatchingReplyExamples,
} from "@/lib/inquiries/supabase";
import type { ClientProfile } from "@/lib/inquiries/supabase";
import type { ZernioHistoryMessage } from "@/lib/inquiries/zernio";

const EXTRACTION_SYSTEM_PROMPT = `You analyse initial WhatsApp enquiries for Luke Stamer, a Cape Town cellist.

Extraction rules:
- Use only facts explicitly present in the messages. Unknown values must be null or omitted from arrays.
- A message may have several intents. Availability and pricing often occur together.
- Mark Cavendish or a referral as the source only when the sender explicitly says so.
- Never infer that a date is available or infer a price from historical-looking wording.
- event_date_iso may be populated only when the date resolves unambiguously. The current date and timezone are supplied below.
- Confidence measures the extraction, not the quality of the lead.`;

const HISTORY_RULES = `How to use the earlier conversation:
- If an EARLIER CONVERSATION section is present, this is an ongoing relationship, not a first contact. Do not introduce Luke again, do not ask for details already established there (name, event, date, location), and match the familiarity of the existing exchange.
- Treat "Luke:" lines as ground truth for what has already been said or promised. Never contradict them.
- The earlier conversation is context only — reply to the new messages.`;

const DRAFTING_RULES = `Drafting rules:
- Write as Luke in first-person singular, speaking warmly to one person.
- Use plain, natural South African/British English. No corporate language, hard sell, fake urgency, or generic AI phrasing.
- Acknowledge the concrete details they supplied so the sender feels seen.
- Ground every factual statement in the BUSINESS KNOWLEDGE below. If the knowledge does not cover something, do not invent it — say Luke will confirm.
- Never say a date is available, quote a price, promise a discount, or imply a calendar was checked.
- If availability or pricing was asked about, say Luke will check or confirm it properly.
- Ask at most three essential missing questions. Prioritise event date, event type, and location.
- If the enquiry is already detailed, do not make them repeat information or force them through a form.
- Never use an em dash (—) or en dash (–) anywhere in the draft. Rewrite with a full stop, comma, semicolon, or colon instead. A hyphen inside a hyphenated word (e.g. "four-piece") is fine.
- Keep the first reply between 40 and 120 words. Do not use an emoji by default.
- draft_messages is an array of WhatsApp bubbles. Default to ONE bubble. Use two (rarely three) only when it genuinely reads more naturally as separate messages — e.g. a warm acknowledgement followed by the practical questions. Never split mid-thought.
- This is a proposal only. A human will approve or reject it before it is sent.`;

const EXAMPLE_RULES = `How to use the examples:
- LEARNED CORRECTIONS are enquiries where a drafted reply was rejected and Luke wrote what should have been sent. When the current enquiry resembles a correction's situation, match Luke's replacement closely — its content, length, and tone. A correction applies only to similar enquiries; do not let it bleed into unrelated ones.
- VOICE EXAMPLES are real replies Luke sent. Imitate their voice and rhythm, not their specific facts.`;

const MEDIA_RULES = `Media rules:
- You may propose at most 2 media attachments, chosen ONLY from the MEDIA LIBRARY slugs below.
- Propose media only when it clearly helps this specific enquiry — for example they asked to see or hear Luke play, asked for photos/videos, or asked what the setup looks like.
- If nothing in the library fits, propose none. Never invent a slug.
- If you propose media, the draft text should read naturally alongside it (e.g. mention you're sending a clip).`;

function renderTranscript(messages: InquiryMessageRow[]): string {
  return messages
    .map((message) => {
      const attachments = message.attachments
        .map((attachment) => `[${attachment.type ?? "attachment"}]`)
        .join(" ");
      const content = [message.body?.trim(), attachments]
        .filter(Boolean)
        .join(" ");

      return `${message.occurred_at}: ${content || "[empty message]"}`;
    })
    .join("\n");
}

// Durable facts about this contact, accumulated across all past bursts —
// outlives the thread-history window. Only non-empty fields are shown.
export function renderClientProfile(profile: ClientProfile | null): string {
  if (!profile) return "";

  const fields: Array<[string, unknown]> = [
    ["Name", profile.display_name],
    ["Role", profile.role],
    ["Event", profile.event_type],
    ["Date", profile.event_date_text ?? profile.event_date_iso],
    ["Venue", profile.venue],
    ["Location", profile.location],
    ["Guests", profile.guest_count],
    ["Duration (min)", profile.duration_minutes],
    ["Budget mentioned", profile.budget_text],
    ["Quoted", profile.quoted_amount_text],
    ["Deposit", profile.deposit_status === "none" ? null : profile.deposit_status],
    ["Stage", profile.booking_stage === "enquiry" ? null : profile.booking_stage],
    [
      "Preferences",
      profile.preferences.length > 0 ? profile.preferences.join("; ") : null,
    ],
    ["Notes", profile.notes],
  ];

  const lines = fields
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([label, value]) => `- ${label}: ${value}`);

  if (lines.length === 0) return "";

  return `KNOWN CLIENT PROFILE (facts already established with this contact — do not re-ask these):\n${lines.join("\n")}`;
}

// Oldest-first history rendered for the prompt. Incoming messages that are
// part of the current unprocessed burst are dropped (they appear in the
// "message burst" section instead), and the total size is capped so a long
// thread cannot crowd out the rules.
export function renderConversationHistory(
  history: ZernioHistoryMessage[],
  burstMessages: InquiryMessageRow[],
): string {
  const earliestBurstAt = burstMessages.reduce<string | null>(
    (earliest, message) =>
      earliest === null || message.occurred_at < earliest
        ? message.occurred_at
        : earliest,
    null,
  );

  const prior = history.filter(
    (message) =>
      message.direction === "outgoing" ||
      message.sentAt === null ||
      earliestBurstAt === null ||
      message.sentAt < earliestBurstAt,
  );

  if (prior.length === 0) return "";

  const lines: string[] = [];
  let budget = 4_000;
  for (let index = prior.length - 1; index >= 0; index--) {
    const message = prior[index];
    const line = `${message.direction === "outgoing" ? "Luke" : "Customer"}: ${message.text}`;
    if (line.length > budget) break;
    budget -= line.length;
    lines.unshift(line);
  }

  return `${HISTORY_RULES}\n\nEARLIER CONVERSATION (oldest first, most recent ${lines.length} messages):\n${lines.join("\n")}`;
}

export function renderBrainDocs(docs: BrainDocRow[]): string {
  if (docs.length === 0) {
    return "BUSINESS KNOWLEDGE: none provided. Draft conservatively; commit to nothing factual.";
  }

  const rendered = docs
    .map((doc) => `## ${doc.title} (${doc.category})\n${doc.content}`)
    .join("\n\n");

  return `BUSINESS KNOWLEDGE (authoritative — ground factual statements here):\n${rendered}`;
}

export function renderReplyExamples(examples: ReplyExampleRow[]): string {
  if (examples.length === 0) return "";

  const corrections = examples.filter((example) => example.kind === "override");
  const voice = examples.filter((example) => example.kind !== "override");
  const sections: string[] = [EXAMPLE_RULES];

  if (corrections.length > 0) {
    sections.push(
      `LEARNED CORRECTIONS:\n${corrections
        .map((example, index) =>
          [
            `Correction ${index + 1}:`,
            `Customer wrote: ${example.customer_message}`,
            example.situation_summary
              ? `Situation: ${example.situation_summary}`
              : null,
            example.rejected_draft
              ? `Rejected draft: ${example.rejected_draft}`
              : null,
            `Luke sent instead: ${example.reply}`,
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n\n")}`,
    );
  }

  if (voice.length > 0) {
    sections.push(
      `VOICE EXAMPLES:\n${voice
        .map(
          (example, index) =>
            `Example ${index + 1}:\nCustomer wrote: ${example.customer_message}\nLuke replied: ${example.reply}`,
        )
        .join("\n\n")}`,
    );
  }

  return sections.join("\n\n");
}

export function renderMediaLibrary(assets: MediaAssetRow[]): string {
  if (assets.length === 0) {
    return "MEDIA LIBRARY: empty. proposed_media_slugs must be an empty array.";
  }

  const rendered = assets
    .map(
      (asset) =>
        `- slug: ${asset.slug} (${asset.media_type}) — ${asset.title}: ${asset.description}`,
    )
    .join("\n");

  return `${MEDIA_RULES}\n\nMEDIA LIBRARY:\n${rendered}`;
}

export function buildDraftingSystemPrompt(input: {
  brainDocs: BrainDocRow[];
  examples: ReplyExampleRow[];
  mediaAssets: MediaAssetRow[];
}): string {
  return [
    "You draft a proposed first WhatsApp reply for Luke Stamer, a Cape Town cellist. A human approves or rejects every draft before it is sent.",
    DRAFTING_RULES,
    renderBrainDocs(input.brainDocs),
    renderReplyExamples(input.examples),
    renderMediaLibrary(input.mediaAssets),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function createInquiryBatchKey(
  conversationId: string,
  messageIds: string[],
): string {
  return createHash("sha256")
    .update(`${conversationId}:${[...messageIds].sort().join(":")}`)
    .digest("hex");
}

function currentDateContext(): string {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return `Current date: ${date}\nTimezone: Africa/Johannesburg`;
}

export async function extractInquiryFacts(
  messages: InquiryMessageRow[],
  model: string,
  renderedHistory = "",
  renderedProfile = "",
): Promise<InquiryExtraction> {
  const result = await generateText({
    model,
    system: EXTRACTION_SYSTEM_PROMPT,
    output: Output.object({ schema: inquiryExtractionSchema }),
    prompt: [
      currentDateContext(),
      renderedProfile,
      renderedHistory,
      `Unprocessed message burst:\n${renderTranscript(messages)}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  return result.output;
}

export async function draftInquiryReply(input: {
  messages: InquiryMessageRow[];
  extraction: InquiryExtraction;
  brainDocs: BrainDocRow[];
  examples: ReplyExampleRow[];
  mediaAssets: MediaAssetRow[];
  model: string;
  renderedHistory?: string;
  renderedProfile?: string;
}): Promise<{ draft_reply: string; proposed_media_slugs: string[] }> {
  const result = await generateText({
    model: input.model,
    system: buildDraftingSystemPrompt(input),
    output: Output.object({ schema: inquiryDraftSchema }),
    prompt: [
      currentDateContext(),
      input.renderedProfile ?? "",
      input.renderedHistory ?? "",
      `What was understood from the enquiry:\n${JSON.stringify(input.extraction, null, 2)}`,
      `Message burst to reply to:\n${renderTranscript(input.messages)}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  const validSlugs = new Set(input.mediaAssets.map((asset) => asset.slug));

  return {
    draft_reply: result.output.draft_messages
      .map((bubble) => bubble.trim())
      .filter((bubble) => bubble.length > 0)
      .join(BUBBLE_DELIMITER),
    proposed_media_slugs: result.output.proposed_media_slugs.filter((slug) =>
      validSlugs.has(slug),
    ),
  };
}

export async function analyseInquiryMessages(
  messages: InquiryMessageRow[],
  options: {
    history?: ZernioHistoryMessage[];
    profile?: ClientProfile | null;
  } = {},
): Promise<{ analysis: InquiryAnalysis; model: string }> {
  requireEnv("AI_GATEWAY_API_KEY");
  const model = requireEnv("AI_MODEL");

  const renderedHistory = renderConversationHistory(
    options.history ?? [],
    messages,
  );
  const renderedProfile = renderClientProfile(options.profile ?? null);
  const extraction = await extractInquiryFacts(
    messages,
    model,
    renderedHistory,
    renderedProfile,
  );

  const [brainDocs, examples, mediaAssets] = await Promise.all([
    getActiveBrainDocs(),
    getMatchingReplyExamples(extraction.intents),
    getActiveMediaAssets(),
  ]);

  const draft = await draftInquiryReply({
    messages,
    extraction,
    brainDocs,
    examples,
    mediaAssets,
    model,
    renderedHistory,
    renderedProfile,
  });

  return {
    analysis: {
      ...extraction,
      draft_reply: draft.draft_reply,
      proposed_media_slugs: draft.proposed_media_slugs,
    },
    model,
  };
}
