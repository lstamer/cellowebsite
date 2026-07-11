import { logger, schedules, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import {
  analyseInquiryMessages,
  createInquiryBatchKey,
} from "@/lib/inquiries/ai";
import { evaluateInquiryPolicy } from "@/lib/inquiries/policy";
import {
  approvedResponseTaskPayloadSchema,
  inquiryAnalysisSchema,
  inquiryTaskPayloadSchema,
  reviewNotificationTaskPayloadSchema,
} from "@/lib/inquiries/schema";
import {
  claimInquiryOutboxEvent,
  claimInquiryApprovalSend,
  claimInquiryReviewNotification,
  claimPendingInquiryOutboxEvents,
  completeInquiryApprovalSend,
  completeInquiryOutboxEvent,
  completeInquiryReviewNotification,
  failInquiryApprovalSend,
  failInquiryReviewNotification,
  getInquiryMessagesByIds,
  getUnprocessedInquiryMessages,
  hasUnprocessedInquiryMessages,
  recordInquiryAnalysis,
  reconcileStaleInquiryWork,
  releaseInquiryOutboxEvent,
} from "@/lib/inquiries/supabase";
import {
  editTelegramReview,
  sendTelegramReview,
  TelegramApiError,
} from "@/lib/inquiries/telegram";
import {
  sendZernioTextMessage,
  ZernioSendError,
} from "@/lib/inquiries/zernio";

export const notifyInquiryReview = schemaTask({
  id: "notify-inquiry-review",
  schema: reviewNotificationTaskPayloadSchema,
  queue: { name: "inquiry-reviews", concurrencyLimit: 1 },
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1_000,
    maxTimeoutInMs: 15_000,
    randomize: true,
  },
  run: async ({ approvalId }) => {
    const claimed = await claimInquiryReviewNotification(approvalId);

    if (!claimed.claimed) {
      logger.info("Telegram review was already claimed", {
        approvalId,
        status: claimed.status,
      });
      return { status: claimed.status ?? "not_found" };
    }

    const analysis = inquiryAnalysisSchema.parse(claimed.analysis);
    const messages = await getInquiryMessagesByIds(claimed.messageIds);

    try {
      const review = await sendTelegramReview({
        approvalId,
        analysis,
        messages,
      });
      await completeInquiryReviewNotification({
        approvalId,
        chatId: review.chatId,
        messageId: review.messageId,
      });

      return { status: "sent" as const, messageId: review.messageId };
    } catch (error) {
      const uncertain =
        error instanceof TelegramApiError ? error.uncertain : true;
      const message = error instanceof Error ? error.message : "Unknown Telegram error";
      await failInquiryReviewNotification({
        approvalId,
        errorMessage: message,
        uncertain,
      });

      if (!uncertain) throw error;

      logger.error("Telegram review delivery is uncertain", {
        approvalId,
        message,
      });
      return { status: "uncertain" as const };
    }
  },
});

export const processInquiryConversation = schemaTask({
  id: "process-inquiry-conversation",
  schema: inquiryTaskPayloadSchema,
  queue: { name: "inquiry-conversations", concurrencyLimit: 1 },
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1_000,
    maxTimeoutInMs: 15_000,
    randomize: true,
  },
  run: async ({ conversationId }) => {
    const messages = await getUnprocessedInquiryMessages(conversationId);

    if (messages.length === 0) {
      logger.info("No unprocessed messages remain", { conversationId });
      return { status: "no_messages" as const };
    }

    const { analysis, model } = await analyseInquiryMessages(messages);
    const policy = evaluateInquiryPolicy(analysis);
    const batchKey = createInquiryBatchKey(
      conversationId,
      messages.map((message) => message.id),
    );
    const recorded = await recordInquiryAnalysis({
      conversationId,
      batchKey,
      messageIds: messages.map((message) => message.id),
      model,
      analysis,
      policyDecision: policy.decision,
      policyReasons: policy.reasons,
    });

    if (recorded.telegramMessageId) {
      logger.info("Telegram review already exists", {
        conversationId,
        approvalId: recorded.approvalId,
      });
      return { status: "already_notified" as const };
    }

    const reviewOutbox = await claimInquiryOutboxEvent(recorded.reviewOutboxId);
    if (reviewOutbox) {
      try {
        await notifyInquiryReview.trigger(
          { approvalId: recorded.approvalId },
          { concurrencyKey: recorded.approvalId },
        );
        await completeInquiryOutboxEvent(
          reviewOutbox.id,
          reviewOutbox.claimToken,
        );
      } catch (error) {
        await releaseInquiryOutboxEvent(
          reviewOutbox.id,
          reviewOutbox.claimToken,
          error instanceof Error ? error.message : "Unknown review trigger error",
        );
      }
    }

    if (await hasUnprocessedInquiryMessages(conversationId)) {
      await processInquiryConversation.trigger(
        { conversationId },
        { delay: "1s", concurrencyKey: conversationId },
      );
    }

    return {
      status: "awaiting_human" as const,
      approvalId: recorded.approvalId,
    };
  },
});

