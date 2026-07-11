import { after } from "next/server";

import {
  getTelegramApproverIds,
  requireEnv,
} from "@/lib/inquiries/env";
import { telegramCallbackUpdateSchema } from "@/lib/inquiries/schema";
import {
  constantTimeEqual,
  parseTelegramDecision,
} from "@/lib/inquiries/security";
import {
  claimInquiryOutboxEvent,
  completeInquiryOutboxEvent,
  decideInquiryApproval,
  releaseInquiryOutboxEvent,
} from "@/lib/inquiries/supabase";
import {
  answerTelegramCallback,
  editTelegramReview,
} from "@/lib/inquiries/telegram";
import { triggerApprovedResponse } from "@/lib/inquiries/triggering";

export async function POST(request: Request): Promise<Response> {
  const suppliedSecret = request.headers.get(
    "x-telegram-bot-api-secret-token",
  );

  if (
    !constantTimeEqual(
      suppliedSecret,
      requireEnv("TELEGRAM_WEBHOOK_SECRET"),
    )
  ) {
    return Response.json({ error: "Invalid webhook secret" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = telegramCallbackUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ error: "Unsupported Telegram update" }, { status: 400 });
  }

  const query = parsed.data.callback_query;
  const configuredChatId = requireEnv("TELEGRAM_CHAT_ID");
  const approverId = String(query.from.id);
  const authorised =
    String(query.message.chat.id) === configuredChatId &&
    getTelegramApproverIds().has(approverId);

  if (!authorised) {
    await answerTelegramCallback({
      callbackQueryId: query.id,
      text: "You are not authorised to approve this reply.",
      showAlert: true,
    });
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const decision = parseTelegramDecision(query.data);
  if (!decision) {
    await answerTelegramCallback({
      callbackQueryId: query.id,
      text: "This approval action is invalid.",
      showAlert: true,
    });
    return Response.json({ error: "Invalid callback data" }, { status: 400 });
  }

  const result = await decideInquiryApproval({
    approvalId: decision.approvalId,
    decision: decision.decision,
    approverId,
    telegramUpdateId: parsed.data.update_id,
  });

  if (result.duplicate) {
    await answerTelegramCallback({
      callbackQueryId: query.id,
      text: "This decision was already handled.",
    });
    return Response.json({ received: true, duplicate: true });
  }

  if (result.status === "rejected") {
    await answerTelegramCallback({
      callbackQueryId: query.id,
      text: "Rejected. Nothing was sent.",
    });
    try {
      await editTelegramReview({
        chatId: configuredChatId,
        messageId: query.message.message_id,
        text: "❌ Rejected\n\nNothing was sent to WhatsApp.",
      });
    } catch (error) {
      console.error("Failed to update rejected Telegram review", error);
    }
    return Response.json({ received: true, status: "rejected" });
  }

  if (result.status !== "approved" || !result.outboxId) {
    await answerTelegramCallback({
      callbackQueryId: query.id,
      text: `This reply cannot be approved because it is ${result.status ?? "missing"}.`,
      showAlert: true,
    });
    return Response.json({ received: true, status: result.status });
  }

  await answerTelegramCallback({
    callbackQueryId: query.id,
    text: "Approved. Sending to WhatsApp.",
  });

  after(async () => {
    const claimed = await claimInquiryOutboxEvent(result.outboxId!);
    if (!claimed) return;

    try {
      await triggerApprovedResponse(decision.approvalId);
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

  try {
    await editTelegramReview({
      chatId: configuredChatId,
      messageId: query.message.message_id,
      text: "✅ Approved\n\nSending to WhatsApp now…",
    });
  } catch (error) {
    console.error("Failed to update approved Telegram review", error);
  }

  return Response.json({ received: true, status: "approved" });
}
