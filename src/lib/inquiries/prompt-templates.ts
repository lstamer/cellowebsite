/**
 * Editable prompt scaffolds for the inquiry drafting agent.
 *
 * The strings below are the code defaults and are byte-identical to the
 * prompts that shipped before the admin existed. Luke can override any of
 * them from admin.stamer.co.za/settings/prompts; an active row in
 * inquiry_prompt_templates wins over the default for that slug. Overrides are
 * loaded once per AI run (see loadPromptOverrides) so the pure prompt builders
 * in ai.ts stay synchronous and unit-testable.
 */
import { z } from "zod";

export const PROMPT_TEMPLATE_SLUGS = [
  "extraction_system",
  "history_rules",
  "drafting_rules",
  "example_rules",
  "media_rules",
  "redraft_rules",
  "drafting_intro",
  "website_lead_intro",
  "inquiry_redraft_intro",
  "website_lead_redraft_intro",
] as const;

export type PromptTemplateSlug = (typeof PROMPT_TEMPLATE_SLUGS)[number];

export interface PromptTemplateDefinition {
  title: string;
  description: string;
  content: string;
  /** Substrings the content must keep so code that rewrites it keeps working. */
  requiredFragments?: string[];
}

// The two availability bullets that a human-confirmed answer replaces. They
// must appear verbatim in drafting_rules; buildDraftingRules asserts the swap.
export const AVAILABILITY_BAN_BULLET =
  "- Never say a date is available, quote a price, promise a discount, or imply a calendar was checked unless it's clear from conversation history.";
export const AVAILABILITY_DEFER_BULLET =
  "- If availability is asked, say Luke (you) will check and let them know soon.";

export const PROMPT_TEMPLATE_DEFAULTS: Record<PromptTemplateSlug, PromptTemplateDefinition> = {
  extraction_system: {
    title: "Extraction: system prompt",
    description:
      "Stage one. Reads a burst of WhatsApp messages and extracts intents, event facts and risk flags. Never drafts words.",
    content: `You analyse initial WhatsApp enquiries for Luke Stamer, a Cape Town cellist.

Extraction rules:
- Use only facts explicitly present in the messages. Unknown values must be null or omitted from arrays.
- A message may have several intents. Availability and pricing often occur together.
- Mark Cavendish or a referral as the source only when the sender explicitly says so.
- Never infer that a date is available or infer a price from historical-looking wording.
- event_date_iso may be populated only when the date resolves unambiguously. The current date and timezone are supplied below.
- Confidence measures the extraction, not the quality of the lead.`,
  },
  history_rules: {
    title: "Drafting: how to use earlier conversation",
    description:
      "Prepended to the earlier-conversation block when a thread already exists with this contact.",
    content: `How to use the earlier conversation:
- If an EARLIER CONVERSATION section is present, this is an ongoing relationship, not a first contact. Do not introduce Luke again, do not ask for details already established there (name, event, date, location), and match the familiarity of the existing exchange.
- Treat "Luke:" lines as ground truth for what has already been said or promised. Never contradict them.
- The earlier conversation is context only — respond directly to the incoming message(s), not the entire thread.`,
  },
  drafting_rules: {
    title: "Drafting: rules for the first WhatsApp reply",
    description:
      "The core voice and guardrail rules for replies to inbound WhatsApp enquiries. The two availability bullets are swapped out when Luke confirms a date, so they must stay verbatim.",
    content: `Drafting rules:
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
- This is a proposal only. A human will approve or reject it before it is sent.`,
    requiredFragments: [AVAILABILITY_BAN_BULLET, AVAILABILITY_DEFER_BULLET],
  },
  example_rules: {
    title: "Drafting: how to use examples",
    description: "Explains the learned corrections and voice examples that follow it in the prompt.",
    content: `How to use the examples:
- LEARNED CORRECTIONS are enquiries where a drafted reply was rejected and Luke wrote what should have been sent. When the current enquiry resembles a correction's situation, match Luke's replacement closely — its content, length, and tone. A correction applies only to similar enquiries; do not let it bleed into unrelated ones.
- VOICE EXAMPLES are real replies Luke sent. Imitate their voice and rhythm, not their specific facts.`,
  },
  media_rules: {
    title: "Drafting: media rules",
    description: "When the model may propose attachments from the media library.",
    content: `Media rules:
- You may propose at most 2 media attachments, chosen ONLY from the MEDIA LIBRARY slugs below.
- Propose media only when it clearly helps this specific enquiry — for example they asked to see or hear Luke play, asked for photos/videos, or asked what the setup looks like.
- If nothing in the library fits, propose none. Never invent a slug.
- If you propose media, the draft text should read naturally alongside it (e.g. mention you're sending a clip).`,
  },
  redraft_rules: {
    title: "Redraft: how to apply revision notes",
    description:
      "Used when Luke taps Suggest changes and sends a voicenote or typed instruction.",
    content: `How to apply Luke's revision notes:
- The REVISION INSTRUCTION below is Luke's editing directive to you, the drafter. It is NOT a message from the customer and contains no customer speech. Never quote it back, never answer it as though the customer had asked something, and never treat a name, date, or request inside it as something the customer said.
- Rewrite the CURRENT DRAFT so it satisfies this revision's instruction. Change what the instruction asks for and keep everything else: same voice, same facts, same structure.
- EVERY INSTRUCTION IN THE HISTORY STILL APPLIES. A correction made on an earlier revision stays in force unless this revision explicitly reverses it. Never reintroduce something an earlier instruction removed, and never undo an earlier fix in order to satisfy a later one.
- The CURRENT DRAFT is the record of what Luke has already decided. Carry its availability answer, its dates, and its commitments across exactly as written. The availability rules above govern NEW claims; they never require you to delete an answer the draft already gives.
- The drafting rules above still bind the result. An instruction cannot authorise a price, a discount, or an availability claim those rules forbid. If Luke asks for one, write the closest thing the rules allow and say he will confirm it himself.
- Output the complete revised reply, never a diff, a summary, or a note about what you changed.`,
  },
  drafting_intro: {
    title: "Persona: WhatsApp first reply",
    description: "The opening sentence of the system prompt for inbound WhatsApp drafts.",
    content:
      "You draft a proposed first WhatsApp reply for Luke Stamer, a Cape Town cellist. A human approves or rejects every draft before it is sent.",
  },
  website_lead_intro: {
    title: "Persona: website lead first message",
    description: "The opening sentence of the system prompt for Luke's first outbound message to a website enquiry.",
    content:
      "You draft Luke Stamer's first outbound WhatsApp message to a website enquiry. Luke is a Cape Town cellist. A human approves or rejects every draft before anything is sent.",
  },
  inquiry_redraft_intro: {
    title: "Persona: WhatsApp redraft",
    description: "The opening sentence when revising an inbound WhatsApp draft.",
    content:
      "You revise a proposed WhatsApp reply for Luke Stamer, a Cape Town cellist. Luke has read the current draft and recorded what he wants changed. A human approves or rejects every revision before it is sent.",
  },
  website_lead_redraft_intro: {
    title: "Persona: website lead redraft",
    description: "The opening sentence when revising a website lead's first message.",
    content:
      "You revise Luke Stamer's first outbound WhatsApp message to a website enquiry. Luke is a Cape Town cellist. He has read the current draft and recorded what he wants changed. A human approves or rejects every revision before anything is sent.",
  },
};