export const sendApprovedInquiryResponse = schemaTask({
  id: "send-approved-inquiry-response",
  schema: approvedResponseTaskPayloadSchema,
  queue: { name: "inquiry-sends", concurrencyLimit: 1 },
  retry: { maxAttempts: 1 },
  run: async ({ approvalId }) => {
    const claimed = await claimInquiryApprovalSend(approvalId);

    if (!claimed.claimed) {
      logger.info("Approved response was already claimed", {
        approvalId,
        status: claimed.status,
      });

      if (
        (claimed.status === "window_expired" ||
          claimed.status === "superseded") &&
        claimed.telegramChatId &&
        claimed.telegramMessageId
      ) {
        try {
          await editTelegramReview({
            chatId: claimed.telegramChatId,
            messageId: claimed.telegramMessageId,
            text:
              claimed.status === "window_expired"
                ? "⏰ WhatsApp window expired\n\nNothing was sent. The customer's 24-hour service window has closed, so an approved message template is required."
                : "↩️ Draft superseded\n\nNothing was sent. A newer customer message or response proposal replaced this draft.",
          });
        } catch (telegramError) {
          logger.error("Failed to report expired WhatsApp window", {
            approvalId,
            message:
              telegramError instanceof Error
                ? telegramError.message
                : "Unknown Telegram error",
          });
        }
      }

      return { status: claimed.status ?? "not_found" };
    }

    try {
      const sent = await sendZernioTextMessage({
        conversationId: claimed.providerConversationId,
        accountId: claimed.providerAccountId,
        message: claimed.reply,
      });
      await completeInquiryApprovalSend(approvalId, sent.messageId);

      if (claimed.telegramChatId && claimed.telegramMessageId) {
        try {
          await editTelegramReview({
            chatId: claimed.telegramChatId,
            messageId: claimed.telegramMessageId,
            text: `✅ Sent on WhatsApp\n\n${claimed.reply}`,
          });
        } catch (telegramError) {
          logger.error("WhatsApp reply sent but Telegram card update failed", {
            approvalId,
            message:
              telegramError instanceof Error
                ? telegramError.message
                : "Unknown Telegram error",
          });
        }
      }

      return { status: "sent" as const, messageId: sent.messageId };
    } catch (error) {
      const uncertain =
        error instanceof ZernioSendError ? error.uncertain : true;
      const message = error instanceof Error ? error.message : "Unknown send error";
      await failInquiryApprovalSend({
        approvalId,
        errorMessage: message,
        uncertain,
      });

      if (claimed.telegramChatId && claimed.telegramMessageId) {
        try {
          await editTelegramReview({
            chatId: claimed.telegramChatId,
            messageId: claimed.telegramMessageId,
            text: `${uncertain ? "⚠️ Send status uncertain" : "❌ WhatsApp send failed"}\n\nNothing will be retried automatically. Check Zernio before sending manually.\n\n${message}`,
          });
        } catch (telegramError) {
          logger.error("Failed to update Telegram with send failure", {
            approvalId,
            message:
              telegramError instanceof Error
                ? telegramError.message
                : "Unknown Telegram error",
          });
        }
      }

      return { status: uncertain ? "send_uncertain" : "failed" };
    }
  },
});

const outboxPayloadSchema = z.object({
  conversationId: z.string().uuid().optional(),
  approvalId: z.string().uuid().optional(),
});

export const dispatchInquiryOutbox = schedules.task({
  id: "dispatch-inquiry-outbox",
  cron: "* * * * *",
  retry: { maxAttempts: 3 },
  run: async () => {
    const stale = await reconcileStaleInquiryWork();
    for (const staleSend of stale.staleSends) {
      if (staleSend.telegramChatId && staleSend.telegramMessageId) {
        try {
          await editTelegramReview({
            chatId: staleSend.telegramChatId,
            messageId: staleSend.telegramMessageId,
            text: "⚠️ Send status uncertain\n\nThe worker stopped after claiming this send. Check Zernio and WhatsApp before sending anything manually.",
          });
        } catch (error) {
          logger.error("Failed to report stale send in Telegram", {
            approvalId: staleSend.approvalId,
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    const events = await claimPendingInquiryOutboxEvents();
    let dispatched = 0;

    for (const event of events) {
      try {
        const payload = outboxPayloadSchema.parse(event.payload);

        if (event.eventType === "inquiry.message_received") {
          const conversationId = payload.conversationId ?? event.aggregateId;
          await processInquiryConversation.trigger(
            { conversationId },
            {
              debounce: {
                key: conversationId,
                delay: "15s",
                maxDelay: "60s",
                mode: "trailing",
              },
              concurrencyKey: conversationId,
            },
          );
        } else if (event.eventType === "inquiry.review_requested") {
          const approvalId = payload.approvalId ?? event.aggregateId;
          await notifyInquiryReview.trigger(
            { approvalId },
            { concurrencyKey: approvalId },
          );
        } else {
          const approvalId = payload.approvalId ?? event.aggregateId;
          await sendApprovedInquiryResponse.trigger(
            { approvalId },
            {
              concurrencyKey: approvalId,
              maxAttempts: 1,
            },
          );
        }

        await completeInquiryOutboxEvent(event.id, event.claimToken);
        dispatched += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown outbox error";
        await releaseInquiryOutboxEvent(event.id, event.claimToken, message);
        logger.error("Inquiry outbox dispatch failed", {
          outboxId: event.id,
          message,
        });
      }
    }

    return {
      found: events.length,
      dispatched,
      staleSends: stale.staleSends.length,
      staleReviews: stale.staleReviews,
      staleOutbox: stale.staleOutbox,
    };
  },
});
