import { createHash } from "node:crypto";

import { generateText, Output } from "ai";

import { requireEnv } from "@/lib/inquiries/env";
import {
  BUBBLE_DELIMITER,
  inquiryDraftSchema,
  inquiryExtractionSchema,
  websiteLeadDraftSchema,
  type AvailabilityFact,
  type BrainDocRow,
  type InquiryAnalysis,
  type InquiryExtraction,
  type InquiryMessageRow,
  type MediaAssetRow,
  type ReplyExampleRow,
  type WebsiteLeadDetails,
} from "@/lib/inquiries/schema";
import {
  getActiveBrainDocs,
  getActiveMediaAssets,
  getMatchingReplyExamples,
} from "@/lib/inquiries/supabase";
import type {
  ClientProfile,
  SuggestChangeInstructionHistory,
} from "@/lib/inquiries/supabase";
import {
  flushInquiryTraces,
  inquiryTelemetry,
  traceInquiryRun,
} from "@/lib/inquiries/tracing";
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
- The earlier conversation is context only — respond directly to the incoming message(s), not the entire thread.`;

const DRAFTING_RULES = `Drafting rules:
- Write as Luke in first-person singular & address the sender directly.
- Use plain, natural South African/British English. No corporate language, hard sell, fake urgency, or generic AI phrasing.
- Briefly acknowledge the details they supply so the sender feels seen.
- Ground every factual statement in the BUSINESS KNOWLEDGE below. If the knowledge does not cover something, do not invent it — say "I'll confirm..."
- Never say a date is available, quote a price, promise a discount, or imply a calendar was checked unless it's clear from conversation history.
- If availability is asked, say Luke (you) will check and let them know soon.
- Ask at most three essential missing questions. Prioritise event date, event type, and location. Guest count is also useful for inferring the type of client they are.
- If the enquiry is already detailed, do not make them repeat information.
- EM DASHES ARE STRICTLY FORBIDDEN. Use a full stop, comma, semicolon, or colon instead. A hyphen inside a hyphenated word (e.g. "four-piece") is fine.
- Keep the first reply between 40 and 120 words.
- The emoji's 🙂, 🙏, 👌 and 😊 are allowed for acknowledgement sections of the reply.
- draft_messages is an array of WhatsApp bubbles. Default to ONE bubble. Use two (rarely three) only when it genuinely reads more naturally as separate messages — e.g. a warm acknowledgement followed by the practical questions. Never split mid-thought.
- This is a proposal only. A human will approve or reject it before it is sent.`;

// The two availability bullets that a human-confirmed answer replaces. They
// must match DRAFTING_RULES exactly; buildDraftingRules asserts the swap took.
const AVAILABILITY_BAN_BULLET =
  "- Never say a date is available, quote a price, promise a discount, or imply a calendar was checked unless it's clear from conversation history.";
const AVAILABILITY_DEFER_BULLET =
  "- If availability is asked, say Luke (you) will check and let them know soon.";

/**
 * The drafting rules, optionally rewritten around a human-confirmed
 * availability answer. Without a fact the output is byte-identical to the
 * standing rules; with one, the blanket availability ban is narrowed to
 * "every date except the one Luke confirmed" while the price ban stays.
 */
export function buildDraftingRules(
  options: { confirmedAvailability?: AvailabilityFact | null } = {},
): string {
  const fact = options.confirmedAvailability;
  if (!fact) return DRAFTING_RULES;

  const dateText = fact.dateText?.trim() || "the requested date";
  const factBullet =
    fact.availability === "available"
      ? `- Luke has personally confirmed he IS available on ${dateText}. Say so plainly and confidently. This human-confirmed fact overrides the availability policy in BUSINESS KNOWLEDGE for this one date only; every other date remains unconfirmed.`
      : `- Luke has personally confirmed he is NOT available on ${dateText}. Decline warmly and briefly, thank them for the enquiry, and do not invent a reason. If their messages hint the date could move, ask whether it is flexible.`;

  // Each replacement is asserted separately: a half-applied swap would ship a
  // prompt that both states the confirmed answer AND says Luke still needs to
  // check, which is worse than failing loudly.
  const withFact = DRAFTING_RULES.replace(
    AVAILABILITY_BAN_BULLET,
    `${factBullet}\n- Never quote a price, promise a discount, or state availability for any date other than the one Luke confirmed.`,
  );
  if (withFact === DRAFTING_RULES) {
    throw new Error(
      "buildDraftingRules: the availability ban bullet drifted from DRAFTING_RULES",
    );
  }

  const rules = withFact.replace(
    AVAILABILITY_DEFER_BULLET,
    "- Do not say you still need to check the date; Luke already has.",
  );
  if (rules === withFact) {
    throw new Error(
      "buildDraftingRules: the availability defer bullet drifted from DRAFTING_RULES",
    );
  }

  return rules;
}

export function renderAvailabilityFact(
  fact: AvailabilityFact | null | undefined,
): string {
  if (!fact) return "";

  const dateText = fact.dateText?.trim() || "the requested date";

  return fact.availability === "available"
    ? `HUMAN-CONFIRMED AVAILABILITY: Luke has personally confirmed he IS available on ${dateText}. State it as fact. This overrides the availability policy above for this one date only.`
    : `HUMAN-CONFIRMED AVAILABILITY: Luke has personally confirmed he is NOT available on ${dateText}. The draft must be a warm, brief decline. This overrides the availability policy above for this one date only.`;
}

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
function historyLine(message: ZernioHistoryMessage): string {
  return `${message.direction === "outgoing" ? "Luke" : "Customer"}: ${message.text}`;
}

/**
 * Rendered-character ceiling under which the whole thread is shown as-is.
 *
 * A rendered line averages ~90 characters ("Customer: " plus a typical
 * WhatsApp message), so 60,000 characters is roughly 650 messages, about
 * 15k tokens. That sits comfortably inside a 200k-context model alongside the
 * brain docs, learned corrections, media library and the burst itself, so a
 * years-long client relationship reaches the drafter intact rather than being
 * cut down to a handful of recent lines.
 */
const HISTORY_VERBATIM_BUDGET = 60_000;

// Past the verbatim budget the thread is trimmed to its newest slice rather
// than truncated to the ceiling, leaving headroom so the drafter still sees
// the prompt's other sections. The omitted count is stated in the prompt so
// the model knows the relationship runs deeper than what it was shown.
const HISTORY_TRIM_TARGET = 40_000;

// A floor that outranks the trim target: however large these messages are,
// the newest ones are the ones being replied to and must never be dropped.
const HISTORY_MIN_MESSAGES = 10;

/**
 * Per-message clip ceiling. A pathological-data guard, not a budget control.
 *
 * WhatsApp caps a single message at 4,096 characters, so no real message from a
 * customer can ever reach 10,000 — in normal operation this NEVER fires, and a
 * detailed 3,000-character wedding brief reaches the drafter verbatim. It exists
 * only for text that did not come from WhatsApp's own limit: a transcript pasted
 * in by another system, a malformed provider payload, a future channel with no
 * cap. Such an entry is clipped rather than dropped, because dropping it used to
 * empty the window entirely and take the HISTORY_RULES block with it, making the
 * model greet an established client as a stranger.
 *
 * Thread-level size is handled separately by HISTORY_VERBATIM_BUDGET and
 * HISTORY_TRIM_TARGET, which drop whole oldest messages. Clipping must not do
 * that job: it would silently delete real customer detail while tens of
 * thousands of characters of budget sat unused.
 */
const HISTORY_MAX_MESSAGE_CHARS = 10_000;
const HISTORY_TRUNCATION_MARKER = " [...truncated]";

type WindowedMessage = {
  message: ZernioHistoryMessage;
  line: string;
  truncated: boolean;
};

function clipMessage(message: ZernioHistoryMessage): WindowedMessage {
  if (message.text.length <= HISTORY_MAX_MESSAGE_CHARS) {
    return { message, line: historyLine(message), truncated: false };
  }

  const clipped: ZernioHistoryMessage = {
    ...message,
    text: `${message.text.slice(0, HISTORY_MAX_MESSAGE_CHARS)}${HISTORY_TRUNCATION_MARKER}`,
  };

  return { message: clipped, line: historyLine(clipped), truncated: true };
}

// Two-stage narrowing, reported separately so a trace never blames the
// character budget for messages that were simply echoes of the current burst.
// `prior` drops the burst echo; `included` then applies the tiered budget.
function selectHistoryWindow(
  history: ZernioHistoryMessage[],
  burstMessages: InquiryMessageRow[],
): {
  prior: ZernioHistoryMessage[];
  included: ZernioHistoryMessage[];
  individuallyTruncated: number;
  omittedForBudget: number;
} {
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

  const windowed = prior.map(clipMessage);
  const totalChars = windowed.reduce(
    (sum, entry) => sum + entry.line.length + 1,
    0,
  );

  // Walk newest to oldest, keeping messages until the trim target is reached.
  // The message floor wins over the target, so the window is never empty no
  // matter how long the individual messages are.
  let firstKept = 0;
  if (totalChars > HISTORY_VERBATIM_BUDGET) {
    let used = 0;
    firstKept = windowed.length;
    for (let index = windowed.length - 1; index >= 0; index--) {
      const cost = windowed[index].line.length + 1;
      const keptSoFar = windowed.length - index - 1;
      if (used + cost > HISTORY_TRIM_TARGET && keptSoFar >= HISTORY_MIN_MESSAGES) {
        break;
      }
      used += cost;
      firstKept = index;
    }
  }

  const kept = windowed.slice(firstKept);

  return {
    prior,
    included: kept.map((entry) => entry.message),
    individuallyTruncated: kept.filter((entry) => entry.truncated).length,
    omittedForBudget: firstKept,
  };
}

export function renderConversationHistory(
  history: ZernioHistoryMessage[],
  burstMessages: InquiryMessageRow[],
): string {
  const { included, omittedForBudget } = selectHistoryWindow(
    history,
    burstMessages,
  );
  if (included.length === 0) return "";

  // Stated explicitly: without it the model would read a trimmed thread as the
  // whole relationship and could re-ask something settled in the omitted part.
  const omissionNotice =
    omittedForBudget > 0
      ? `[${omittedForBudget} earlier message${omittedForBudget === 1 ? "" : "s"} in this thread are not shown. The relationship goes back further than what follows.]\n`
      : "";

  return `${HISTORY_RULES}\n\nEARLIER CONVERSATION (oldest first, most recent ${included.length} messages):\n${omissionNotice}${included
    .map(historyLine)
    .join("\n")}`;
}

/**
 * How far back the prompt's history actually reaches, for tracing. Uses the
 * same selection as renderConversationHistory, so the numbers describe exactly
 * what the model was shown rather than what was fetched.
 */
export function describeHistoryWindow(
  history: ZernioHistoryMessage[],
  burstMessages: InquiryMessageRow[],
): {
  fetched: number;
  excluded_as_current_burst: number;
  dropped_for_budget: number;
  individually_truncated: number;
  omitted_for_budget: number;
  included: number;
  oldest_at: string | null;
  newest_at: string | null;
} {
  const { prior, included, individuallyTruncated, omittedForBudget } =
    selectHistoryWindow(history, burstMessages);
  const timestamps = included
    .map((message) => message.sentAt)
    .filter((sentAt): sentAt is string => sentAt !== null)
    .sort();

  return {
    fetched: history.length,
    excluded_as_current_burst: history.length - prior.length,
    dropped_for_budget: prior.length - included.length,
    // How many included messages had their own text clipped, and how many
    // older messages never made the window at all — the two ways the prompt
    // can hold less than what was fetched.
    individually_truncated: individuallyTruncated,
    omitted_for_budget: omittedForBudget,
    included: included.length,
    oldest_at: timestamps[0] ?? null,
    newest_at: timestamps[timestamps.length - 1] ?? null,
  };
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
  availabilityFact?: AvailabilityFact | null;
}): string {
  return [
    "You draft a proposed first WhatsApp reply for Luke Stamer, a Cape Town cellist. A human approves or rejects every draft before it is sent.",
    buildDraftingRules({ confirmedAvailability: input.availabilityFact }),
    renderBrainDocs(input.brainDocs),
    // After the brain docs so the human-confirmed fact outranks the standing
    // availability-policy doc on recency.
    renderAvailabilityFact(input.availabilityFact),
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
    instructions: EXTRACTION_SYSTEM_PROMPT,
    output: Output.object({ schema: inquiryExtractionSchema }),
    // Instructions are passed to the tracer separately: the AI SDK sends them
    // outside the messages array, and LangSmith records only that array, so
    // otherwise the trace would show the burst without the rules applied to it.
    telemetry: inquiryTelemetry("extract-inquiry-facts", EXTRACTION_SYSTEM_PROMPT),
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
  availabilityFact?: AvailabilityFact | null;
}): Promise<{ draft_reply: string; proposed_media_slugs: string[] }> {
  const instructions = buildDraftingSystemPrompt({
    brainDocs: input.brainDocs,
    examples: input.examples,
    mediaAssets: input.mediaAssets,
    availabilityFact: input.availabilityFact,
  });
  const result = await generateText({
    model: input.model,
    instructions,
    output: Output.object({ schema: inquiryDraftSchema }),
    // Passed to the tracer too, so the brain docs, learned corrections, and
    // media library the draft was grounded in are visible in the trace.
    telemetry: inquiryTelemetry("draft-inquiry-reply", instructions),
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

// The trigger task's chance to pause the pipeline between extraction and
// drafting: it sees the extraction, may ask Luke about availability on
// Telegram, and either resumes drafting (optionally with the confirmed fact)
// or pauses the run entirely.
export type AvailabilityGateDecision =
  | { action: "continue"; availabilityFact?: AvailabilityFact | null }
  | { action: "pause" };

export type InquiryAnalysisOutcome =
  | {
      paused: false;
      analysis: InquiryAnalysis;
      model: string;
      availabilityFact: AvailabilityFact | null;
    }
  | { paused: true; extraction: InquiryExtraction; model: string };

export async function runInquiryAnalysis(
  messages: InquiryMessageRow[],
  options: {
    history?: ZernioHistoryMessage[];
    profile?: ClientProfile | null;
    conversationId?: string;
    availabilityFact?: AvailabilityFact | null;
    availabilityGate?: (
      extraction: InquiryExtraction,
      context: { model: string },
    ) => Promise<AvailabilityGateDecision>;
  } = {},
): Promise<InquiryAnalysisOutcome> {
  requireEnv("AI_GATEWAY_API_KEY");
  const model = requireEnv("AI_MODEL");

  const renderedHistory = renderConversationHistory(
    options.history ?? [],
    messages,
  );
  const renderedProfile = renderClientProfile(options.profile ?? null);

  try {
    // One LangSmith trace per burst: extraction and drafting nest underneath,
    // so a rejected draft can be inspected end to end from the Telegram review.
    return await traceInquiryRun(
      {
        name: "inquiry-agent",
        conversationId: options.conversationId,
        metadata: {
          model,
          message_count: messages.length,
          history: describeHistoryWindow(options.history ?? [], messages),
          history_chars: renderedHistory.length,
          has_profile: renderedProfile.length > 0,
          profile_chars: renderedProfile.length,
        },
        // Chat-shaped IO so LangSmith's Threads view renders the enquiry and
        // the proposed reply as a conversation. The rendered history and
        // profile ride alongside so the trace shows every piece of context the
        // model was given, not just the new messages.
        inputs: {
          messages: messages.map((message) => ({
            role: "user",
            content: message.body ?? "[attachment]",
          })),
          conversation_history: renderedHistory || "(none)",
          client_profile: renderedProfile || "(none)",
          burst_transcript: renderTranscript(messages),
        },
        outputs: (outcome: InquiryAnalysisOutcome) =>
          outcome.paused
            ? {
                paused: true,
                intents: outcome.extraction.intents,
                summary: outcome.extraction.summary,
                extraction: outcome.extraction,
              }
            : {
                messages: [
                  {
                    role: "assistant",
                    content: outcome.analysis.draft_reply
                      .split(BUBBLE_DELIMITER)
                      .join("\n\n"),
                  },
                ],
                draft_bubbles: outcome.analysis.draft_reply.split(
                  BUBBLE_DELIMITER,
                ),
                proposed_media_slugs: outcome.analysis.proposed_media_slugs,
                intents: outcome.analysis.intents,
                lead_temperature: outcome.analysis.lead_temperature,
                summary: outcome.analysis.summary,
                availability_fact: outcome.availabilityFact,
                extraction: outcome.analysis,
              },
      },
      async (): Promise<InquiryAnalysisOutcome> => {
        const extraction = await extractInquiryFacts(
          messages,
          model,
          renderedHistory,
          renderedProfile,
        );

        // The availability gate sits between the stages: the caller may pause
        // here (question sent to Luke on Telegram, burst left unprocessed) or
        // hand back the human-confirmed fact for the draft to state.
        let availabilityFact = options.availabilityFact ?? null;
        if (options.availabilityGate) {
          const decision = await options.availabilityGate(extraction, { model });
          if (decision.action === "pause") {
            return { paused: true, extraction, model };
          }
          availabilityFact = decision.availabilityFact ?? availabilityFact;
        }

        // Traced as its own step so the trace shows which brain docs, learned
        // corrections, and media the draft was actually grounded in. Retrieval
        // is intent-driven, so this varies run to run.
        const [brainDocs, examples, mediaAssets] = await traceInquiryRun(
          {
            name: "retrieve-knowledge",
            runType: "retriever",
            inputs: { intents: extraction.intents },
            outputs: ([docs, matched, media]) => ({
              brain_docs: docs.map((doc) => `${doc.title} (${doc.category})`),
              brain_doc_count: docs.length,
              learned_corrections: matched
                .filter((example) => example.kind === "override")
                .map((example) => example.customer_message),
              voice_examples: matched.filter(
                (example) => example.kind !== "override",
              ).length,
              media_slugs: media.map((asset) => asset.slug),
            }),
          },
          async () =>
            Promise.all([
              getActiveBrainDocs(),
              getMatchingReplyExamples(extraction.intents),
              getActiveMediaAssets(),
            ]),
        );

        const draft = await draftInquiryReply({
          messages,
          extraction,
          brainDocs,
          examples,
          mediaAssets,
          model,
          renderedHistory,
          renderedProfile,
          availabilityFact,
        });

        return {
          paused: false,
          analysis: {
            ...extraction,
            draft_reply: draft.draft_reply,
            proposed_media_slugs: draft.proposed_media_slugs,
          },
          model,
          availabilityFact,
        };
      },
    );
  } finally {
    // Trigger.dev runs and serverless functions can freeze the moment this
    // resolves, so queued traces have to be drained here or they are lost.
    await flushInquiryTraces();
  }
}

/**
 * Gate-free wrapper kept for the evals and replay harness: same pipeline, but
 * the result is always a completed analysis. An availability fact may still be
 * supplied directly (e.g. replaying a burst whose check Luke already
 * answered).
 */
export async function analyseInquiryMessages(
  messages: InquiryMessageRow[],
  options: {
    history?: ZernioHistoryMessage[];
    profile?: ClientProfile | null;
    conversationId?: string;
    availabilityFact?: AvailabilityFact | null;
  } = {},
): Promise<{ analysis: InquiryAnalysis; model: string }> {
  const outcome = await runInquiryAnalysis(messages, options);

  if (outcome.paused) {
    // Unreachable: pausing requires an availabilityGate, which this wrapper
    // never passes.
    throw new Error("Inquiry analysis paused without an availability gate");
  }

  return { analysis: outcome.analysis, model: outcome.model };
}

// ---------------------------------------------------------------------------
// Website leads: Luke's FIRST outbound message to someone who enquired via the
// website form. Delivered as a prefilled wa.me link, so it is always a single
// message and can never carry media.
// ---------------------------------------------------------------------------

export function renderWebsiteLead(lead: WebsiteLeadDetails): string {
  const fields: Array<[string, string | number | boolean | null]> = [
    ["Name", [lead.firstName, lead.lastName].filter(Boolean).join(" ")],
    ["Form", lead.source === "lead_form" ? "detailed booking form" : "contact form"],
    ["Event type", lead.eventType],
    ["Date", lead.eventDateText],
    ["Date flexible", lead.dateFlexible],
    ["Location", lead.location],
    ["Guests", lead.guestCount],
    ["Performance minutes", lead.performanceMinutes],
    ["Their role", lead.bookerRole],
    ["Their message", lead.message],
    ["Notes", lead.notes],
  ];

  return fields
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([label, value]) =>
      `- ${label}: ${typeof value === "boolean" ? (value ? "yes" : "no") : value}`,
    )
    .join("\n");
}

/**
 * The website-lead drafting rules.
 *
 * `firstName` and `availability` are nullable for the redraft path only: a
 * redraft is driven from a request row that carries the draft but not the lead
 * row, so neither the name nor the answered availability is knowable there. The
 * non-null branches are byte-identical to what the first-draft path has always
 * produced, and the price and em-dash bans are outside the branch, so they
 * apply either way.
 */
function buildWebsiteLeadRules(input: {
  firstName: string | null;
  availability: "available" | "unavailable" | null;
  dateText: string | null;
  dateFlexible: boolean | null;
}): string {
  const dateText = input.dateText?.trim() || "their date";
  const availabilityBullet =
    input.availability === null
      ? "- Luke's availability answer is already stated in the draft being revised. Carry it across exactly as written; never add, remove, or reverse an availability claim."
      : input.availability === "available"
        ? `- Luke has personally confirmed he IS available on ${dateText}. Say so plainly and warmly early in the message.`
        : `- Luke has personally confirmed he is NOT available on ${dateText}. Decline warmly, thank them for the enquiry, and do not invent a reason.${
            input.dateFlexible
              ? " Their form says the date is flexible, so ask what other dates could work."
              : " If it feels natural, ask whether the date could move."
          }`;
  const addressBullet = input.firstName
    ? `- Write as Luke in first-person singular and address ${input.firstName} by name.`
    : "- Write as Luke in first-person singular and address them by the name the draft being revised already uses.";

  return `Drafting rules:
