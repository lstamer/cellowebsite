import { after } from "next/server";

import {
  getTelegramApproverIds,
  requireEnv,
} from "@/lib/inquiries/env";
import {
  telegramCallbackUpdateSchema,
  telegramMessageUpdateSchema,
  type TelegramMessageUpdate,
} from "@/lib/inquiries/schema";
import {
  constantTimeEqual,
  parseTelegramDecision,
} from "@/lib/inquiries/security";
import {
  claimInquiryOutboxEvent,
  completeInquiryOutboxEvent,
  decideInquiryApproval,
  recordInquiryOverride,
  releaseInquiryOutboxEvent,
} from "@/lib/inquiries/supabase";
import {
  answerTelegramCallback,
  editTelegramReview,
  sendTelegramMessage,
} from "@/lib/inquiries/telegram";
import { triggerApprovedResponse } from "@/lib/inquiries/triggering";

// Reply-to-card overrides: Luke answers a review card with the text that
// should be sent. The override is delivered through the same guarded send
// machinery as an approval and stored as a teaching example.
async function handleMessageUpdate(
  update: TelegramMessageUpdate,
): Promise<Response> {
  const message = update.message;
  const configuredChatId = requireEnv("TELEGRAM_CHAT_ID");
  const approverId = String(message.from.id);
  const authorised =
    String(message.chat.id) === configuredChatId &&
    getTelegramApproverIds().has(approverId);
  const overrideText = message.text?.trim() ?? "";

  // Group chatter, non-approvers, reactions to nothing: acknowledge so
  // Telegram does not retry, act on none of it.
  if (!authorised || !message.reply_to_message || overrideText === "") {
    return Response.json({ received: true, ignored: true });
  }

  const result = await recordInquiryOverride({
    telegramChatId: message.chat.id,
    replyToMessageId: message.reply_to_message.message_id,
    overrideText,
    approverId,
    telegramUpdateId: update.update_id,
  });

  if (result.duplicate) {
    return Response.json({ received: true, duplicate: true });
  }

  if (!result.applied) {
    // Replies to non-card messages are ordinary conversation — stay silent.
    if (result.status !== "not_found") {
      try {
        await sendTelegramMessage({
          chatId: message.chat.id,
          replyToMessageId: message.message_id,
          text: `I can't send this override — the draft is already ${result.status ?? "gone"}. If the enquiry still needs a reply, send it manually from WhatsApp.`,
        });
      } catch (error) {
        console.error("Failed to report unusable override", error);
      }
    }
    return Response.json({ received: true, status: result.status });
  }

  after(async () => {
    const claimed = await claimInquiryOutboxEvent(result.outboxId!);
    if (!claimed) return;

    try {
      await triggerApprovedResponse(result.approvalId!);
      await completeInquiryOutboxEvent(claimed.id, claimed.claimToken);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown trigger error";
      await releaseInquiryOutboxEvent(
        claimed.id,
        claimed.claimToken,
        errorMessage,
      );
    }
  });

  try {
    await editTelegramReview({
      chatId: message.chat.id,
      messageId: message.reply_to_message.message_id,
      text: `✍️ Override received\n\nSending Luke's version now — saved as a teaching example:\n\n${overrideText}`,
    });
  } catch (error) {
    console.error("Failed to update overridden Telegram review", error);
  }

  return Response.json({ received: true, status: "override_approved" });
}

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
    const messageUpdate = telegramMessageUpdateSchema.safeParse(payload);
    if (messageUpdate.success) {
      return handleMessageUpdate(messageUpdate.data);
    }
    // Must be 200: Telegram retries non-2xx responses indefinitely, and with
    // "message" in allowed_updates the group produces updates we don't act on.
    return Response.json({ received: true, ignored: true });
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
        text: "❌ Rejected\n\nNothing was sent to WhatsApp.\n\nReply to this message with what I should have said and I'll send your version instead — and learn from it.",
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
