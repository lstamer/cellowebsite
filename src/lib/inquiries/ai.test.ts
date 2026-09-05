import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildDraftingRules,
  buildDraftingSystemPrompt,
  buildInquiryRedraftSystemPrompt,
  buildWebsiteLeadRedraftSystemPrompt,
  buildWebsiteLeadSystemPrompt,
  createInquiryBatchKey,
  redraftInquiryReply,
  renderAvailabilityFact,
  renderBrainDocs,
  describeHistoryWindow,
  renderConversationHistory,
  renderMediaLibrary,
  renderRedraftInstructions,
  renderReplyExamples,
  renderWebsiteLead,
} from "./ai";
import type {
  BrainDocRow,
  InquiryMessageRow,
  MediaAssetRow,
  ReplyExampleRow,
  WebsiteLeadDetails,
} from "./schema";
import type { ZernioHistoryMessage } from "./zernio";

const generateTextMock = vi.hoisted(() => vi.fn());
const getActiveBrainDocsMock = vi.hoisted(() => vi.fn());
const getActiveMediaAssetsMock = vi.hoisted(() => vi.fn());
const getMatchingReplyExamplesMock = vi.hoisted(() => vi.fn());

// Only the generation call is replaced; the rest of the AI SDK (Output.object
// and friends) stays real so the prompt is assembled exactly as in production.
vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  generateText: generateTextMock,
}));
vi.mock("@/lib/inquiries/supabase", () => ({
  getActiveBrainDocs: getActiveBrainDocsMock,
  getActiveMediaAssets: getActiveMediaAssetsMock,
  getMatchingReplyExamples: getMatchingReplyExamplesMock,
  listActivePromptOverrides: vi.fn(async () => []),
}));

const brainDoc: BrainDocRow = {
  slug: "pricing-policy",
  title: "Pricing policy",
  category: "pricing",
  content: "NEVER state a price. Luke confirms pricing personally.",
};

const correction: ReplyExampleRow = {
  kind: "override",
  customer_message: "How much for a wedding in Paarl?",
  situation_summary: "Pricing question for a Paarl wedding.",
  rejected_draft: "Our packages start from...",
  reply: "Lovely — Paarl is home turf for me. Let me put a proper quote together once I know the date and how long you'd like music for.",
};

const voiceExample: ReplyExampleRow = {
  kind: "past_chat",
  customer_message: "Do you play at birthday dinners?",
  situation_summary: null,
  rejected_draft: null,
  reply: "I do — intimate dinners are some of my favourite evenings to play.",
};

const mediaAsset: MediaAssetRow = {
  slug: "wedding-showreel",
  title: "Wedding showreel",
  description: "60s highlight video of ceremony performances.",
  media_type: "video",
  url: "https://example.com/showreel.mp4",
  mime_type: "video/mp4",
};

describe("createInquiryBatchKey", () => {
  it("is stable regardless of message order", () => {
    expect(createInquiryBatchKey("conv", ["b", "a"])).toBe(
      createInquiryBatchKey("conv", ["a", "b"]),
    );
  });
});

describe("renderBrainDocs", () => {
  it("marks knowledge as authoritative and includes content", () => {
    const rendered = renderBrainDocs([brainDoc]);
    expect(rendered).toContain("authoritative");
    expect(rendered).toContain("NEVER state a price");
  });

  it("instructs conservative drafting when empty", () => {
    expect(renderBrainDocs([])).toContain("Draft conservatively");
  });
});

describe("renderReplyExamples", () => {
  it("returns nothing for an empty corpus", () => {
    expect(renderReplyExamples([])).toBe("");
  });

  it("separates corrections from voice examples", () => {
    const rendered = renderReplyExamples([correction, voiceExample]);
    expect(rendered).toContain("LEARNED CORRECTIONS");
    expect(rendered).toContain("Rejected draft: Our packages start from...");
    expect(rendered).toContain("Luke sent instead:");
    expect(rendered).toContain("VOICE EXAMPLES");
    expect(rendered).toContain("intimate dinners");
  });

  it("scopes corrections to similar enquiries", () => {
    const rendered = renderReplyExamples([correction]);
    expect(rendered).toContain("only to similar enquiries");
  });
});

