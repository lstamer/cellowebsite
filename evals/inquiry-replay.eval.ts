// Replay harness: runs real message bursts from the database back through the
// CURRENT pipeline and sends each one to LangSmith as a trace. Unlike
// inquiry-draft.eval.ts this needs no gold answers, so it works from day one —
// it is the loop to use before enough replies have been approved to score
// against.
//
//   npm run eval:replay              # newest 5 bursts
//   REPLAY_LIMIT=15 npm run eval:replay
//   REPLAY_CONVERSATION=<uuid> npm run eval:replay   # one conversation
//
// Nothing is written and nothing is sent to WhatsApp. Traces land in
// "<LANGSMITH_PROJECT>-replay" so they never mix with live enquiries.

import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";
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

const productionProject =
  process.env.LANGSMITH_PROJECT?.trim() || "stamer-inquiry-agent";
process.env.LANGSMITH_PROJECT = `${productionProject}-replay`;

const { analyseInquiryMessages } = await import("../src/lib/inquiries/ai");
const { flushInquiryTraces, isTracingEnabled } = await import(
  "../src/lib/inquiries/tracing"
);
const {
  getInquiryClientProfile,
  getInquiryConversationProviderIds,
  getInquiryMessagesByIds,
} = await import("../src/lib/inquiries/supabase");
const { getZernioConversationHistory } = await import(
  "../src/lib/inquiries/zernio"
);
type ZernioHistoryMessage = Awaited<
  ReturnType<typeof getZernioConversationHistory>
>[number];

// Thread history is off by default: it is fetched live, so it reflects the
// conversation as it stands today rather than when the original draft was
// written. Turn it on to see the full context the live task assembles.
const withHistory = process.env.REPLAY_HISTORY === "true";

const limit = Number(process.env.REPLAY_LIMIT ?? 5);
const onlyConversation = process.env.REPLAY_CONVERSATION?.trim();

const runRowSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  message_ids: z.array(z.string()),
  proposed_reply: z.string(),
  created_at: z.string(),
});

describe("inquiry replay", () => {
  it("replays real bursts through the current pipeline", async () => {
    if (!isTracingEnabled()) {
      console.warn(
        "LANGSMITH_TRACING is not 'true' — replaying without sending traces.",
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL ?? "",
      process.env.SUPABASE_SECRET_KEY ??
        process.env.SUPABASE_SERVICE_ROLE_KEY ??
        "",
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    let query = supabase
      .from("inquiry_response_runs")
      .select("id, conversation_id, message_ids, proposed_reply, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (onlyConversation) {
      query = query.eq("conversation_id", onlyConversation);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to load bursts: ${error.message}`);

    const runs = z.array(runRowSchema).parse(data);
    if (runs.length === 0) {
      console.log("No response runs to replay.");
      return;
    }

    for (const run of runs) {
      const messages = await getInquiryMessagesByIds(run.message_ids);
      if (messages.length === 0) continue;

      const profile = await getInquiryClientProfile(run.conversation_id).catch(
        () => null,
      );

      let history: ZernioHistoryMessage[] = [];
      if (withHistory) {
        try {
          const providerIds = await getInquiryConversationProviderIds(
            run.conversation_id,
          );
          history = await getZernioConversationHistory({
            conversationId: providerIds.providerConversationId,
            accountId: providerIds.providerAccountId,
            limit: 30,
          });
        } catch (historyError) {
          console.warn(
            `History unavailable for ${run.conversation_id.slice(0, 8)}:`,
            historyError instanceof Error
              ? historyError.message
              : historyError,
          );
        }
      }

      const { analysis } = await analyseInquiryMessages(messages, {
        history,
        profile,
        conversationId: run.conversation_id,
      });

      console.log(
        [
          `\n──────── run ${run.id.slice(0, 8)} (${run.created_at.slice(0, 10)})`,
          `CUSTOMER: ${messages.map((m) => m.body ?? "[attachment]").join(" | ")}`,
          `THEN:     ${run.proposed_reply}`,
          `NOW:      ${analysis.draft_reply}`,
          `intents:  ${analysis.intents.join(", ")} | temp: ${analysis.lead_temperature} | media: ${analysis.proposed_media_slugs.join(", ") || "none"}`,
        ].join("\n"),
      );

      expect(analysis.draft_reply.length).toBeGreaterThan(0);
    }

    await flushInquiryTraces();
    console.log(
      `\nReplayed ${runs.length} bursts. Traces: LangSmith project "${process.env.LANGSMITH_PROJECT}".`,
    );
  });
});
