import { describe, expect, it } from "vitest";

import { evaluateInquiryPolicy } from "./policy";
import type { InquiryAnalysis } from "./schema";

const analysis: InquiryAnalysis = {
  intents: ["availability", "pricing"],
  primary_intent: "availability",
  source: "referral",
  lead_temperature: "high",
  confidence: 0.92,
  completeness: 0.8,
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
    referred_by: "Mia",
    requirements: [],
    questions: ["Are you available?", "What do you charge?"],
  },
  missing_fields: [],
  risk_flags: ["availability_unverified", "pricing_unverified"],
  summary: "A detailed wedding availability and pricing enquiry.",
  draft_reply: "Thanks for the detail. I'll check the date properly.",
};

describe("initial inquiry policy", () => {
  it("always requires Telegram review during the first rollout", () => {
    const result = evaluateInquiryPolicy(analysis);

    expect(result.decision).toBe("human_review");
    expect(result.reasons.join(" ")).toContain("Telegram approval");
    expect(result.reasons.join(" ")).toContain("authoritative calendar");
    expect(result.reasons.join(" ")).toContain("package rules");
  });
});