describe("renderMediaLibrary", () => {
  it("demands an empty proposal when the library is empty", () => {
    expect(renderMediaLibrary([])).toContain("empty array");
  });

  it("lists slugs with descriptions and caps proposals", () => {
    const rendered = renderMediaLibrary([mediaAsset]);
    expect(rendered).toContain("slug: wedding-showreel (video)");
    expect(rendered).toContain("at most 2 media attachments");
    expect(rendered).toContain("Never invent a slug");
  });
});

describe("renderConversationHistory", () => {
  const burst: InquiryMessageRow[] = [
    {
      id: "00000000-0000-4000-8000-000000000001",
      body: "And do you travel to Hermanus?",
      attachments: [],
      occurred_at: "2026-07-14T10:00:00.000Z",
      sender_snapshot: {},
    },
  ];

  const history: ZernioHistoryMessage[] = [
    {
      direction: "incoming",
      text: "Hi Luke, wedding on 21 March?",
      sentAt: "2026-07-01T09:00:00.000Z",
    },
    {
      direction: "outgoing",
      text: "Lovely — let me check the date and come back to you.",
      sentAt: "2026-07-01T10:00:00.000Z",
    },
    // The burst itself, echoed back by the history API — must be dropped.
    {
      direction: "incoming",
      text: "And do you travel to Hermanus?",
      sentAt: "2026-07-14T10:00:00.000Z",
    },
  ];

  // Distinct, ordered timestamps well before the burst, so every synthetic
  // message survives the burst-echo filter and oldest_at/newest_at are real.
  const threadStart = Date.parse("2026-07-02T09:00:00.000Z");
  const buildThread = (count: number, textChars: number): ZernioHistoryMessage[] =>
    Array.from({ length: count }, (_, index) => ({
      direction: index % 2 === 0 ? "incoming" : "outgoing",
      text: `Message ${index} ${"x".repeat(textChars)}`,
      sentAt: new Date(threadStart + index * 60_000).toISOString(),
    }));

  it("returns nothing when there is no prior history", () => {
    expect(renderConversationHistory([], burst)).toBe("");
  });

  it("labels directions and excludes the current burst", () => {
    const rendered = renderConversationHistory(history, burst);
    expect(rendered).toContain("Customer: Hi Luke, wedding on 21 March?");
    expect(rendered).toContain("Luke: Lovely — let me check the date");
    expect(rendered).not.toContain("Customer: And do you travel to Hermanus?");
    expect(rendered).toContain("ongoing relationship");
  });

  // The traced depth must describe what the model saw, not what was fetched,
  // or the trace would overstate how much history the draft had.
  it("reports the window that actually reached the prompt", () => {
    // The echoed burst message is excluded as an echo, NOT charged to the
    // character budget — conflating the two would misreport how much history
    // the window can actually hold.
    expect(describeHistoryWindow(history, burst)).toEqual({
      fetched: 3,
      excluded_as_current_burst: 1,
      dropped_for_budget: 0,
      individually_truncated: 0,
      omitted_for_budget: 0,
      included: 2,
      oldest_at: "2026-07-01T09:00:00.000Z",
      newest_at: "2026-07-01T10:00:00.000Z",
    });

    expect(describeHistoryWindow([], burst)).toEqual({
      fetched: 0,
      excluded_as_current_burst: 0,
      dropped_for_budget: 0,
      individually_truncated: 0,
      omitted_for_budget: 0,
      included: 0,
      oldest_at: null,
      newest_at: null,
    });
  });

  // Regression: a single prior message longer than the old flat 4,000-char
  // budget used to empty the window, which silently deleted the HISTORY_RULES
  // block and made the model draft as if this were first contact. WhatsApp
  // allows 4,096-char messages, so one long paste was enough to trigger it.
  // It must survive, and — since it is far below the verbatim budget — survive
  // whole rather than clipped.
  it("keeps a long lone message verbatim instead of dropping the whole history", () => {
    const text = `Brief for the day: ${"y".repeat(5_000)}`;
    const oversized: ZernioHistoryMessage[] = [
      { direction: "incoming", text, sentAt: "2026-07-02T09:00:00.000Z" },
    ];

    const rendered = renderConversationHistory(oversized, burst);
    expect(rendered).toContain("ongoing relationship");
    expect(rendered).toContain(`Customer: ${text}`);
    expect(rendered).not.toContain("[...truncated]");

    expect(describeHistoryWindow(oversized, burst)).toMatchObject({
      included: 1,
      individually_truncated: 0,
      omitted_for_budget: 0,
    });
  });

  // Regression: the per-message clip once sat at 2,000 characters and fired
  // unconditionally, so a customer who wrote a detailed brief lost most of it
  // while ~57,000 characters of thread budget went unused. Anything WhatsApp
  // can actually deliver (its own cap is 4,096) must arrive intact.
  it("passes a detailed customer brief through verbatim", () => {
    const text = `Here is everything about our wedding: ${"d".repeat(3_000)}`;
    const brief: ZernioHistoryMessage[] = [
      { direction: "incoming", text, sentAt: "2026-07-02T09:00:00.000Z" },
    ];

    const rendered = renderConversationHistory(brief, burst);
    expect(rendered).toContain("ongoing relationship");
    expect(rendered).toContain(`Customer: ${text}`);
    expect(rendered).not.toContain("[...truncated]");

    expect(describeHistoryWindow(brief, burst)).toMatchObject({
      included: 1,
      individually_truncated: 0,
      omitted_for_budget: 0,
    });
  });

  // The clip is a guard against text WhatsApp could never have produced (a
  // pasted transcript, a malformed provider payload). It still has to fire, and
  // still has to keep the message in the window rather than drop it.
  it("clips a message no WhatsApp client could have sent, but keeps it", () => {
    const text = `Pasted transcript: ${"z".repeat(15_000)}`;
    const pathological: ZernioHistoryMessage[] = [
      { direction: "incoming", text, sentAt: "2026-07-02T09:00:00.000Z" },
    ];

    const rendered = renderConversationHistory(pathological, burst);
    expect(rendered).toContain("ongoing relationship");
    expect(rendered).toContain(
      `Customer: ${text.slice(0, 10_000)} [...truncated]`,
    );
    expect(rendered).not.toContain(text);

    expect(describeHistoryWindow(pathological, burst)).toMatchObject({
      included: 1,
      individually_truncated: 1,
      omitted_for_budget: 0,
    });
  });

  it("keeps a 500 message thread whole when it fits the verbatim budget", () => {
    const thread = buildThread(500, 30);
    const rendered = renderConversationHistory(thread, burst);

    for (const index of [0, 1, 249, 498, 499]) {
      expect(rendered).toContain(`Message ${index} `);
    }
    expect(rendered).not.toContain("earlier message");

    expect(describeHistoryWindow(thread, burst)).toMatchObject({
      fetched: 500,
      excluded_as_current_burst: 0,
      included: 500,
      individually_truncated: 0,
      omitted_for_budget: 0,
    });
  });

  it("drops the oldest messages past the budget and states how many", () => {
    const thread = buildThread(500, 400);
    const rendered = renderConversationHistory(thread, burst);
    const window = describeHistoryWindow(thread, burst);

    expect(window.omitted_for_budget).toBeGreaterThan(0);
    expect(window.included + window.omitted_for_budget).toBe(500);
    expect(window.individually_truncated).toBe(0);
    expect(rendered).toContain(`${window.omitted_for_budget} earlier message`);

    // The newest content survives verbatim, the cut is a clean boundary, and
    // no message is both omitted and included.
    expect(rendered).toContain(`Message 499 ${"x".repeat(400)}`);
    expect(rendered).toContain(`Message ${window.omitted_for_budget} `);
    expect(rendered).not.toContain(`Message ${window.omitted_for_budget - 1} `);
    expect(rendered).not.toContain("Message 0 ");
  });

  // Both narrowing mechanisms at once: every message is individually clipped
  // AND the thread is still long enough to lose its oldest messages. The
  // window must stay non-empty and report both numbers separately.
  it("clips and omits together without emptying the window", () => {
    const thread = buildThread(40, 10_000);
    const window = describeHistoryWindow(thread, burst);

    expect(window.included).toBeGreaterThanOrEqual(10);
    expect(window.individually_truncated).toBe(window.included);
    expect(window.omitted_for_budget).toBeGreaterThan(0);
    expect(window.included + window.omitted_for_budget).toBe(40);
    expect(renderConversationHistory(thread, burst)).toContain("[...truncated]");
  });

  // The invariant behind the two mechanisms above, asserted on its own: any
  // prior history at all must reach the prompt with HISTORY_RULES attached.
  // An empty window is not "less context", it is the model told this is a first
  // contact — the bug that had Luke greeting existing clients as strangers.
  it("never empties the window while prior history exists", () => {
    for (const thread of [
      buildThread(1, 500_000),
      buildThread(3, 200_000),
      buildThread(200, 50_000),
    ]) {
      const rendered = renderConversationHistory(thread, burst);
      expect(rendered).not.toBe("");
      expect(rendered).toContain("ongoing relationship");
      expect(describeHistoryWindow(thread, burst).included).toBeGreaterThan(0);
    }
  });

  it("still excludes the current burst echo inside a 500 message thread", () => {
    const thread: ZernioHistoryMessage[] = [
      ...buildThread(500, 30),
      {
        direction: "incoming",
        text: "And do you travel to Hermanus?",
        sentAt: "2026-07-14T10:00:00.000Z",
      },
    ];

    const rendered = renderConversationHistory(thread, burst);
    expect(rendered).not.toContain("Customer: And do you travel to Hermanus?");
    expect(describeHistoryWindow(thread, burst)).toMatchObject({
      fetched: 501,
      excluded_as_current_burst: 1,
      included: 500,
    });
  });
});

