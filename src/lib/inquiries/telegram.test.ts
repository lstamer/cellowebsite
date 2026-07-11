import { describe, expect, it } from "vitest";

import type { InquiryAnalysis, InquiryMessageRow } from "./schema";
import { buildTelegramReviewText } from "./telegram";

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
