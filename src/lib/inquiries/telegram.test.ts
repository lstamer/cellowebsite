import { describe, expect, it } from "vitest";

import type {
  InquiryAnalysis,
  InquiryMessageRow,
  MediaAssetRow,
  WebsiteLeadDetails,
} from "./schema";
import {
  buildTelegramAvailabilityQuestionText,
  buildTelegramRedraftText,
  buildTelegramReviewText,
  buildTelegramSuggestChangesPromptText,
  buildTelegramWebsiteLeadReviewText,
  buildWaMePrefill,
  WA_ME_URL_MAX,
} from "./telegram";

const analysis: InquiryAnalysis = {
  intents: ["availability"],
  primary_intent: "availability",
  source: "unknown",
  lead_temperature: "high",
  confidence: 0.9,
  completeness: 0.7,
  event: {
    contact_name: "Sam",
    organisation: null,
    event_type: "wedding",
    event_date_text: "14 November 2026",
    event_date_iso: "2026-11-14",
    date_flexible: false,
    event_time_text: null,
    location: "Stellenbosch",
    venue: null,
    guest_count: null,
    duration_minutes: null,
    budget_text: null,
    referred_by: null,
    requirements: [],
    questions: ["Are you available?"],
  },
  missing_fields: [],
  risk_flags: ["availability_unverified"],
  summary: "A detailed wedding availability enquiry.",
  draft_reply:
    "Thanks for the details, Sam. I'll check 14 November properly and come back to you.",
  proposed_media_slugs: [],
};

describe("Telegram review cards", () => {
  it("always includes the complete exact draft even when the transcript is long", () => {
    const messages: InquiryMessageRow[] = Array.from({ length: 20 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      body: `Message ${index}: ${"detail ".repeat(80)}`,
      attachments: [],
      occurred_at: "2026-07-11T09:00:00.000Z",
      sender_snapshot: {},
    }));

    const text = buildTelegramReviewText({ analysis, messages });

    expect(text).toContain("this exact text will be sent");
    expect(text).toContain(analysis.draft_reply);
    expect(text).toContain("transcript truncated");
    expect(text.length).toBeLessThanOrEqual(4_000);
  });
});

describe("buildWaMePrefill", () => {
  it("URL-encodes the message for a tap-to-send link", () => {
    const { url, truncated } = buildWaMePrefill(
      "27821234567",
      "Hi Sam! I'm available on 14 November 🙂",
    );

    expect(truncated).toBe(false);
    expect(url.startsWith("https://wa.me/27821234567?text=")).toBe(true);
    expect(url).toContain(encodeURIComponent("14 November"));
    expect(url).not.toContain(" ");
  });

  it("collapses bubble delimiters into blank lines", () => {
    const { url } = buildWaMePrefill("27821234567", "First bubble\n---\nSecond bubble");

    expect(decodeURIComponent(url.split("?text=")[1])).toBe(
      "First bubble\n\nSecond bubble",
    );
  });

  it("falls back to a bare chat link when the encoded URL would be too long", () => {
    const { url, truncated } = buildWaMePrefill(
      "27821234567",
      "🎻".repeat(1_000),
    );

    expect(truncated).toBe(true);
    expect(url).toBe("https://wa.me/27821234567");
    expect(url.length).toBeLessThanOrEqual(WA_ME_URL_MAX);
  });
});

const mediaAsset: MediaAssetRow = {
  slug: "wedding-highlights",
  title: "Wedding highlights",
  description: "60s highlight video of ceremony performances.",
  media_type: "video",
  url: "https://example.com/highlights.mp4",
  mime_type: "video/mp4",
};

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

describe("buildTelegramWebsiteLeadReviewText", () => {
  it("shows the exact draft, the availability decision, and the override invite", () => {
    const text = buildTelegramWebsiteLeadReviewText({
      lead: websiteLead,
      draft: "Hi Sam, Luke here. 14 November is free on my side 🙂",
    });

    expect(text).toContain("Website lead reply — Sam");
    expect(text).toContain("AVAILABLE ✅");
    expect(text).toContain("this exact text will be prefilled");
    expect(text).toContain("14 November is free on my side");
    expect(text).toContain("Their message:");
    expect(text).toContain("type a message");
    expect(text.length).toBeLessThanOrEqual(4_000);
  });

  it("marks unavailable decisions", () => {
    const text = buildTelegramWebsiteLeadReviewText({
      lead: { ...websiteLead, availability: "unavailable" },
      draft: "Hi Sam, sadly I'm already booked that day.",
    });

    expect(text).toContain("UNAVAILABLE ❌");
  });
});