const websiteLead: WebsiteLeadDetails = {
  leadId: "0f6dbf26-c2c8-4da6-8bd4-a894232b53c8",
  source: "lead_form",
  firstName: "Sam",
  lastName: "Naidoo",
  eventType: "Wedding",
  eventDateText: "2026-11-14",
  dateFlexible: false,
  location: "Stellenbosch",
  guestCount: 80,
  performanceMinutes: 45,
  bookerRole: "Bride",
  message: "We'd love cello for the ceremony.",
  notes: null,
  availability: "available",
  whatsappDigits: "27821234567",
};

describe("buildDraftingRules", () => {
  it("returns the standing rules unchanged without a confirmed fact", () => {
    const rules = buildDraftingRules();
    expect(rules).toContain("Never say a date is available");
    expect(rules).toContain(
      "If availability is asked, say Luke (you) will check",
    );
  });

  it("swaps the availability ban for the confirmed fact but keeps the price ban", () => {
    const rules = buildDraftingRules({
      confirmedAvailability: {
        availability: "available",
        dateText: "14 November 2026",
      },
    });
    expect(rules).toContain("IS available on 14 November 2026");
    expect(rules).not.toContain("Never say a date is available");
    expect(rules).not.toContain("will check and let them know soon");
    expect(rules).toContain("Never quote a price");
    expect(rules).toContain("this one date only");
  });

  it("turns an unavailable answer into a warm decline instruction", () => {
    const rules = buildDraftingRules({
      confirmedAvailability: { availability: "unavailable", dateText: null },
    });
    expect(rules).toContain("NOT available on the requested date");
    expect(rules).toContain("Decline warmly");
    expect(rules).toContain("ask whether it is flexible");
  });
});

