import { describe, expect, it } from "vitest";

import {
  buildDraftingSystemPrompt,
  createInquiryBatchKey,
  renderBrainDocs,
  renderConversationHistory,
  renderMediaLibrary,
  renderReplyExamples,
} from "./ai";
import type {
  BrainDocRow,
  InquiryMessageRow,
  MediaAssetRow,
  ReplyExampleRow,
} from "./schema";
import type { ZernioHistoryMessage } from "./zernio";

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
});

describe("buildDraftingSystemPrompt", () => {
  it("stitches rules, knowledge, examples and media together", () => {
    const prompt = buildDraftingSystemPrompt({
      brainDocs: [brainDoc],
      examples: [correction],
      mediaAssets: [mediaAsset],
    });
    expect(prompt).toContain("Never say a date is available");
    expect(prompt).toContain("Never use an em dash");
    expect(prompt).toContain("BUSINESS KNOWLEDGE");
    expect(prompt).toContain("LEARNED CORRECTIONS");
    expect(prompt).toContain("MEDIA LIBRARY");
  });
});
