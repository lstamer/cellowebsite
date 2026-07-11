import { createHash } from "node:crypto";

import { generateText, Output } from "ai";

import { requireEnv } from "@/lib/inquiries/env";
import {
  inquiryAnalysisSchema,
  type InquiryAnalysis,
  type InquiryMessageRow,
} from "@/lib/inquiries/schema";

const SYSTEM_PROMPT = `You analyse initial WhatsApp enquiries for Luke Stamer, a Cape Town cellist, and draft a proposed first reply for human approval.

Extraction rules:
- Use only facts explicitly present in the messages. Unknown values must be null or omitted from arrays.
- A message may have several intents. Availability and pricing often occur together.
- Mark Cavendish or a referral as the source only when the sender explicitly says so.
- Never infer that a date is available or infer a price from historical-looking wording.
- event_date_iso may be populated only when the date resolves unambiguously. The current date and timezone are supplied below.
- Confidence measures the extraction, not the quality of the lead.

Drafting rules:
- Write as Luke in first-person singular, speaking warmly to one person.
- Use plain, natural South African/British English. No corporate language, hard sell, fake urgency, or generic AI phrasing.
- Acknowledge the concrete details they supplied so the sender feels seen.
- Never say a date is available, quote a price, promise a discount, or imply a calendar was checked.
- If availability or pricing was asked about, say Luke will check or confirm it properly.
- Ask at most three essential missing questions. Prioritise event date, event type, and location.
- If the enquiry is already detailed, do not make them repeat information or force them through a form.
- Keep the first reply between 40 and 120 words. Do not use an emoji by default.
- This is a proposal only. A human will approve or reject it before it is sent.`;

function renderTranscript(messages: InquiryMessageRow[]): string {
  return messages
    .map((message) => {
      const attachments = message.attachments
        .map((attachment) => `[${attachment.type ?? "attachment"}]`)
        .join(" ");
      const content = [message.body?.trim(), attachments]
        .filter(Boolean)
        .join(" ");

      return `${message.occurred_at}: ${content || "[empty message]"}`;
    })
    .join("\n");
}

export function createInquiryBatchKey(
  conversationId: string,
  messageIds: string[],
): string {
  return createHash("sha256")
    .update(`${conversationId}:${[...messageIds].sort().join(":")}`)
    .digest("hex");
}

export async function analyseInquiryMessages(
  messages: InquiryMessageRow[],
): Promise<{ analysis: InquiryAnalysis; model: string }> {
  requireEnv("AI_GATEWAY_API_KEY");
  const model = requireEnv("AI_MODEL");
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const result = await generateText({
    model,
    system: SYSTEM_PROMPT,
    output: Output.object({ schema: inquiryAnalysisSchema }),
    prompt: `Current date: ${date}\nTimezone: Africa/Johannesburg\n\nUnprocessed message burst:\n${renderTranscript(messages)}`,
  });

  return { analysis: result.output, model };
}