describe("renderAvailabilityFact", () => {
  it("renders nothing without a fact", () => {
    expect(renderAvailabilityFact(null)).toBe("");
    expect(renderAvailabilityFact(undefined)).toBe("");
  });

  it("states the confirmed answer and its scope", () => {
    const available = renderAvailabilityFact({
      availability: "available",
      dateText: "14 November 2026",
    });
    expect(available).toContain("HUMAN-CONFIRMED AVAILABILITY");
    expect(available).toContain("IS available on 14 November 2026");
    expect(available).toContain("this one date only");

    const unavailable = renderAvailabilityFact({
      availability: "unavailable",
      dateText: "14 November 2026",
    });
    expect(unavailable).toContain("NOT available");
    expect(unavailable).toContain("warm, brief decline");
  });
});

describe("website lead drafting prompt", () => {
  it("renders only the populated form fields", () => {
    const rendered = renderWebsiteLead(websiteLead);
    expect(rendered).toContain("Name: Sam Naidoo");
    expect(rendered).toContain("Event type: Wedding");
    expect(rendered).toContain("Guests: 80");
    expect(rendered).not.toContain("Notes:");
  });

  it("frames the draft as Luke's opening message with the confirmed fact and no media", () => {
    const prompt = buildWebsiteLeadSystemPrompt({
      lead: websiteLead,
      availability: "available",
      brainDocs: [brainDoc],
      examples: [correction],
    });
    expect(prompt).toContain("OPENING message");
    expect(prompt).toContain("IS available on 2026-11-14");
    expect(prompt).toContain("HUMAN-CONFIRMED AVAILABILITY");
    expect(prompt).toContain("BUSINESS KNOWLEDGE");
    expect(prompt).toContain("ONE single WhatsApp message");
    expect(prompt).not.toContain("MEDIA LIBRARY");
  });

  it("asks about flexible dates when declining a flexible enquiry", () => {
    const prompt = buildWebsiteLeadSystemPrompt({
      lead: { ...websiteLead, dateFlexible: true, availability: "unavailable" },
      availability: "unavailable",
      brainDocs: [],
      examples: [],
    });
    expect(prompt).toContain("NOT available");
    expect(prompt).toContain("date is flexible");
  });
});