describe("buildTelegramAvailabilityQuestionText", () => {
  it("asks about the extracted date and explains what the answer unblocks", () => {
    const text = buildTelegramAvailabilityQuestionText({
      contactName: "Sam",
      eventDateText: "14 November 2026",
      eventContext: "Wedding ceremony in Stellenbosch, about 80 guests.",
      serviceWindowExpiresAt: "2026-08-07T09:00:00.000Z",
    });

    expect(text).toContain("Are you available on 14 November 2026?");
    expect(text).toContain("Sam is asking about availability.");
    expect(text).toContain("Wedding ceremony in Stellenbosch");
    expect(text).toContain("unblocks the reply draft");
    expect(text).toContain("reply window closes");
  });

  it("copes with a missing date and window", () => {
    const text = buildTelegramAvailabilityQuestionText({
      contactName: null,
      eventDateText: null,
      eventContext: null,
      serviceWindowExpiresAt: null,
    });

    expect(text).toContain("No date given yet");
    expect(text).not.toContain("reply window closes");
  });
});

describe("buildTelegramSuggestChangesPromptText", () => {
  it("names the target, asks for a voicenote, and shows the draft being revised", () => {
    const text = buildTelegramSuggestChangesPromptText({
      targetName: "Sam Naidoo",
      currentDraft: "Hi Sam, Luke here. 14 November is free on my side 🙂",
    });

    expect(text).toContain("Sam Naidoo");
    expect(text).toContain("voicenote");
    expect(text).toContain("Current draft:");
    expect(text).toContain("14 November is free on my side");
    expect(text.length).toBeLessThanOrEqual(4_000);
  });
});

describe("buildTelegramRedraftText", () => {
  const draft =
    "Hi Sam, Luke here. 14 November is wide open and I'd love to play for you. Shall I hold the date?";

  it("shows the revision number, the full new draft, and the notes that produced it", () => {
    const text = buildTelegramRedraftText({
      draft,
      targetName: "Sam Naidoo",
      instructions: "Make it warmer and mention the ceremony set.",
      revision: 3,
    });

    expect(text).toContain("Revision 3");
    expect(text).toContain("Sam Naidoo");
    expect(text).toContain(draft);
    expect(text).toContain("You asked for:");
    expect(text).toContain("Make it warmer and mention the ceremony set.");
    expect(text.length).toBeLessThanOrEqual(4_000);
  });

  it("keeps the new draft intact when the instructions and name are long", () => {
    const text = buildTelegramRedraftText({
      draft,
      targetName: "Sam ".repeat(200),
      instructions: `${"Please rewrite this whole thing again. ".repeat(300)}`,
      revision: 12,
    });

    expect(text).toContain(draft);
    expect(text).toContain("Revision 12");
    expect(text).toContain("notes truncated");
    expect(text.length).toBeLessThanOrEqual(4_000);
  });

  // A revision rewrites words only, so the attachment set survives it. A card
  // that says "this exact text will be sent" while a video still ships on
  // Approve is the card lying about what the customer receives.
  it("names the attachments that still send and says a revision cannot change them", () => {
    const text = buildTelegramRedraftText({
      draft,
      targetName: "Sam Naidoo",
      instructions: "Drop the bit about sending a clip, just answer the timings.",
      revision: 2,
      mediaAssets: [mediaAsset],
    });

    expect(text).toContain("Attachments on approve: Wedding highlights (video)");
    expect(text).toContain(
      "A revision changes the words only, so these attachments are unchanged and still send on approve.",
    );
    expect(text).toContain(draft);
    expect(text.length).toBeLessThanOrEqual(4_000);
  });

  it("keeps both the attachment line and the full draft when the notes are long", () => {
    const text = buildTelegramRedraftText({
      draft,
      targetName: "Sam Naidoo",
      instructions: `${"Please rewrite this whole thing again. ".repeat(300)}`,
      revision: 12,
      mediaAssets: [mediaAsset, { ...mediaAsset, slug: "quartet", title: "Quartet set", media_type: "image" }],
    });

    expect(text).toContain(draft);
    expect(text).toContain(
      "Attachments on approve: Wedding highlights (video), Quartet set (image)",
    );
    expect(text).toContain("notes truncated");
    expect(text.length).toBeLessThanOrEqual(4_000);
  });

  it("stays silent about attachments when there are none", () => {
    const text = buildTelegramRedraftText({
      draft,
      targetName: "Sam Naidoo",
      instructions: "Make it shorter.",
      revision: 2,
      mediaAssets: [],
    });

    expect(text).not.toContain("Attachments on approve");
    expect(text).toContain(draft);
  });
});
