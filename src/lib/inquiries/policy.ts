import type { InquiryAnalysis } from "@/lib/inquiries/schema";

export type PolicyDecision = {
  decision: "human_review";
  reasons: string[];
};

export function evaluateInquiryPolicy(
  analysis: InquiryAnalysis,
): PolicyDecision {
  const reasons = ["Initial rollout requires Telegram approval for every reply."];

  if (analysis.intents.includes("availability")) {
    reasons.push("Availability has not been checked against an authoritative calendar.");
  }

  if (analysis.intents.includes("pricing")) {
    reasons.push("Pricing has not been checked against versioned package rules.");
  }

  if (analysis.confidence < 0.75) {
    reasons.push("The extraction confidence is below the automatic-send threshold.");
  }

  if (analysis.risk_flags.some((flag) => flag !== "none")) {
    reasons.push(`Risk flags: ${analysis.risk_flags.join(", ")}.`);
  }

  return { decision: "human_review", reasons };
}