describe("buildDraftingSystemPrompt", () => {
  it("stitches rules, knowledge, examples and media together", () => {
    const prompt = buildDraftingSystemPrompt({
      brainDocs: [brainDoc],
      examples: [correction],
      mediaAssets: [mediaAsset],
    });
    expect(prompt).toContain("Never say a date is available");
    expect(prompt).toContain("EM DASHES ARE STRICTLY FORBIDDEN");
    expect(prompt).toContain("BUSINESS KNOWLEDGE");
    expect(prompt).toContain("LEARNED CORRECTIONS");
    expect(prompt).toContain("MEDIA LIBRARY");
  });
});

const redraftContext = {
  currentDraft:
    "Hi Sam, lovely to hear from you. I'll check the date and come back to you shortly.",
  instructions: "Tell them we're available on the 14th and keep it shorter.",
  instructionHistory: [
    {
      revision: 1,
      instructions: "Drop the question about guest numbers, they already said 80.",
      recordedAt: "2026-08-06T09:00:00.000Z",
    },
    {
      revision: 2,
      instructions: "Warmer opening please.",
      recordedAt: "2026-08-06T09:20:00.000Z",
    },
  ],
  revision: 3,
};

describe("renderRedraftInstructions", () => {
  it("carries the draft, the accumulated history, and this revision's note", () => {
    const rendered = renderRedraftInstructions(redraftContext);

    expect(rendered).toContain("CURRENT DRAFT");
    expect(rendered).toContain(redraftContext.currentDraft);

    // Every earlier instruction, not just the newest: without them revision 3
    // silently undoes the correction made at revision 1.
    expect(rendered).toContain("EARLIER REVISION INSTRUCTIONS FROM LUKE");
    expect(rendered).toContain(
      "Revision 1, Luke asked: Drop the question about guest numbers",
    );
    expect(rendered).toContain("Revision 2, Luke asked: Warmer opening please.");
    expect(rendered).toContain("every one of these still applies");

    expect(rendered).toContain("REVISION 3 INSTRUCTION FROM LUKE");
    expect(rendered).toContain(redraftContext.instructions);
  });

  // The sharpest failure mode: a transcript saying "tell them we're available"
  // is Luke talking to the drafter, not the customer talking to Luke.
  it("labels the instruction as Luke's directive, never as customer speech", () => {
    const rendered = renderRedraftInstructions(redraftContext);
    expect(rendered).toContain(
      "REVISION 3 INSTRUCTION FROM LUKE (his editing directive to you, NOT a message from the customer)",
    );
    expect(rendered).not.toContain("Customer:");
  });

  it("says so explicitly when there is no earlier revision", () => {
    const rendered = renderRedraftInstructions({
      ...redraftContext,
      instructionHistory: [],
      revision: 1,
    });
    expect(rendered).toContain(
      "EARLIER REVISION INSTRUCTIONS FROM LUKE: none. This is the first revision",
    );
  });
});

