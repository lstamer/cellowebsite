import { after } from "next/server";

import { requireEnv } from "@/lib/inquiries/env";
import { zernioMessageReceivedSchema } from "@/lib/inquiries/schema";
import { verifyHmacSignature } from "@/lib/inquiries/security";
import {
  claimInquiryOutboxEvent,
  completeInquiryOutboxEvent,
  ingestZernioMessage,
  releaseInquiryOutboxEvent,
} from "@/lib/inquiries/supabase";
import { triggerInquiryProcessing } from "@/lib/inquiries/triggering";

export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();
  const signature =
    request.headers.get("x-zernio-signature") ??
    request.headers.get("x-late-signature");

  if (
    !verifyHmacSignature(
      rawBody,
      signature,
      requireEnv("ZERNIO_WEBHOOK_SECRET"),
    )
  ) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "event" in payload &&
    payload.event !== "message.received"
  ) {
    return Response.json({ received: true, ignored: true });
  }

  const parsed = zernioMessageReceivedSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "Unsupported message.received payload" },
      { status: 400 },
    );
  }

  const ingested = await ingestZernioMessage(parsed.data);

  if (!ingested.duplicate && ingested.outboxId) {
    after(async () => {
      const claimed = await claimInquiryOutboxEvent(ingested.outboxId!);
      if (!claimed) return;

      try {
        await triggerInquiryProcessing(ingested.conversationId);
        await completeInquiryOutboxEvent(claimed.id, claimed.claimToken);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown trigger error";
        await releaseInquiryOutboxEvent(
          claimed.id,
          claimed.claimToken,
          message,
        );
      }
    });
  }

  return Response.json(
    {
      received: true,
      duplicate: ingested.duplicate,
      conversationId: ingested.conversationId,
    },
    { status: 202 },
  );
}
