/**
 * Editable text templates: the Telegram card wordings and the AI prompt
 * scaffolds that used to be hard-coded string constants.
 *
 * Two layers:
 *   1. Code defaults (this file). Byte-identical to the strings that shipped
 *      before the admin existed, so drafting and card behaviour do not change
 *      until Luke edits something.
 *   2. Database overrides (`inquiry_prompt_templates`, loaded by
 *      `@/lib/admin/template-store`). An active row replaces the default; an
 *      inactive or missing row falls back to it.
 *
 * This module is pure: no I/O, no env. The store populates the override map.
 *
 * Template syntax is deliberately tiny:
 *   - `{{key}}` is replaced by the value for `key`.
 *   - A line that contains placeholders and whose placeholders ALL resolve to
 *     empty is dropped. This is how "📞 Phone: {{phone}}" disappears when no
 *     phone was given, without conditionals in the template.
 *   - Runs of blank lines collapse to one; leading/trailing blank lines go.
 */

export type TemplateKind = "ai_prompt" | "telegram_card";

export interface TemplatePlaceholder {
  name: string;
  description: string;
  /** Required placeholders must appear in an override or it is rejected. */
  required?: boolean;
}

export interface TemplateDefinition {
  slug: string;
  kind: TemplateKind;
  title: string;
  description: string;
  defaultContent: string;
  placeholders: TemplatePlaceholder[];
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

export type TemplateValues = Record<
  string,
  string | number | boolean | null | undefined
>;

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

function valueToString(value: TemplateValues[string]): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function renderTemplate(content: string, values: TemplateValues): string {
  const lines = content.split("\n").flatMap((line) => {
    let sawPlaceholder = false;
    let sawValue = false;
    const rendered = line.replace(PLACEHOLDER, (_match, key: string) => {
      sawPlaceholder = true;
      const text = valueToString(values[key]);
      if (text !== "") sawValue = true;
      return text;
    });

    if (sawPlaceholder && !sawValue) return [];
    return [rendered];
  });

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
}

export function listPlaceholders(content: string): string[] {
  const found = new Set<string>();
  for (const match of content.matchAll(PLACEHOLDER)) {
    found.add(match[1]);
  }
  return [...found];
}

export function validateTemplateContent(
  definition: TemplateDefinition,
  content: string,
): { ok: true } | { ok: false; reason: string } {
  if (content.trim() === "") {
    return { ok: false, reason: "The template cannot be empty." };
  }

  const present = new Set(listPlaceholders(content));
  const missing = definition.placeholders
    .filter((placeholder) => placeholder.required && !present.has(placeholder.name))
    .map((placeholder) => `{{${placeholder.name}}}`);
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `Missing required placeholder${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`,
    };
  }

  const known = new Set(definition.placeholders.map((placeholder) => placeholder.name));
  const unknown = [...present].filter((name) => !known.has(name));
  if (unknown.length > 0) {
    return {
      ok: false,
      reason: `Unknown placeholder${unknown.length === 1 ? "" : "s"}: ${unknown
        .map((name) => `{{${name}}}`)
        .join(", ")}`,
    };
  }

  if (content.length > 20_000) {
    return { ok: false, reason: "The template is too long (20,000 character limit)." };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Override registry
// ---------------------------------------------------------------------------

const overrides = new Map<string, string>();

export function setTemplateOverrides(entries: Iterable<[string, string]>): void {
  overrides.clear();
  for (const [slug, content] of entries) {
    overrides.set(slug, content);
  }
}

export function clearTemplateOverrides(): void {
  overrides.clear();
}

export function hasTemplateOverride(slug: string): boolean {
  return overrides.has(slug);
}

/** The active content for a slug: the database override, else the code default. */
export function getTemplate(slug: string): string {
  const override = overrides.get(slug);
  if (override !== undefined) return override;

  const definition = TEMPLATE_BY_SLUG.get(slug);
  if (!definition) {
    throw new Error(`Unknown template slug: ${slug}`);
  }
  return definition.defaultContent;
}

export function renderNamedTemplate(slug: string, values: TemplateValues): string {
  return renderTemplate(getTemplate(slug), values);
}

// ---------------------------------------------------------------------------
// Definitions
//
// The default strings below are the exact texts previously hard-coded in
// src/lib/inquiries/ai.ts, src/lib/inquiries/telegram.ts and the two API
// routes. Changing a default here changes production behaviour for everyone
// who has not overridden it; prefer editing from the admin.
// ---------------------------------------------------------------------------

const AI_TEMPLATES: TemplateDefinition[] = [
  {
    slug: "ai.extraction_system",
    kind: "ai_prompt",
    title: "Extraction: system prompt",
    description:
      "Runs first on every WhatsApp burst. Tells the model how to pull structured facts (event, date, intents) out of the messages.",
    placeholders: [],
    defaultContent: `You analyse initial WhatsApp enquiries for Luke Stamer, a Cape Town cellist.

Extraction rules:
- Use only facts explicitly present in the messages. Unknown values must be null or omitted from arrays.
- A message may have several intents. Availability and pricing often occur together.
- Mark Cavendish or a referral as the source only when the sender explicitly says so.
- Never infer that a date is available or infer a price from historical-looking wording.
- event_date_iso may be populated only when the date resolves unambiguously. The current date and timezone are supplied below.
- Confidence measures the extraction, not the quality of the lead.`,
  },
  {
    slug: "ai.drafting_persona",
    kind: "ai_prompt",
    title: "WhatsApp draft: opening line",
    description: "The first sentence of the system prompt for a first WhatsApp reply.",
    placeholders: [],
    defaultContent:
      "You draft a proposed first WhatsApp reply for Luke Stamer, a Cape Town cellist. A human approves or rejects every draft before it is sent.",
  },
  {
    slug: "ai.drafting_rules",
    kind: "ai_prompt",
    title: "WhatsApp draft: drafting rules",
    description:
      "The rules every WhatsApp reply draft follows. {{availability_block}} is replaced by the standing availability bullets, or by Luke's confirmed answer once he has tapped Available / Unavailable.",
    placeholders: [
      {
        name: "availability_block",
        description:
          "The availability bullets. Standing rules by default; the human-confirmed fact when Luke has answered.",
        required: true,
      },
    ],
    defaultContent: `Drafting rules:
- Write as Luke in first-person singular & address the sender directly.
- Use plain, natural South African/British English. No corporate language, hard sell, fake urgency, or generic AI phrasing.
- Briefly acknowledge the details they supply so the sender feels seen.
- Ground every factual statement in the BUSINESS KNOWLEDGE below. If the knowledge does not cover something, do not invent it — say "I'll confirm..."
{{availability_block}}
- Ask at most three essential missing questions. Prioritise event date, event type, and location. Guest count is also useful for inferring the type of client they are.
- If the enquiry is already detailed, do not make them repeat information.
- EM DASHES ARE STRICTLY FORBIDDEN. Use a full stop, comma, semicolon, or colon instead. A hyphen inside a hyphenated word (e.g. "four-piece") is fine.
- Keep the first reply between 40 and 120 words.
- The emoji's 🙂, 🙏, 👌 and 😊 are allowed for acknowledgement sections of the reply.
- draft_messages is an array of WhatsApp bubbles. Default to ONE bubble. Use two (rarely three) only when it genuinely reads more naturally as separate messages — e.g. a warm acknowledgement followed by the practical questions. Never split mid-thought.
- This is a proposal only. A human will approve or reject it before it is sent.`,
  },
  {
    slug: "ai.availability_standing",
    kind: "ai_prompt",
    title: "WhatsApp draft: standing availability bullets",
    description:
      "Inserted into {{availability_block}} when Luke has NOT yet confirmed availability for the enquiry.",
    placeholders: [],
    defaultContent: `- Never say a date is available, quote a price, promise a discount, or imply a calendar was checked unless it's clear from conversation history.
- If availability is asked, say Luke (you) will check and let them know soon.`,
  },
  {
    slug: "ai.availability_confirmed_available",
    kind: "ai_prompt",
    title: "WhatsApp draft: bullets when Luke said Available",
    description: "Replaces the standing bullets once Luke has tapped Available. {{date_text}} is the date he confirmed.",
    placeholders: [{ name: "date_text", description: "The confirmed date, as text.", required: true }],
    defaultContent: `- Luke has personally confirmed he IS available on {{date_text}}. Say so plainly and confidently. This human-confirmed fact overrides the availability policy in BUSINESS KNOWLEDGE for this one date only; every other date remains unconfirmed.
- Never quote a price, promise a discount, or state availability for any date other than the one Luke confirmed.
- Do not say you still need to check the date; Luke already has.`,
  },
  {
    slug: "ai.availability_confirmed_unavailable",
    kind: "ai_prompt",
    title: "WhatsApp draft: bullets when Luke said Unavailable",
    description: "Replaces the standing bullets once Luke has tapped Unavailable. {{date_text}} is the date he declined.",
    placeholders: [{ name: "date_text", description: "The declined date, as text.", required: true }],
    defaultContent: `- Luke has personally confirmed he is NOT available on {{date_text}}. Decline warmly and briefly, thank them for the enquiry, and do not invent a reason. If their messages hint the date could move, ask whether it is flexible.
- Never quote a price, promise a discount, or state availability for any date other than the one Luke confirmed.
- Do not say you still need to check the date; Luke already has.`,
  },
  {
    slug: "ai.history_rules",
    kind: "ai_prompt",
    title: "WhatsApp draft: how to use earlier conversation",
    description: "Prepended to the earlier-conversation block when a thread already exists with this person.",
    placeholders: [],
    defaultContent: `How to use the earlier conversation:
- If an EARLIER CONVERSATION section is present, this is an ongoing relationship, not a first contact. Do not introduce Luke again, do not ask for details already established there (name, event, date, location), and match the familiarity of the existing exchange.
- Treat "Luke:" lines as ground truth for what has already been said or promised. Never contradict them.
- The earlier conversation is context only — respond directly to the incoming message(s), not the entire thread.`,
  },
  {
    slug: "ai.example_rules",
    kind: "ai_prompt",
    title: "All drafts: how to use reply examples",
    description: "Explains learned corrections and voice examples to the model.",
    placeholders: [],
    defaultContent: `How to use the examples:
- LEARNED CORRECTIONS are enquiries where a drafted reply was rejected and Luke wrote what should have been sent. When the current enquiry resembles a correction's situation, match Luke's replacement closely — its content, length, and tone. A correction applies only to similar enquiries; do not let it bleed into unrelated ones.
- VOICE EXAMPLES are real replies Luke sent. Imitate their voice and rhythm, not their specific facts.`,
  },
  {
    slug: "ai.media_rules",
    kind: "ai_prompt",
    title: "WhatsApp draft: media rules",
    description: "When the model may propose attachments from the media library.",
    placeholders: [],
    defaultContent: `Media rules:
- You may propose at most 2 media attachments, chosen ONLY from the MEDIA LIBRARY slugs below.
- Propose media only when it clearly helps this specific enquiry — for example they asked to see or hear Luke play, asked for photos/videos, or asked what the setup looks like.
- If nothing in the library fits, propose none. Never invent a slug.
- If you propose media, the draft text should read naturally alongside it (e.g. mention you're sending a clip).`,
  },
  {
    slug: "ai.website_lead_persona",
    kind: "ai_prompt",
    title: "Website lead draft: opening line",
    description: "First sentence of the system prompt for Luke's first outbound message to a website enquiry.",
    placeholders: [],
    defaultContent:
      "You draft Luke Stamer's first outbound WhatsApp message to a website enquiry. Luke is a Cape Town cellist. A human approves or rejects every draft before anything is sent.",
  },
  {
    slug: "ai.website_lead_rules",
    kind: "ai_prompt",
    title: "Website lead draft: drafting rules",
    description:
      "Rules for the first outbound message to a website lead. {{address_bullet}} names the person; {{availability_bullet}} carries Luke's Available / Unavailable answer.",
    placeholders: [
      { name: "address_bullet", description: "How to address the lead by name.", required: true },
      { name: "availability_bullet", description: "Luke's availability answer for their date.", required: true },
    ],
    defaultContent: `Drafting rules:
{{address_bullet}}
- This is Luke's OPENING message on WhatsApp: they enquired through the website form and have not messaged him here yet. Reference their enquiry naturally so they immediately know why he is messaging.
- Use plain, natural South African/British English. No corporate language, hard sell, fake urgency, or generic AI phrasing.
- Acknowledge the details from their form so they feel seen; never make them repeat information they already gave.
- Ground every factual statement in the BUSINESS KNOWLEDGE below. If the knowledge does not cover something, do not invent it.
{{availability_bullet}}
- Never quote a price, promise a discount, or state availability for any other date.
- EM DASHES ARE STRICTLY FORBIDDEN. Use a full stop, comma, semicolon, or colon instead. A hyphen inside a hyphenated word (e.g. "four-piece") is fine.
- Keep it between 40 and 100 words, written as ONE single WhatsApp message.
- The emoji's 🙂, 🙏, 👌 and 😊 are allowed sparingly for warmth.
- End with a light question or easy next step that invites a reply.
- This is a proposal only. A human will approve or reject it before it is sent.`,
  },
  {
    slug: "ai.redraft_persona",
    kind: "ai_prompt",
    title: "WhatsApp redraft: opening line",
    description: "First sentence of the system prompt when Luke asks for changes to a WhatsApp draft.",
    placeholders: [],
    defaultContent:
      "You revise a proposed WhatsApp reply for Luke Stamer, a Cape Town cellist. Luke has read the current draft and recorded what he wants changed. A human approves or rejects every revision before it is sent.",
  },
  {
    slug: "ai.website_lead_redraft_persona",
    kind: "ai_prompt",
    title: "Website lead redraft: opening line",
    description: "First sentence of the system prompt when Luke asks for changes to a website-lead draft.",
    placeholders: [],
    defaultContent:
      "You revise Luke Stamer's first outbound WhatsApp message to a website enquiry. Luke is a Cape Town cellist. He has read the current draft and recorded what he wants changed. A human approves or rejects every revision before anything is sent.",
  },
  {
    slug: "ai.redraft_rules",
    kind: "ai_prompt",
    title: "All redrafts: how to apply Luke's notes",
    description: "How a revision must treat the current draft, the instruction history and the guardrails.",
    placeholders: [],
    defaultContent: `How to apply Luke's revision notes:
- The REVISION INSTRUCTION below is Luke's editing directive to you, the drafter. It is NOT a message from the customer and contains no customer speech. Never quote it back, never answer it as though the customer had asked something, and never treat a name, date, or request inside it as something the customer said.
- Rewrite the CURRENT DRAFT so it satisfies this revision's instruction. Change what the instruction asks for and keep everything else: same voice, same facts, same structure.
- EVERY INSTRUCTION IN THE HISTORY STILL APPLIES. A correction made on an earlier revision stays in force unless this revision explicitly reverses it. Never reintroduce something an earlier instruction removed, and never undo an earlier fix in order to satisfy a later one.
- The CURRENT DRAFT is the record of what Luke has already decided. Carry its availability answer, its dates, and its commitments across exactly as written. The availability rules above govern NEW claims; they never require you to delete an answer the draft already gives.
- The drafting rules above still bind the result. An instruction cannot authorise a price, a discount, or an availability claim those rules forbid. If Luke asks for one, write the closest thing the rules allow and say he will confirm it himself.
- Output the complete revised reply, never a diff, a summary, or a note about what you changed.`,
  },
  {
    slug: "ai.redraft_media_rule",
    kind: "ai_prompt",
    title: "WhatsApp redraft: media rule",
    description: "Appended to the redraft rules for WhatsApp replies, whose attachments a revision may not change.",
    placeholders: [],
    defaultContent:
      "- proposed_media_slugs must be an empty array. A revision changes the words only; any attachments already chosen for this enquiry are unaffected and cannot be added or removed here.",
  },
];

const TELEGRAM_TEMPLATES: TemplateDefinition[] = [
  {
    slug: "telegram.lead_alert",
    kind: "telegram_card",
    title: "Website lead alert",
    description:
      "The card Luke gets the moment a website form is submitted. Lines whose placeholders are empty are dropped automatically.",
    placeholders: [
      { name: "source_label", description: "Booking form (/book) or Contact form (home page).", required: true },
      { name: "name", description: "Full name.", required: true },
      { name: "role", description: "Their role (Bride, Event planner...)." },
      { name: "event_type", description: "Event type label." },
      { name: "event_date", description: "Date text or Flexible / TBD." },
      { name: "location", description: "Venue or area." },
      { name: "email", description: "Email address.", required: true },
      { name: "phone", description: "Phone as typed." },
      { name: "whatsapp", description: "WhatsApp number as typed." },
      { name: "contact_preference", description: "WhatsApp or Email." },
      { name: "guest_count", description: "Guest count, 200+ when capped." },
      { name: "performance", description: "Performance length, e.g. 60 min." },
      { name: "message", description: "Their free-text message." },
    ],
    defaultContent: `🎻 New inquiry from stamer.co.za
📋 Source: {{source_label}}

👤 Name: {{name}}
👋 Role: {{role}}
🎉 Event: {{event_type}}
📅 Date: {{event_date}}
📍 Location: {{location}}
✉️ Email: {{email}}
📞 Phone: {{phone}}
💬 WhatsApp: {{whatsapp}}
📨 Preferred contact: {{contact_preference}}
👥 Guests: {{guest_count}}
⏱ Performance: {{performance}}

💬 Message: {{message}}`,
  },
  {
    slug: "telegram.review_card",
    kind: "telegram_card",
    title: "WhatsApp review card",
    description:
      "The Approve / Dismiss card for an AI-drafted WhatsApp reply. {{transcript}} is trimmed automatically to fit Telegram's 4,000-character limit.",
    placeholders: [
      { name: "reply_heading", description: "Explains whether the reply sends as one or several bubbles.", required: true },
      { name: "proposed_reply", description: "The exact draft that will be sent.", required: true },
      { name: "media_line", description: "Attachments on approve, when any." },
      { name: "intents", description: "Comma-separated intents." },
      { name: "lead_temperature", description: "hot / warm / cold." },
      { name: "confidence", description: "Extraction confidence, e.g. 82%." },
      { name: "details", description: "Name / Event / Date / Location / Source lines." },
      { name: "summary", description: "One-paragraph summary of the enquiry." },
      { name: "transcript", description: "The incoming message burst.", required: true },
    ],
    defaultContent: `🎻 New WhatsApp enquiry

{{reply_heading}}
{{proposed_reply}}

{{media_line}}
Intent: {{intents}}
Lead: {{lead_temperature}}
Confidence: {{confidence}}

{{details}}

Summary:
{{summary}}

Type a message (or reply to this card) with your own text to send that instead — I'll learn from it.

Incoming message burst:
{{transcript}}`,
  },
  {
    slug: "telegram.website_lead_review",
    kind: "telegram_card",
    title: "Website lead draft review card",
    description: "The Approve / Dismiss card for the AI-drafted first message to a website lead.",
    placeholders: [
      { name: "first_name", description: "Lead's first name.", required: true },
      { name: "availability_line", description: "You marked this date: AVAILABLE ✅ / UNAVAILABLE ❌.", required: true },
      { name: "draft", description: "The exact draft to be prefilled in WhatsApp.", required: true },
      { name: "details", description: "Name / Event / Date / Location / Guests / Performance / Role lines." },
      { name: "message_block", description: "Their form message, when any." },
    ],
    defaultContent: `🌐 Website lead reply — {{first_name}}

{{availability_line}}

Draft reply — this exact text will be prefilled in WhatsApp:
{{draft}}

{{details}}

{{message_block}}

Approve to get a tap-to-send WhatsApp button, or type a message (or reply to this card) with your own text to send that instead — I'll learn from it.`,
  },
  {
    slug: "telegram.availability_question",
    kind: "telegram_card",
    title: "Availability question",
    description: "Asked when a WhatsApp enquiry needs Luke's availability before the draft can be written.",
    placeholders: [
      { name: "date_line", description: "📅 Are you available on {date}?", required: true },
      { name: "who", description: "Contact name, or 'A WhatsApp enquiry'.", required: true },
      { name: "context", description: "Event context extracted from the messages." },
      { name: "window_hint", description: "When WhatsApp's reply window closes." },
    ],
    defaultContent: `{{date_line}}

{{who}} is asking about availability.

{{context}}

Your answer unblocks the reply draft: the AI will state it as fact, then show you the draft to approve as usual.

{{window_hint}}`,
  },
  {
    slug: "telegram.suggest_changes_prompt",
    kind: "telegram_card",
    title: "Suggest changes prompt",
    description: "Sent after Luke taps ✏️ Suggest changes, asking for a voicenote or typed notes.",
    placeholders: [
      { name: "target_name", description: "Who the reply is for.", required: true },
      { name: "current_draft", description: "The draft being revised.", required: true },
    ],
    defaultContent: `✏️ Suggest changes — reply for {{target_name}}

Send me a voicenote now (or type your notes) describing what you want changed. I'll redraft and show you the new version to approve.

Current draft:
{{current_draft}}`,
  },
  {
    slug: "telegram.redraft_card",
    kind: "telegram_card",
    title: "Redraft review card",
    description: "The new Approve / Dismiss card after a revision. {{instructions}} is trimmed automatically to fit.",
    placeholders: [
      { name: "revision", description: "Revision number.", required: true },
      { name: "target_name", description: "Who the reply is for.", required: true },
      { name: "draft", description: "The revised draft.", required: true },
      { name: "media_lines", description: "Attachment note, when the reply carries media." },
      { name: "instructions", description: "What Luke asked for.", required: true },
    ],
    defaultContent: `✏️ Revision {{revision}} — reply for {{target_name}}

Proposed reply — this exact text will be sent:
{{draft}}

{{media_lines}}

You asked for:
{{instructions}}`,
  },
  {
    slug: "telegram.approved_lead_card",
    kind: "telegram_card",
    title: "Approved website lead card",
    description: "Replaces the review card once Luke approves a website-lead draft and gets the tap-to-send button.",
    placeholders: [
      { name: "reply", description: "The approved message.", required: true },
      { name: "truncated_note", description: "Warning when the message is too long to prefill." },
    ],
    defaultContent: `✅ Approved

Tap the button to open WhatsApp with this message prefilled, then hit send:

{{reply}}

{{truncated_note}}`,
  },
  {
    slug: "telegram.approved_lead_card_no_number",
    kind: "telegram_card",
    title: "Approved website lead card (no WhatsApp number)",
    description: "The approved card when the lead gave no usable WhatsApp number.",
    placeholders: [
      { name: "first_name", description: "Lead's first name.", required: true },
      { name: "reply", description: "The approved message.", required: true },
    ],
    defaultContent: `✅ Approved

No WhatsApp number is on file for {{first_name}}, so copy the message below and send it manually:

{{reply}}`,
  },
];

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  ...AI_TEMPLATES,
  ...TELEGRAM_TEMPLATES,
];

export const TEMPLATE_BY_SLUG = new Map(
  TEMPLATE_DEFINITIONS.map((definition) => [definition.slug, definition]),
);

export function getTemplateDefinition(slug: string): TemplateDefinition | undefined {
  return TEMPLATE_BY_SLUG.get(slug);
}