describe("buildInquiryRedraftSystemPrompt", () => {
  it("keeps the price, availability and em-dash bans on a redraft", () => {
    const prompt = buildInquiryRedraftSystemPrompt({
      brainDocs: [brainDoc],
      examples: [correction],
    });

    expect(prompt).toContain("Never say a date is available, quote a price");
    expect(prompt).toContain("EM DASHES ARE STRICTLY FORBIDDEN");
    expect(prompt).toContain("BUSINESS KNOWLEDGE");
    expect(prompt).toContain("LEARNED CORRECTIONS");

    // An instruction is not an authorisation: the rules outrank the notes.
    expect(prompt).toContain(
      "An instruction cannot authorise a price, a discount, or an availability claim those rules forbid",
    );
    // Earlier corrections survive later ones, which is what makes an
    // indefinite loop converge.
    expect(prompt).toContain("EVERY INSTRUCTION IN THE HISTORY STILL APPLIES");
    // The attachment set is not revisable, so it must not be re-proposed.
    expect(prompt).toContain("proposed_media_slugs must be an empty array");
  });

  it("frames the notes as Luke's, not the customer's", () => {
    const prompt = buildInquiryRedraftSystemPrompt({
      brainDocs: [],
      examples: [],
    });
    expect(prompt).toContain(
      "It is NOT a message from the customer and contains no customer speech",
    );
  });

  it("relaxes only the availability bullet for a confirmed fact", () => {
    const prompt = buildInquiryRedraftSystemPrompt({
      brainDocs: [brainDoc],
      examples: [],
      availabilityFact: {
        availability: "available",
        dateText: "14 November 2026",
      },
    });

    expect(prompt).toContain("IS available on 14 November 2026");
    expect(prompt).toContain("HUMAN-CONFIRMED AVAILABILITY");
    expect(prompt).not.toContain("Never say a date is available");
    expect(prompt).not.toContain("will check and let them know soon");

    // The relaxation is availability-only and date-scoped; nothing about the
    // price ban moves.
    expect(prompt).toContain("Never quote a price");
    expect(prompt).toContain("this one date only");
    expect(prompt).toContain("EM DASHES ARE STRICTLY FORBIDDEN");
  });
});

