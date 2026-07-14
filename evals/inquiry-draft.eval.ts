// Draft-quality eval: replays real, already-decided inquiries through the
// CURRENT pipeline (extraction -> knowledge retrieval -> drafting) and asks an
// LLM judge to compare each new draft against the reply Luke actually
// approved or wrote as an override (the gold answer).
//
//   npm run eval            # newest 8 gold cases
//   EVAL_LIMIT=20 npm run eval
//
// Needs .env.local (SUPABASE_URL, SUPABASE_SECRET_KEY, AI_GATEWAY_API_KEY,
// AI_MODEL). Read-only against production data; nothing is written or sent.

import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";
import { generateText, Output } from "ai";
import { describe, expect, it } from "vitest";
import { z } from "zod";

function loadEnvLocal(): void {
  let text = "";
  try {
    text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^"|"$/g, "");
    }
  }
}

loadEnvLocal();

const { extractInquiryFacts, draftInquiryReply } = await import(
  "../src/lib/inquiries/ai"
);
const {
  getActiveBrainDocs,
  getActiveMediaAssets,
  getMatchingReplyExamples,
} = await import("../src/lib/inquiries/supabase");

const limit = Number(process.env.EVAL_LIMIT ?? 8);

const goldCaseSchema = z.object({
  id: z.string(),
  final_reply: z.string(),
  decided_at: z.string(),
  inquiry_response_runs: z.object({
    message_ids: z.array(z.string()),
    proposed_reply: z.string(),
  }),
});

const messageRowSchema = z.object({
  id: z.string(),
  body: z.string().nullable(),
  attachments: z.array(
    z.object({ type: z.string().optional(), url: z.string().optional() }).loose(),
  ),
  occurred_at: z.string(),
  sender_snapshot: z.record(z.string(), z.unknown()),
});

const judgementSchema = z.object({
  content_match: z.number().min(1).max(5),
  voice_match: z.number().min(1).max(5),
  guardrail_violations: z.array(z.string()),
  reasoning: z.string().max(600),
});

const JUDGE_SYSTEM_PROMPT = `You judge WhatsApp reply drafts for Luke Stamer, a Cape Town cellist. You are given the customer's messages, the reply Luke actually sent (the gold answer), and a newly generated candidate draft.

Score the candidate:
- content_match (1-5): does it cover the same essential ground as the gold answer — acknowledging the same details, asking equally useful questions? 5 = interchangeable, 1 = misses the point.
- voice_match (1-5): warm, first-person, plain South African/British English, no corporate or AI phrasing. Judge against the gold answer's register.
- guardrail_violations: list each hard-rule break in the CANDIDATE: stating or implying a price or discount, claiming or implying a date is available or a calendar was checked, promising something the gold answer shows Luke would not promise. Empty array if clean.

Judge only the candidate; the gold answer is the reference, not on trial.`;

type EvalResult = {
  case_id: string;
  content: number;
  voice: number;
  violations: string[];
  candidate: string;
  gold: string;
};

describe("inquiry draft quality vs decided replies", () => {
  it("replays gold cases through the current pipeline", async () => {
    const supabase = createClient(
      process.env.SUPABASE_URL ?? "",
      process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data, error } = await supabase
      .from("inquiry_approval_requests")
      .select(
        "id, final_reply, decided_at, inquiry_response_runs!inner(message_ids, proposed_reply)",
      )
      .eq("status", "sent")
      .not("final_reply", "is", null)
      .order("decided_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to load gold cases: ${error.message}`);

    const cases = z.array(goldCaseSchema).parse(data);
    if (cases.length === 0) {
      console.log("No sent approvals yet — nothing to evaluate.");
      return;
    }

    const model = process.env.AI_MODEL ?? "";
    const [brainDocs, mediaAssets] = await Promise.all([
      getActiveBrainDocs(),
      getActiveMediaAssets(),
    ]);

    const results: EvalResult[] = [];

    for (const goldCase of cases) {
      const { data: messageData, error: messageError } = await supabase
        .from("inquiry_messages")
        .select("id, body, attachments, occurred_at, sender_snapshot")
        .in("id", goldCase.inquiry_response_runs.message_ids)
        .order("occurred_at", { ascending: true });

      if (messageError || !messageData || messageData.length === 0) continue;

      const messages = z.array(messageRowSchema).parse(messageData);
      const extraction = await extractInquiryFacts(messages, model);
      const examples = await getMatchingReplyExamples(extraction.intents);
      const draft = await draftInquiryReply({
        messages,
        extraction,
        brainDocs,
        examples,
        mediaAssets,
        model,
      });

      const transcript = messages
        .map((message) => message.body ?? "[attachment]")
        .join("\n");
      const judged = await generateText({
        model,
        system: JUDGE_SYSTEM_PROMPT,
        output: Output.object({ schema: judgementSchema }),
        prompt: `Customer messages:\n${transcript}\n\nGold answer (what Luke sent):\n${goldCase.final_reply}\n\nCandidate draft:\n${draft.draft_reply}`,
      });

      results.push({
        case_id: goldCase.id.slice(0, 8),
        content: judged.output.content_match,
        voice: judged.output.voice_match,
        violations: judged.output.guardrail_violations,
        candidate: draft.draft_reply,
        gold: goldCase.final_reply,
      });
    }

    console.table(
      results.map((result) => ({
        case: result.case_id,
        content: result.content,
        voice: result.voice,
        violations: result.violations.length,
      })),
    );

    for (const result of results) {
      if (result.violations.length > 0) {
        console.error(
          `Case ${result.case_id} violations:\n- ${result.violations.join("\n- ")}\nCandidate: ${result.candidate}`,
        );
      }
      if (result.content <= 2) {
        console.warn(
          `Case ${result.case_id} content_match=${result.content}\nGold: ${result.gold}\nCandidate: ${result.candidate}`,
        );
      }
    }

    const averageContent =
      results.reduce((sum, result) => sum + result.content, 0) / results.length;
    const averageVoice =
      results.reduce((sum, result) => sum + result.voice, 0) / results.length;
    console.log(
      `Evaluated ${results.length} cases — content ${averageContent.toFixed(2)}/5, voice ${averageVoice.toFixed(2)}/5`,
    );

    // Hard gate: guardrail breaks fail the eval. Scores are informational.
    expect(
      results.flatMap((result) => result.violations),
    ).toEqual([]);
  });
});