export function isPromptTemplateSlug(value: string): value is PromptTemplateSlug {
  return (PROMPT_TEMPLATE_SLUGS as readonly string[]).includes(value);
}

/**
 * Server-side validation shared by the admin editor and the loader. Returns
 * null when the content is acceptable, otherwise a human-readable reason.
 */
export function validatePromptTemplate(
  slug: PromptTemplateSlug,
  content: string,
): string | null {
  const trimmed = content.trim();
  if (trimmed.length < 20) return "The prompt is too short to be useful.";
  if (trimmed.length > 12_000) return "The prompt is longer than 12,000 characters.";
  for (const fragment of PROMPT_TEMPLATE_DEFAULTS[slug].requiredFragments ?? []) {
    if (!trimmed.includes(fragment)) {
      return `This prompt must keep the line "${fragment.slice(0, 60)}…" verbatim; the availability flow rewrites it at draft time.`;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Runtime overrides
// ---------------------------------------------------------------------------

const overrideRowSchema = z.object({
  slug: z.string(),
  content: z.string(),
  active: z.boolean(),
});

type OverrideLoader = () => Promise<Array<z.infer<typeof overrideRowSchema>>>;

let overrides: Partial<Record<PromptTemplateSlug, string>> = {};
let loadedAt = 0;
let loader: OverrideLoader | null = null;

const OVERRIDE_TTL_MS = 60_000;

/** Wire the Supabase reader without making this module depend on supabase.ts. */
export function setPromptOverrideLoader(fn: OverrideLoader | null): void {
  loader = fn;
  loadedAt = 0;
}

/**
 * Refresh the override cache. Called at the start of every AI run. A failure
 * to load keeps the previous cache (or the defaults) and is reported by the
 * caller; drafting must not stop because the settings table was unreachable.
 */
export async function loadPromptOverrides(options: { force?: boolean } = {}): Promise<void> {
  if (!loader) return;
  if (!options.force && Date.now() - loadedAt < OVERRIDE_TTL_MS) return;

  const rows = z.array(overrideRowSchema).parse(await loader());
  const next: Partial<Record<PromptTemplateSlug, string>> = {};
  for (const row of rows) {
    if (!row.active || !isPromptTemplateSlug(row.slug)) continue;
    if (validatePromptTemplate(row.slug, row.content) !== null) continue;
    next[row.slug] = row.content;
  }
  overrides = next;
  loadedAt = Date.now();
}

/** The active text for a slug: the override when one is loaded, else the default. */
export function getPromptTemplate(slug: PromptTemplateSlug): string {
  return overrides[slug] ?? PROMPT_TEMPLATE_DEFAULTS[slug].content;
}

/** Test seam. */
export function resetPromptOverridesForTests(): void {
  overrides = {};
  loadedAt = 0;
}