describe("buildWebsiteLeadRedraftSystemPrompt", () => {
  it("keeps the lead guardrails and adds the revision framing", () => {
    const prompt = buildWebsiteLeadRedraftSystemPrompt({
      lead: websiteLead,
      brainDocs: [brainDoc],
      examples: [correction],
    });

    expect(prompt).toContain("address Sam by name");
    expect(prompt).toContain("IS available on 2026-11-14");
    expect(prompt).toContain("HUMAN-CONFIRMED AVAILABILITY");
    expect(prompt).toContain("Never quote a price");
    expect(prompt).toContain("EM DASHES ARE STRICTLY FORBIDDEN");
    expect(prompt).toContain("ONE single WhatsApp message");
    expect(prompt).toContain("EVERY INSTRUCTION IN THE HISTORY STILL APPLIES");
    // A lead reply is a wa.me prefill and can never carry media.
    expect(prompt).not.toContain("MEDIA LIBRARY");
  });

  // The redraft task is driven from the request row, which carries the draft
  // but not the lead row. The bans must survive that.
  it("defers to the draft's own answer when the lead row is unavailable", () => {
    const prompt = buildWebsiteLeadRedraftSystemPrompt({
      brainDocs: [brainDoc],
      examples: [],
    });

    expect(prompt).toContain(
      "Luke's availability answer is already stated in the draft being revised",
    );
    expect(prompt).toContain("never add, remove, or reverse an availability claim");
    expect(prompt).toContain("Never quote a price");
    expect(prompt).toContain("EM DASHES ARE STRICTLY FORBIDDEN");
    expect(prompt).not.toContain("HUMAN-CONFIRMED AVAILABILITY");
    expect(prompt).toContain(
      "address them by the name the draft being revised already uses",
    );
  });
});

// A revision must be grounded in the SAME learned corrections as the draft it
// revises. Retrieval is an ANY-overlap capped at 6 rows newest-first, so a
// wider intent list does not add matches, it evicts them — and any list that
// reaches a priced correction puts a real rand figure in front of a model
// answering an enquiry where price was never raised.
describe("redraftInquiryReply retrieval scoping", () => {
  beforeEach(() => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "test-model");

    getActiveBrainDocsMock.mockReset();
    getActiveBrainDocsMock.mockResolvedValue([brainDoc]);
    getActiveMediaAssetsMock.mockReset();
    getActiveMediaAssetsMock.mockResolvedValue([]);

    // Stands in for the corpus: the pricing correction is reachable only by
    // asking for "pricing", exactly as `.overlaps` behaves.
    getMatchingReplyExamplesMock.mockReset();
    getMatchingReplyExamplesMock.mockImplementation(async (intents: string[]) =>
      intents.includes("pricing") ? [correction] : [],
    );

    generateTextMock.mockReset();
    generateTextMock.mockResolvedValue({
      output: { draft_messages: ["Warmer, shorter version of the draft."] },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const systemPrompt = () =>
    (generateTextMock.mock.calls[0]?.[0] as { instructions: string }).instructions;

  it("retrieves against the intents the first draft was grounded in", async () => {
    await redraftInquiryReply({
      ...redraftContext,
      intents: ["repertoire", "greeting"],
    });

    expect(getMatchingReplyExamplesMock).toHaveBeenCalledWith([
      "repertoire",
      "greeting",
    ]);
  });

  it("pulls no pricing corrections for a cosmetic-only instruction", async () => {
    const { draft } = await redraftInquiryReply({
      ...redraftContext,
      instructions: "Make it warmer.",
    });

    // No intents means no guessed superset, so nothing widens retrieval.
    const [requested] = getMatchingReplyExamplesMock.mock.calls[0] as [string[]];
    expect(requested).toEqual([]);
    expect(requested).not.toContain("pricing");

    // And nothing priced reaches the prompt.
    expect(systemPrompt()).not.toContain("LEARNED CORRECTIONS");
    expect(systemPrompt()).not.toContain("Paarl is home turf for me");
    expect(draft).toBe("Warmer, shorter version of the draft.");
  });

  it("keeps the guardrails on the narrowed prompt", async () => {
    await redraftInquiryReply({ ...redraftContext, intents: ["repertoire"] });

    expect(systemPrompt()).toContain("Never say a date is available, quote a price");
    expect(systemPrompt()).toContain("EM DASHES ARE STRICTLY FORBIDDEN");
    expect(systemPrompt()).toContain(
      "An instruction cannot authorise a price, a discount, or an availability claim those rules forbid",
    );
    expect(systemPrompt()).toContain("proposed_media_slugs must be an empty array");
  });
});