${addressBullet}
- This is Luke's OPENING message on WhatsApp: they enquired through the website form and have not messaged him here yet. Reference their enquiry naturally so they immediately know why he is messaging.
- Use plain, natural South African/British English. No corporate language, hard sell, fake urgency, or generic AI phrasing.
- Acknowledge the details from their form so they feel seen; never make them repeat information they already gave.
- Ground every factual statement in the BUSINESS KNOWLEDGE below. If the knowledge does not cover something, do not invent it.
${availabilityBullet}
- Never quote a price, promise a discount, or state availability for any other date.
- EM DASHES ARE STRICTLY FORBIDDEN. Use a full stop, comma, semicolon, or colon instead. A hyphen inside a hyphenated word (e.g. "four-piece") is fine.
- Keep it between 40 and 100 words, written as ONE single WhatsApp message.
- The emoji's 🙂, 🙏, 👌 and 😊 are allowed sparingly for warmth.
- End with a light question or easy next step that invites a reply.
- This is a proposal only. A human will approve or reject it before it is sent.`;
}

export function buildWebsiteLeadSystemPrompt(input: {
  lead: WebsiteLeadDetails;
  availability: "available" | "unavailable";
  brainDocs: BrainDocRow[];
  examples: ReplyExampleRow[];
}): string {
  return [
    "You draft Luke Stamer's first outbound WhatsApp message to a website enquiry. Luke is a Cape Town cellist. A human approves or rejects every draft before anything is sent.",
    buildWebsiteLeadRules({
      firstName: input.lead.firstName,
      availability: input.availability,
      dateText: input.lead.eventDateText,
      dateFlexible: input.lead.dateFlexible,
    }),
    renderBrainDocs(input.brainDocs),
    renderAvailabilityFact({
      availability: input.availability,
      dateText: input.lead.eventDateText,
    }),
    renderReplyExamples(input.examples),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function draftWebsiteLeadReply(
  lead: WebsiteLeadDetails,
): Promise<{ draft: string; model: string }> {
  requireEnv("AI_GATEWAY_API_KEY");
  const model = requireEnv("AI_MODEL");
  const availability = lead.availability;

  if (!availability) {
    throw new Error("Website lead availability has not been decided yet");
  }

  try {
    return await traceInquiryRun(
      {
        name: "website-lead-agent",
        metadata: {
          model,
          lead_id: lead.leadId,
          source: lead.source,
          availability,
        },
        inputs: {
          messages: [
            { role: "user", content: renderWebsiteLead(lead) },
          ],
          availability,
        },
        outputs: ({ draft }: { draft: string; model: string }) => ({
          messages: [{ role: "assistant", content: draft }],
          draft,
        }),
      },
      async () => {
        const [brainDocs, examples] = await Promise.all([
          getActiveBrainDocs(),
          getMatchingReplyExamples([
            "availability",
            "event_details",
            "greeting",
          ]),
        ]);

        const instructions = buildWebsiteLeadSystemPrompt({
          lead,
          availability,
          brainDocs,
          examples,
        });

        const result = await generateText({
          model,
          instructions,
          output: Output.object({ schema: websiteLeadDraftSchema }),
          telemetry: inquiryTelemetry("draft-website-lead-reply", instructions),
          prompt: [
            currentDateContext(),
            `Website form enquiry:\n${renderWebsiteLead(lead)}`,
          ].join("\n\n"),
        });

        return { draft: result.output.draft_message.trim(), model };
      },
    );
  } finally {
    await flushInquiryTraces();
  }
}

// ---------------------------------------------------------------------------
// Redrafts: Luke tapped "✏️ Suggest changes", said what he wanted different,
// and this turns those notes into a new draft carrying the same buttons. The
// loop repeats indefinitely, so revision N must satisfy every earlier
// instruction as well as the newest one — otherwise a later note silently
// undoes an earlier correction and the loop never converges.
//
// The guardrails are NOT re-stated here. Both paths run the first-draft rule
// builders (buildDraftingRules / buildWebsiteLeadRules), so the price ban, the
// availability ban, and the em-dash ban bind a revision exactly as they bind a
// first draft, and a human-confirmed availability fact relaxes exactly the one
// bullet it always relaxed.
// ---------------------------------------------------------------------------

const REDRAFT_RULES = `How to apply Luke's revision notes:
- The REVISION INSTRUCTION below is Luke's editing directive to you, the drafter. It is NOT a message from the customer and contains no customer speech. Never quote it back, never answer it as though the customer had asked something, and never treat a name, date, or request inside it as something the customer said.
- Rewrite the CURRENT DRAFT so it satisfies this revision's instruction. Change what the instruction asks for and keep everything else: same voice, same facts, same structure.
- EVERY INSTRUCTION IN THE HISTORY STILL APPLIES. A correction made on an earlier revision stays in force unless this revision explicitly reverses it. Never reintroduce something an earlier instruction removed, and never undo an earlier fix in order to satisfy a later one.
- The CURRENT DRAFT is the record of what Luke has already decided. Carry its availability answer, its dates, and its commitments across exactly as written. The availability rules above govern NEW claims; they never require you to delete an answer the draft already gives.
- The drafting rules above still bind the result. An instruction cannot authorise a price, a discount, or an availability claim those rules forbid. If Luke asks for one, write the closest thing the rules allow and say he will confirm it himself.
- Output the complete revised reply, never a diff, a summary, or a note about what you changed.`;

// A redraft rewrites words only: complete_suggest_change_request writes the new
// text back to the target table and leaves the attachment set alone, so a slug
// proposed here would be silently dropped.
const REDRAFT_MEDIA_RULE = `- proposed_media_slugs must be an empty array. A revision changes the words only; any attachments already chosen for this enquiry are unaffected and cannot be added or removed here.`;

export type RedraftContext = {
  currentDraft: string;
  instructions: string;
  instructionHistory: SuggestChangeInstructionHistory;
  revision: number;
};

/**
 * The three blocks a redraft prompt cannot work without, each labelled for what
 * it is. The labelling is load-bearing: an unlabelled transcript reading "tell
 * them we're available on the 14th" is indistinguishable from something the
 * customer wrote, and a drafter that mistakes the two writes a reply answering
 * Luke instead of the customer.
 */
export function renderRedraftInstructions(input: RedraftContext): string {
  const history =
    input.instructionHistory.length === 0
      ? "EARLIER REVISION INSTRUCTIONS FROM LUKE: none. This is the first revision of this draft."
      : `EARLIER REVISION INSTRUCTIONS FROM LUKE (oldest first — every one of these still applies):\n${input.instructionHistory
          .map(
            (entry) =>
              `- Revision ${entry.revision}, Luke asked: ${entry.instructions}`,
          )
          .join("\n")}`;

  return [
    `CURRENT DRAFT (the exact text being revised — rewrite this, do not start from scratch):\n${input.currentDraft}`,
    history,
    `REVISION ${input.revision} INSTRUCTION FROM LUKE (his editing directive to you, NOT a message from the customer):\n${input.instructions}`,
  ].join("\n\n");
}

export function buildInquiryRedraftSystemPrompt(input: {
  brainDocs: BrainDocRow[];
  examples: ReplyExampleRow[];
  availabilityFact?: AvailabilityFact | null;
}): string {
  return [
    "You revise a proposed WhatsApp reply for Luke Stamer, a Cape Town cellist. Luke has read the current draft and recorded what he wants changed. A human approves or rejects every revision before it is sent.",
    buildDraftingRules({ confirmedAvailability: input.availabilityFact }),
    `${REDRAFT_RULES}\n${REDRAFT_MEDIA_RULE}`,
    renderBrainDocs(input.brainDocs),
    // After the brain docs for the same reason as the first-draft prompt: the
    // human-confirmed fact must outrank the standing availability doc.
    renderAvailabilityFact(input.availabilityFact),
    renderReplyExamples(input.examples),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildWebsiteLeadRedraftSystemPrompt(input: {
  lead?: WebsiteLeadDetails | null;
  brainDocs: BrainDocRow[];
  examples: ReplyExampleRow[];
}): string {
  const availability = input.lead?.availability ?? null;

  return [
    "You revise Luke Stamer's first outbound WhatsApp message to a website enquiry. Luke is a Cape Town cellist. He has read the current draft and recorded what he wants changed. A human approves or rejects every revision before anything is sent.",
    buildWebsiteLeadRules({
      firstName: input.lead?.firstName ?? null,
      availability,
      dateText: input.lead?.eventDateText ?? null,
      dateFlexible: input.lead?.dateFlexible ?? null,
    }),
    REDRAFT_RULES,
    renderBrainDocs(input.brainDocs),
    renderAvailabilityFact(
      availability
        ? { availability, dateText: input.lead?.eventDateText ?? null }
        : null,
    ),
    renderReplyExamples(input.examples),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function joinDraftBubbles(bubbles: string[]): string {
  const draft = bubbles
    .map((bubble) => bubble.trim())
    .filter((bubble) => bubble.length > 0)
    .join(BUBBLE_DELIMITER);

  if (draft === "") {
    // An empty redraft would be rejected by complete_suggest_change_request
    // anyway; failing here names the cause instead of surfacing as a Postgres
    // exception three calls later.
    throw new Error("Redraft produced an empty reply");
  }

  return draft;
}

/**
 * Revise an inbound-WhatsApp draft from Luke's notes.
 *
 * Own trace and own flush: this runs as its own Trigger.dev task rather than
 * inside runInquiryAnalysis, and a run can freeze the moment it resolves.
 */
export async function redraftInquiryReply(input: {
  currentDraft: string;
  instructions: string;
  instructionHistory: SuggestChangeInstructionHistory;
  revision: number;
  // Customer context, when the caller has it. The current draft already
  // encodes the enquiry it was written for, so these sharpen the revision
  // rather than enable it.
  messages?: InquiryMessageRow[];
  renderedHistory?: string;
  renderedProfile?: string;
  availabilityFact?: AvailabilityFact | null;
  conversationId?: string;
  // The intents extracted from the customer's message: exactly what the FIRST
  // draft retrieved its learned corrections against. A revision has to be
  // grounded in the SAME corrections as the draft it revises. Widening the set
  // does not add matches, it evicts them — getMatchingReplyExamples is an
  // ANY-overlap capped at 6 rows ordered newest first — so a fixed superset
  // would answer "make it warmer" on a repertoire enquiry with pricing
  // corrections, i.e. real replies carrying real rand figures, in a prompt the
  // first draft never saw.
  //
  // Optional only because trigger/inquiries.ts drives this from the request
  // row, which does not carry them. THE CALLER SHOULD PASS THE RUN'S REAL
  // INTENTS (inquiry_response_runs.analysis->'intents', already read by
  // get_suggest_change_target_context) as soon as they are threaded through.
  // Until then unknown means NO learned corrections rather than a guessed
  // superset: retrieving fewer examples is the safe direction, and because
  // .overlaps matches ANY tag there is no non-empty default that provably
  // excludes a priced correction. The CURRENT DRAFT block plus "keep
  // everything else: same voice, same facts" is what carries the first draft's
  // grounding forward in the meantime.
  intents?: string[];
}): Promise<{ draft: string; model: string }> {
  requireEnv("AI_GATEWAY_API_KEY");
  const model = requireEnv("AI_MODEL");

  try {
    return await traceInquiryRun(
      {
        name: "redraft-inquiry-agent",
        conversationId: input.conversationId,
        metadata: {
          model,
          revision: input.revision,
          earlier_revisions: input.instructionHistory.length,
          has_history: Boolean(input.renderedHistory),
          has_profile: Boolean(input.renderedProfile),
        },
        inputs: {
          messages: [{ role: "user", content: input.instructions }],
          current_draft: input.currentDraft,
          instruction_history: input.instructionHistory,
          revision: input.revision,
        },
        outputs: ({ draft }: { draft: string; model: string }) => ({
          messages: [
            { role: "assistant", content: draft.split(BUBBLE_DELIMITER).join("\n\n") },
          ],
          draft_bubbles: draft.split(BUBBLE_DELIMITER),
        }),
      },
      async () => {
        const [brainDocs, examples] = await Promise.all([
          getActiveBrainDocs(),
          getMatchingReplyExamples(input.intents ?? []),
        ]);

        const instructions = buildInquiryRedraftSystemPrompt({
          brainDocs,
          examples,
          availabilityFact: input.availabilityFact,
        });

        const result = await generateText({
          model,
          instructions,
          output: Output.object({ schema: inquiryDraftSchema }),
          telemetry: inquiryTelemetry("redraft-inquiry-reply", instructions),
          prompt: [
            currentDateContext(),
            input.renderedProfile ?? "",
            input.renderedHistory ?? "",
            input.messages && input.messages.length > 0
              ? `Message burst this reply answers:\n${renderTranscript(input.messages)}`
              : "",
            renderRedraftInstructions(input),
          ]
            .filter(Boolean)
            .join("\n\n"),
        });

        return { draft: joinDraftBubbles(result.output.draft_messages), model };
      },
    );
  } finally {
    await flushInquiryTraces();
  }
}

/** Revise a website-lead draft from Luke's notes. */
export async function redraftWebsiteLeadReply(input: {
  currentDraft: string;
  instructions: string;
  instructionHistory: SuggestChangeInstructionHistory;
  revision: number;
  lead?: WebsiteLeadDetails | null;
}): Promise<{ draft: string; model: string }> {
  requireEnv("AI_GATEWAY_API_KEY");
  const model = requireEnv("AI_MODEL");

  try {
    return await traceInquiryRun(
      {
        name: "redraft-website-lead-agent",
        metadata: {
          model,
          revision: input.revision,
          earlier_revisions: input.instructionHistory.length,
          lead_id: input.lead?.leadId,
          has_lead_row: Boolean(input.lead),
        },
        inputs: {
          messages: [{ role: "user", content: input.instructions }],
          current_draft: input.currentDraft,
          instruction_history: input.instructionHistory,
          revision: input.revision,
        },
        outputs: ({ draft }: { draft: string; model: string }) => ({
          messages: [{ role: "assistant", content: draft }],
          draft,
        }),
      },
      async () => {
        const [brainDocs, examples] = await Promise.all([
          getActiveBrainDocs(),
          getMatchingReplyExamples(["availability", "event_details", "greeting"]),
        ]);

        const instructions = buildWebsiteLeadRedraftSystemPrompt({
          lead: input.lead,
          brainDocs,
          examples,
        });

        const result = await generateText({
          model,
          instructions,
          output: Output.object({ schema: websiteLeadDraftSchema }),
          telemetry: inquiryTelemetry(
            "redraft-website-lead-reply",
            instructions,
          ),
          prompt: [
            currentDateContext(),
            input.lead ? `Website form enquiry:\n${renderWebsiteLead(input.lead)}` : "",
            renderRedraftInstructions(input),
          ]
            .filter(Boolean)
            .join("\n\n"),
        });

        const draft = result.output.draft_message.trim();
        if (draft === "") {
          throw new Error("Redraft produced an empty reply");
        }

        return { draft, model };
      },
    );
  } finally {
    await flushInquiryTraces();
  }
}
