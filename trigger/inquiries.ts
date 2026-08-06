import { logger, schedules, schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

import {
  createInquiryBatchKey,
  draftWebsiteLeadReply as generateWebsiteLeadDraft,
  redraftInquiryReply,
  redraftWebsiteLeadReply,
  renderClientProfile,
  renderConversationHistory,
  runInquiryAnalysis,
} from "@/lib/inquiries/ai";
import { evaluateInquiryPolicy } from "@/lib/inquiries/policy";
import {
  approvedResponseTaskPayloadSchema,
  availabilityQuestionTaskPayloadSchema,
  inquiryAnalysisSchema,
  inquiryTaskPayloadSchema,
  reviewNotificationTaskPayloadSchema,
  splitReplyBubbles,
  websiteLeadTaskPayloadSchema,
  type AvailabilityFact,
  type InquiryMessageRow,
  type MediaAssetRow,
} from "@/lib/inquiries/schema";
import {
  attachSuggestChangeCard,
  bindSuggestChangeInstructions,
  claimInquiryAvailabilityQuestion,
  claimInquiryOutboxEvent,
  claimInquiryApprovalSend,
  claimInquiryReviewNotification,
  claimPendingInquiryOutboxEvents,
  claimWebsiteLeadDraft,
  claimWebsiteLeadReviewNotification,
  clearRetiredSuggestChangeCard,
  completeInquiryApprovalSend,
  completeInquiryAvailabilityQuestion,
  completeInquiryOutboxEvent,
  completeInquiryReviewNotification,
  completeSuggestChangeRequest,
  completeWebsiteLeadReviewNotification,
  ensureInquiryAvailabilityCheck,
  getOpenSuggestChangeRequest,
  failInquiryApprovalSend,
  failInquiryAvailabilityQuestion,
  failInquiryReviewNotification,
  failWebsiteLeadReviewNotification,
  getAnsweredAvailabilityFact,
  getInquiryClientProfile,
  getInquiryConversationProviderIds,
  getInquiryMessagesByIds,
  getMediaAssetsBySlugs,
  getSuggestChangeTargetContext,
  getUnprocessedInquiryMessages,
  mergeInquiryClientProfile,
  type ClientProfile,
  hasUnprocessedInquiryMessages,
  recordInquiryAnalysis,
  recordRetiredSuggestChangeCard,
  recordSuggestChangeInstructions,
  recordWebsiteLeadDraft,
  reconcileStaleInquiryWork,
  releaseInquiryOutboxEvent,
  releaseWebsiteLeadDraft,
  reopenSuggestChangeRequest,
  supersedePendingAvailabilityChecks,
  type OpenSuggestChangeRequest,
  type SuggestChangeInstructionHistory,
  type SuggestChangeTargetContext,
  type SuggestChangeTargetKind,
} from "@/lib/inquiries/supabase";
import {
  editTelegramReplyMarkup,
  editTelegramReview,
  sendTelegramAvailabilityQuestion,
  sendTelegramMessage,
  sendTelegramRedraftReview,
  sendTelegramReview,
  sendTelegramWebsiteLeadReview,
  TelegramApiError,
} from "@/lib/inquiries/telegram";
import {
  transcribeTelegramVoice,
  VoiceTranscriptionError,
} from "@/lib/inquiries/voice";
import {
  getZernioConversationHistory,
  sendZernioMediaMessage,
  sendZernioTextMessage,
  ZernioSendError,
  type ZernioHistoryMessage,
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
    const mediaAssets = await getMediaAssetsBySlugs(
      analysis.proposed_media_slugs,
    );

    try {
      const review = await sendTelegramReview({
        approvalId,
        analysis,
        messages,
        mediaAssets,
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

// Posts the "Are you available on {date}?" question card. Same claim/fail
// taxonomy as the review notification: definite Telegram failures rethrow for
// retry, ambiguous ones park as uncertain.
export const notifyAvailabilityCheck = schemaTask({
  id: "notify-availability-check",
  schema: availabilityQuestionTaskPayloadSchema,
  queue: { name: "inquiry-reviews", concurrencyLimit: 1 },
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1_000,
    maxTimeoutInMs: 15_000,
    randomize: true,
  },
  run: async ({ checkId }) => {
    const claimed = await claimInquiryAvailabilityQuestion(checkId);

    if (!claimed.claimed) {
      logger.info("Availability question was already claimed", {
        checkId,
        status: claimed.status,
      });
      return { status: claimed.status ?? "not_found" };
    }

    try {
      const question = await sendTelegramAvailabilityQuestion({
        checkId,
        contactName: claimed.contactName,
        eventDateText: claimed.eventDateText,
        eventContext: claimed.eventContext,
        serviceWindowExpiresAt: claimed.serviceWindowExpiresAt,
      });
      await completeInquiryAvailabilityQuestion({
        checkId,
        chatId: question.chatId,
        messageId: question.messageId,
      });

      return { status: "sent" as const, messageId: question.messageId };
    } catch (error) {
      const uncertain =
        error instanceof TelegramApiError ? error.uncertain : true;
      const message =
        error instanceof Error ? error.message : "Unknown Telegram error";
      await failInquiryAvailabilityQuestion({
        checkId,
        errorMessage: message,
        uncertain,
      });

      if (!uncertain) throw error;

      logger.error("Availability question delivery is uncertain", {
        checkId,
        message,
      });
      return { status: "uncertain" as const };
    }
  },
});

// Website lead: Available/Unavailable was tapped, so draft Luke's first
// outbound message and post the review card. Every step is a CAS claim, so a
// recovery re-run resumes at whichever step is unfinished (e.g. draft stored
// but card never sent).
export const draftWebsiteLeadReplyTask = schemaTask({
  id: "draft-website-lead-reply",
  schema: websiteLeadTaskPayloadSchema,
  queue: { name: "website-leads", concurrencyLimit: 1 },
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1_000,
    maxTimeoutInMs: 15_000,
    randomize: true,
  },
  run: async ({ leadId }) => {
    const claimed = await claimWebsiteLeadDraft(leadId);

    if (claimed.claimed) {
      try {
        const generated = await generateWebsiteLeadDraft(claimed);
        const recorded = await recordWebsiteLeadDraft({
          leadId,
          model: generated.model,
          draft: generated.draft,
        });

        if (!recorded.recorded) {
          logger.info("Website lead draft was recorded elsewhere", {
            leadId,
            status: recorded.status,
          });
        }
      } catch (draftError) {
        // Drop the 5-minute drafting lease so this task's own quick retries
        // can re-claim; otherwise every retry would no-op against the lease
        // and the lead would wait for the reconcile cron instead.
        try {
          await releaseWebsiteLeadDraft(leadId);
        } catch (releaseError) {
          logger.warn("Failed to release website lead draft lease", {
            leadId,
            message:
              releaseError instanceof Error
                ? releaseError.message
                : "Unknown release error",
          });
        }
        throw draftError;
      }
    } else if (claimed.status !== "draft_ready") {
      // Not drafting and no stored draft awaiting a card: decided, expired,
      // or another worker holds a fresh lease.
      logger.info("Website lead draft not claimable", {
        leadId,
        status: claimed.status,
      });
      return { status: claimed.status ?? "not_found" };
    }

    const review = await claimWebsiteLeadReviewNotification(leadId);

    if (!review.claimed) {
      logger.info("Website lead review was already claimed", {
        leadId,
        status: review.status,
      });
      return { status: review.status ?? "not_found" };
    }

    try {
      const sent = await sendTelegramWebsiteLeadReview({
        leadId,
        lead: review,
        draft: review.draftReply,
      });
      await completeWebsiteLeadReviewNotification({
        leadId,
        chatId: sent.chatId,
        messageId: sent.messageId,
      });

      return { status: "sent" as const, messageId: sent.messageId };
    } catch (error) {
      const uncertain =
        error instanceof TelegramApiError ? error.uncertain : true;
      const message =
        error instanceof Error ? error.message : "Unknown Telegram error";
      await failWebsiteLeadReviewNotification({
        leadId,
        errorMessage: message,
        uncertain,
      });

      if (!uncertain) throw error;

      logger.error("Website lead review delivery is uncertain", {
        leadId,
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

    // The FULL thread (both directions, incl. Luke's manual replies) gives the
    // drafter context for ongoing relationships; no limit is passed so it
    // walks every page up to the client's ceiling, and the prompt's own
    // character budget decides how much of it is shown. Best-effort: a failed
    // fetch (e.g. synthetic smoke conversations) drafts without it.
    let history: ZernioHistoryMessage[] = [];
    try {
      const providerIds =
        await getInquiryConversationProviderIds(conversationId);
      history = await getZernioConversationHistory({
        conversationId: providerIds.providerConversationId,
        accountId: providerIds.providerAccountId,
      });
    } catch (historyError) {
      logger.warn("Conversation history unavailable; drafting without it", {
        conversationId,
        message:
          historyError instanceof Error
            ? historyError.message
            : "Unknown history error",
      });
    }

    let profile: ClientProfile | null = null;
    try {
      profile = await getInquiryClientProfile(conversationId);
    } catch (profileError) {
      logger.warn("Client profile unavailable; drafting without it", {
        conversationId,
        message:
          profileError instanceof Error
            ? profileError.message
            : "Unknown profile error",
      });
    }

    const messageIds = messages.map((message) => message.id);
    const batchKey = createInquiryBatchKey(conversationId, messageIds);

    // Filled by the gate when a question needs to go out; the Telegram edits
    // and outbox dispatch happen after the analysis returns so the traced AI
    // span stays free of orchestration side effects. (Object holder because
    // TypeScript cannot see closure assignments to a plain local.)
    const gateState: {
      pendingQuestion: {
        checkId: string;
        outboxId: string | null;
        supersededCards: Array<{
          checkId: string;
          telegramChatId: string | null;
          telegramMessageId: number | null;
        }>;
      } | null;
    } = { pendingQuestion: null };

    const outcome = await runInquiryAnalysis(messages, {
      history,
      profile,
      conversationId,
      // Availability gate: when the burst asks about availability, pause
      // before drafting and ask Luke on Telegram. His answer resumes this
      // task (via the availability_answered outbox) and the answered check
      // turns into a human-confirmed fact the draft may state.
      availabilityGate: async (extraction, context) => {
        // Deterministic resume first: the batch key is a pure function of the
        // message set, so if Luke answered THIS burst's question his answer
        // applies even when the re-run's extraction re-words the date or
        // drops the availability intent entirely.
        const answered = await getAnsweredAvailabilityFact(
          conversationId,
          batchKey,
        );
        if (answered) {
          return { action: "continue", availabilityFact: answered };
        }

        if (!extraction.intents.includes("availability")) {
          return { action: "continue" };
        }

        const check = await ensureInquiryAvailabilityCheck({
          conversationId,
          batchKey,
          messageIds,
          extraction,
          model: context.model,
          eventDateText: extraction.event.event_date_text,
          eventDateIso: extraction.event.event_date_iso,
          eventContext: extraction.summary,
        });

        if (check.mode === "fact") {
          return {
            action: "continue",
            availabilityFact: {
              availability: check.availability,
              dateText:
                check.eventDateText ?? extraction.event.event_date_text,
            },
          };
        }

        gateState.pendingQuestion = check.duplicate
          ? { checkId: check.checkId, outboxId: check.outboxId, supersededCards: [] }
          : check;
        return { action: "pause" };
      },
    });

    if (outcome.paused) {
      const pendingQuestion = gateState.pendingQuestion;
      if (pendingQuestion) {
        // A newer burst replaced any older unanswered questions; close their
        // cards so only one question is actionable.
        for (const card of pendingQuestion.supersededCards) {
          if (!card.telegramChatId || !card.telegramMessageId) continue;
          try {
            await editTelegramReview({
              chatId: card.telegramChatId,
              messageId: card.telegramMessageId,
              text: "↩️ Replaced by a newer availability question\n\nAnswer the latest card instead.",
            });
          } catch (editError) {
            logger.warn("Failed to close superseded availability card", {
              conversationId,
              checkId: card.checkId,
              message:
                editError instanceof Error
                  ? editError.message
                  : "Unknown Telegram error",
            });
          }
        }

        if (pendingQuestion.outboxId) {
          const questionOutbox = await claimInquiryOutboxEvent(
            pendingQuestion.outboxId,
          );
          if (questionOutbox) {
            try {
              await notifyAvailabilityCheck.trigger(
                { checkId: pendingQuestion.checkId },
                { concurrencyKey: pendingQuestion.checkId },
              );
              await completeInquiryOutboxEvent(
                questionOutbox.id,
                questionOutbox.claimToken,
              );
            } catch (triggerError) {
              await releaseInquiryOutboxEvent(
                questionOutbox.id,
                questionOutbox.claimToken,
                triggerError instanceof Error
                  ? triggerError.message
                  : "Unknown availability question trigger error",
              );
            }
          }
        }
      }

      // The burst deliberately stays unprocessed: Luke's answer (or the next
      // inbound message) re-triggers this task and the batch re-forms.
      logger.info("Awaiting availability answer before drafting", {
        conversationId,
        batchKey,
      });
      return { status: "awaiting_availability" as const };
    }

    const { analysis, model } = outcome;
    const policy = evaluateInquiryPolicy(analysis);
    const recorded = await recordInquiryAnalysis({
      conversationId,
      batchKey,
      messageIds: messages.map((message) => message.id),
      model,
      analysis,
      policyDecision: policy.decision,
      policyReasons: policy.reasons,
    });

    // Fold newly extracted facts into the durable per-contact profile.
    // Best-effort: profile drift must never block the review notification.
    try {
      await mergeInquiryClientProfile(conversationId, analysis);
    } catch (mergeError) {
      logger.warn("Client profile merge failed", {
        conversationId,
        message:
          mergeError instanceof Error
            ? mergeError.message
            : "Unknown merge error",
      });
    }

    // A completed analysis outdates any unanswered availability question for
    // this conversation (e.g. the burst re-classified without the availability
    // intent). Best-effort: an orphaned card is cosmetic, not stateful.
    try {
      const supersededChecks =
        await supersedePendingAvailabilityChecks(conversationId);
      for (const card of supersededChecks) {
        if (!card.telegramChatId || !card.telegramMessageId) continue;
        await editTelegramReview({
          chatId: card.telegramChatId,
          messageId: card.telegramMessageId,
          text: "↩️ No longer needed\n\nThe conversation moved on before this availability question was answered.",
        });
      }
    } catch (supersedeError) {
      logger.warn("Failed to supersede stale availability questions", {
        conversationId,
        message:
          supersedeError instanceof Error
            ? supersedeError.message
            : "Unknown supersede error",
      });
    }

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
      // Messages that arrived mid-analysis join the same 2-minute quiet-period
      // debounce instead of being analysed immediately — the customer may
      // still be mid-burst.
      await processInquiryConversation.trigger(
        { conversationId },
        {
          debounce: {
            key: conversationId,
            delay: "2m",
            mode: "trailing",
          },
          concurrencyKey: conversationId,
        },
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

    const bubbles = splitReplyBubbles(claimed.reply);

    try {
      const sent = await sendZernioTextMessage({
        conversationId: claimed.providerConversationId,
        accountId: claimed.providerAccountId,
        message: bubbles[0] ?? claimed.reply,
      });
      // The approval completes on the first bubble: later bubbles and media
      // are best-effort extras and must never resurrect the send state
      // machine (no ambiguous retries once anything has reached WhatsApp).
      await completeInquiryApprovalSend(approvalId, sent.messageId);

      const failedBubbles: number[] = [];
      for (let index = 1; index < bubbles.length; index++) {
        await new Promise((resolve) => setTimeout(resolve, 2_500));
        try {
          await sendZernioTextMessage({
            conversationId: claimed.providerConversationId,
            accountId: claimed.providerAccountId,
            message: bubbles[index],
          });
        } catch (bubbleError) {
          failedBubbles.push(index + 1);
          logger.error("Follow-up bubble send failed", {
            approvalId,
            bubble: index + 1,
            message:
              bubbleError instanceof Error
                ? bubbleError.message
                : "Unknown bubble send error",
          });
        }
      }

      const sentMedia: string[] = [];
      const failedMedia: string[] = [];
      if (claimed.proposedMediaSlugs.length > 0) {
        const assets = await getMediaAssetsBySlugs(claimed.proposedMediaSlugs);
        for (const asset of assets) {
          try {
            await sendZernioMediaMessage({
              conversationId: claimed.providerConversationId,
              accountId: claimed.providerAccountId,
              mediaType: asset.media_type,
              url: asset.url,
              fileName: asset.title,
            });
            sentMedia.push(asset.title);
          } catch (mediaError) {
            failedMedia.push(asset.title);
            logger.error("Media attachment send failed", {
              approvalId,
              asset: asset.slug,
              message:
                mediaError instanceof Error
                  ? mediaError.message
                  : "Unknown media send error",
            });
          }
        }
      }

      if (claimed.telegramChatId && claimed.telegramMessageId) {
        const mediaLines = [
          failedBubbles.length > 0
            ? `⚠️ Bubble ${failedBubbles.join(", ")} failed to send (earlier bubbles were delivered)`
            : "",
          sentMedia.length > 0 ? `📎 Attached: ${sentMedia.join(", ")}` : "",
          failedMedia.length > 0
            ? `⚠️ Attachments failed (text was delivered): ${failedMedia.join(", ")}`
            : "",
        ]
          .filter(Boolean)
          .join("\n");
        try {
          await editTelegramReview({
            chatId: claimed.telegramChatId,
            messageId: claimed.telegramMessageId,
            text: `✅ Sent on WhatsApp\n\n${claimed.reply}${mediaLines ? `\n\n${mediaLines}` : ""}`,
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

// The redraft payload lives here rather than beside its siblings in
// schema.ts because it is the only task payload that is not addressed by a
// domain id: instructions arrive as a bare Telegram message, so the chat is
// what identifies the request they belong to.
export const suggestChangeTaskPayloadSchema = z
  .object({
    // The request these instructions were recorded against. AUTHORITATIVE:
    // supplied, it is the only request that can be bound, and a request that
    // has since been superseded stops the run. It used to be advisory, with
    // "newest open request in the chat" winning at run time — which is how a
    // voicenote about customer A ends up rewriting customer B's draft when
    // Luke taps ✏️ twice while Whisper is still running. Optional only for a
    // caller that genuinely has no request id to assert.
    requestId: z.string().uuid().optional(),
    telegramChatId: z.number().int(),
    telegramUpdateId: z.number().int(),
    requestedBy: z.string().min(1),
    voiceFileId: z.string().min(1).optional(),
    instructionText: z.string().min(1).optional(),
  })
  .refine(
    (payload) =>
      Boolean(payload.voiceFileId) !== Boolean(payload.instructionText),
    { message: "Supply exactly one of voiceFileId or instructionText" },
  );

/**
 * Telegram edit failures that mean the button is already gone.
 *
 * Matched against the message `callTelegram` builds, which embeds Telegram's
 * own `description`. Stringly-typed on purpose: the alternative is treating
 * these as real failures, and "message is not modified" is what a RETRY of the
 * retire below looks like — the keyboard is already the one being set, which is
 * success, not a reason to abandon the redraft forever.
 *
 * `restoreRetiredApproveButton` reads the same list for the opposite edit, and
 * every entry means the same thing there: either the keyboard already carries
 * the buttons being set, or the message can no longer be edited by anyone. Both
 * are terminal, and retrying either forever would keep the request in the
 * recovery sweep until its target expired.
 */
const APPROVE_ALREADY_GONE = [
  "message is not modified",
  "message to edit not found",
  "message can't be edited",
  "message_id_invalid",
];

/**
 * The callback verbs a review card's three buttons carry.
 *
 * Read off `sendTelegramReview` / `sendTelegramWebsiteLeadReview` in
 * telegram.ts, and shared by the retire and the restore below so the two can
 * never drift: a restore that rebuilt the keyboard with a verb the webhook does
 * not route puts a dead button in front of Luke, which is worse than the
 * missing one it replaced.
 */
function suggestChangeCardVerbs(targetKind: SuggestChangeTargetKind): {
  approve: string;
  dismiss: string;
  suggest: string;
} {
  return targetKind === "approval"
    ? { approve: "inq:a", dismiss: "inq:d", suggest: "inq:sc" }
    : { approve: "wl:s", dismiss: "wl:d", suggest: "wl:sc" };
}

/** A card that is currently missing its Approve button, and what it approves. */
type RetiredApproveCard = {
  targetKind: SuggestChangeTargetKind;
  targetId: string;
  chatId: string | number;
  messageId: number;
};

/**
 * Put a retired Approve button back.
 *
 * ONLY correct when no revision was written. The retire exists because Approve
 * sends whatever the target holds at tap time, so restoring it over a target
 * that now holds an unread redraft would hand Luke a one-tap send of text he
 * has never read — the exact hazard the retire was invented to prevent. Every
 * caller here is gated on that: the SQL withholds the coordinates from
 * `reopen_suggest_change_request` once the request is 'completed', the reconcile
 * sweep filters on `status <> 'completed'`, and the inline call below runs only
 * on a `complete_suggest_change_request` that refused to write.
 *
 * Idempotent. Telegram answers a keyboard that already matches with 400
 * "message is not modified", which is success, exactly as the retire treats it.
 */
async function restoreRetiredApproveButton(
  card: RetiredApproveCard,
): Promise<void> {
  const verbs = suggestChangeCardVerbs(card.targetKind);

  try {
    await editTelegramReplyMarkup({
      chatId: card.chatId,
      messageId: card.messageId,
      replyMarkup: {
        inline_keyboard: [
          [
            {
              text: "Approve",
              callback_data: `${verbs.approve}:${card.targetId}`,
            },
            {
              text: "Dismiss",
              callback_data: `${verbs.dismiss}:${card.targetId}`,
            },
          ],
          // Same second row as every other review card: a mis-tap next to
          // Approve sends a real customer message.
          [
            {
              text: "✏️ Suggest changes",
              callback_data: `${verbs.suggest}:${card.targetId}`,
            },
          ],
        ],
      },
    });
  } catch (error) {
    const description = (
      error instanceof Error ? error.message : ""
    ).toLowerCase();
    if (APPROVE_ALREADY_GONE.some((known) => description.includes(known))) {
      return;
    }
    throw error;
  }
}

/**
 * Take Approve off the card this revision is about to invalidate.
 *
 * Approve sends `coalesce(final_reply, proposed_reply)` — whatever the target
 * holds when it is TAPPED, not the text the card prints. So the instant the
 * revision is written, the old card's Approve button offers text Luke has never
 * read, and one tap delivers unchecked model output to the customer. Retiring
 * that button before the write is what closes the window; the new card carries
 * a fresh Approve over text he can see.
 *
 * Dismiss and ✏️ Suggest changes stay. Neither can send anything: Dismiss
 * cancels, and Suggest changes re-reads the current draft, so tapping it shows
 * him the revision rather than sending it.
 *
 * Throws when it cannot be sure the button is gone, and the caller must not
 * write in that case. A throw is not a dead end: the run retries from the
 * stored transcript, and an exhausted retry reopens the request and tells Luke.
 * Nothing has been written at that point, so the old card still approves
 * exactly the text it prints.
 *
 * RECOVERABILITY. The stripped state used to be permanent: a throw between this
 * call and the write left a live enquiry behind a card with no way to say yes,
 * and nothing anywhere looked for that. The coordinates are therefore recorded
 * on the request BEFORE the edit is issued, and the returned card is what every
 * restore path repairs. Recording first is the safe asymmetry: coordinates for
 * a button that is still there cost one no-op edit later, while a button
 * stripped with nothing recorded is unrecoverable.
 *
 * Returns the card it stripped, or null when there was nothing to strip.
 */
async function retireSupersededApproveButton(input: {
  requestId: string;
  targetKind: SuggestChangeTargetKind;
  targetId: string;
  chatId: string | null | undefined;
  messageId: number | null | undefined;
}): Promise<RetiredApproveCard | null> {
  if (input.chatId === undefined || input.messageId === undefined) {
    // A database still on the 202608070005 context function, which does not
    // return the card. Unknown is not the same as absent, and guessing absent
    // is how the button stays live over a draft nobody has read.
    throw new Error(
      "The redraft context did not say which card carries the Approve button, so the revision was not written.",
    );
  }

  // No card pointer at all: there is no live button to retire.
  if (input.chatId === null || input.messageId === null) return null;

  // Telegram chat ids are well inside the safe integer range, and the column
  // recording them is a bigint. A value that does not survive the round trip
  // would be recorded as the wrong card, so it stops the redraft instead:
  // nothing is written and the old card keeps its live Approve over the text it
  // prints.
  const chatId = Number(input.chatId);
  if (!Number.isSafeInteger(chatId)) {
    throw new Error(
      `The redraft could not read the Approve card's chat id (${input.chatId}) as a number, so the revision was not written.`,
    );
  }

  const recorded = await recordRetiredSuggestChangeCard({
    requestId: input.requestId,
    chatId,
    messageId: input.messageId,
  });

  if (!recorded.recorded) {
    // The request left 'drafting' between the bind and here, so the write below
    // is going to be refused anyway. Stripping now would take Approve off a
    // card whose draft is never going to change, for no gain at all.
    logger.warn("Not retiring an Approve button for a request that moved on", {
      requestId: input.requestId,
      reason: recorded.reason,
    });
    return null;
  }

  const verbs = suggestChangeCardVerbs(input.targetKind);

  try {
    await editTelegramReplyMarkup({
      chatId: input.chatId,
      messageId: input.messageId,
      replyMarkup: {
        inline_keyboard: [
          [
            {
              text: "Dismiss",
              callback_data: `${verbs.dismiss}:${input.targetId}`,
            },
          ],
          [
            {
              text: "✏️ Suggest changes",
              callback_data: `${verbs.suggest}:${input.targetId}`,
            },
          ],
        ],
      },
    });
  } catch (error) {
    const description = (
      error instanceof Error ? error.message : ""
    ).toLowerCase();
    if (APPROVE_ALREADY_GONE.some((known) => description.includes(known))) {
      return {
        targetKind: input.targetKind,
        targetId: input.targetId,
        chatId,
        messageId: input.messageId,
      };
    }
    throw error;
  }

  return {
    targetKind: input.targetKind,
    targetId: input.targetId,
    chatId,
    messageId: input.messageId,
  };
}

/** Everything the redraft needs about the request it is revising. */
type BoundRedraft = {
  requestId: string;
  targetKind: SuggestChangeTargetKind;
  targetId: string;
  revision: number;
  sourceDraft: string | null;
  instructionHistory: SuggestChangeInstructionHistory;
};

/**
 * Turn Luke's voicenote (or typed notes) into a new draft, and put a fresh
 * Approve / Dismiss / Suggest changes card in front of him.
 *
 * ORDER OF WRITES. The draft is written to the target table BEFORE the new
 * card is posted, and the card's id is stitched on afterwards by
 * `attachSuggestChangeCard`. Posting first meant a failed write left a card
 * quoting the new price with a live Approve button over a target row still
 * holding the old one. The invariant is absolute: no Telegram button may ever
 * offer text the target does not contain. A card that fails to send is only a
 * missing notification, which is the safe direction.
 *
 * RETRY BOUNDARY. The bind burns the Telegram update id, so attempt 2 cannot
 * bind again — it comes back `duplicate` and RESUMES from the transcript the
 * first attempt stored. Silence is the failure mode this task is written
 * against: every exit tells Luke what happened, and `onFailure` covers the
 * exhausted-retry case that no `return` can reach.
 */
export const processSuggestChange = schemaTask({
  id: "process-suggest-change",
  schema: suggestChangeTaskPayloadSchema,
  queue: { name: "inquiry-redrafts", concurrencyLimit: 1 },
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1_000,
    maxTimeoutInMs: 15_000,
    randomize: true,
  },
  run: async (payload) => {
    const tell = async (text: string): Promise<void> => {
      try {
        await sendTelegramMessage({ chatId: payload.telegramChatId, text });
      } catch (error) {
        logger.error("Failed to report redraft outcome on Telegram", {
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    let instructions: string;
    if (payload.instructionText) {
      instructions = payload.instructionText.trim();
    } else if (payload.voiceFileId) {
      try {
        instructions = await transcribeTelegramVoice(payload.voiceFileId);
      } catch (error) {
        // Inverted against the send tasks on purpose. A send with an uncertain
        // outcome must never be retried (it may already have reached the
        // customer); transcription has no side effect, so the uncertain cases
        // — network blips, unreadable bodies — are exactly the ones worth
        // retrying, and the definite ones (oversized note, empty transcript,
        // rejected file_id) would fail identically forever.
        const uncertain =
          error instanceof VoiceTranscriptionError ? error.uncertain : true;
        const message =
          error instanceof Error ? error.message : "Unknown transcription error";
        logger.error("Voicenote transcription failed", {
          uncertain,
          message,
        });

        if (uncertain) throw error;

        await tell(
          "🎙️ I couldn't read that voicenote, so nothing was changed. Record it again, or type the changes instead.",
        );
        return { status: "transcription_failed" as const };
      }
    } else {
      // Unreachable: the payload schema requires exactly one of the two.
      logger.error("Redraft payload carried neither voice nor text");
      return { status: "invalid_payload" as const };
    }

    // Bind to the request these instructions were recorded against, or to
    // nothing at all. The chat's newest open request is not a safe fallback:
    // tapping ✏️ on a second customer while Whisper is still running would
    // hand A's words to B's draft.
    const binding = payload.requestId
      ? await bindSuggestChangeInstructions({
          requestId: payload.requestId,
          telegramChatId: payload.telegramChatId,
          instructions,
          requestedBy: payload.requestedBy,
          telegramUpdateId: payload.telegramUpdateId,
        })
      : await recordSuggestChangeInstructions({
          telegramChatId: payload.telegramChatId,
          instructions,
          requestedBy: payload.requestedBy,
          telegramUpdateId: payload.telegramUpdateId,
        });

    let bound: BoundRedraft;

    if (binding.bound) {
      bound = {
        requestId: binding.requestId,
        targetKind: binding.targetKind,
        targetId: binding.targetId,
        revision: binding.revision,
        sourceDraft: binding.sourceDraft,
        instructionHistory: binding.instructionHistory,
      };
    } else if (binding.duplicate) {
      // An earlier attempt bound these instructions and then died. The update
      // id is spent, so re-binding is impossible — but the transcript it wrote
      // is still on the request, and the request is still 'drafting'. Carry on
      // from there. Returning here (the old behaviour) dropped the voicenote
      // in silence and left the request stuck for its full 24 hours, while
      // every later voicenote was answered "I'm still redrafting from your
      // last note".
      let openRequest: OpenSuggestChangeRequest | null = null;
      try {
        openRequest = await getOpenSuggestChangeRequest(payload.telegramChatId);
      } catch (error) {
        logger.warn("Could not read the open request to resume a redraft", {
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }

      const stored = openRequest?.instructions?.trim() ?? "";
      const resumable =
        openRequest !== null &&
        openRequest.status === "drafting" &&
        stored !== "" &&
        (!payload.requestId || openRequest.requestId === payload.requestId);

      if (openRequest === null || !resumable) {
        // Genuinely gone: cancelled, expired, or already completed. Still not
        // silent — Luke has no other way to learn his voicenote went nowhere.
        logger.info("A duplicate bind had nothing left to resume", {
          enqueued: payload.requestId,
          status: openRequest?.status ?? null,
        });
        await tell(
          "🎙️ I picked that voicenote up once already but couldn't confirm the redraft finished. Check the newest card for this enquiry: if it doesn't show your change, tap ✏️ Suggest changes and send it again.",
        );
        return { status: "duplicate_not_resumable" as const };
      }

      logger.info("Resuming an interrupted redraft from its stored transcript", {
        requestId: openRequest.requestId,
      });
      instructions = stored;
      bound = {
        requestId: openRequest.requestId,
        targetKind: openRequest.targetKind,
        targetId: openRequest.targetId,
        revision: openRequest.revision,
        sourceDraft: openRequest.sourceDraft,
        instructionHistory: openRequest.instructionHistory,
      };
    } else if (
      binding.reason === "request_superseded" ||
      binding.reason === "request_not_found"
    ) {
      // HARD STOP. Luke moved on before the transcript existed. Applying these
      // instructions to whatever is open now would revise the wrong customer's
      // draft, and that draft is what Approve sends.
      logger.warn("Redraft instructions arrived after their request closed", {
        requestId: payload.requestId,
        reason: binding.reason,
      });
      await tell(
        "🎙️ That voicenote reached me after you'd moved on to another card, so I did NOT apply it — it was recorded for a different enquiry and using it here would rewrite the wrong customer's reply. Nothing was changed. Tap ✏️ Suggest changes on the card you meant and send it again.",
      );
      return { status: binding.reason };
    } else {
      // Cancelled or expired between the webhook and here. Not a failure:
      // throwing would retry a redraft nobody is waiting for.
      logger.info("Suggest-change instructions did not bind", {
        reason: binding.reason,
      });
      await tell(
        "⌛ Nothing was waiting for those changes any more, so I left the draft alone. Tap ✏️ Suggest changes on the card again if you still want it redrafted.",
      );
      return { status: binding.reason ?? "unbound" };
    }

    // Defensive: the request-scoped bind cannot return a different request, and
    // the request-less path has no id to compare. If either ever changes, stop
    // rather than redraft a customer these instructions were not meant for.
    if (payload.requestId && payload.requestId !== bound.requestId) {
      logger.error("Redraft bound to a different request than enqueued", {
        enqueued: payload.requestId,
        bound: bound.requestId,
      });
      await tell(
        "🎙️ That voicenote didn't line up with the card it was recorded against, so I left every draft alone. Tap ✏️ Suggest changes on the card you meant and send it again.",
      );
      return { status: "request_mismatch" as const };
    }

    // Read before completing: once the request completes it is no longer
    // "open", and this is the only way back to the prompt whose 🚫 Cancel
    // button has to be retired.
    let promptMessageId: number | null = null;
    try {
      const open = await getOpenSuggestChangeRequest(payload.telegramChatId);
      if (open && open.requestId === bound.requestId) {
        promptMessageId = open.promptMessageId;
      }
    } catch (error) {
      logger.warn("Could not load the open request's prompt id", {
        requestId: bound.requestId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    const currentDraft = bound.sourceDraft?.trim() ?? "";
    if (currentDraft === "") {
      await tell(
        "⚠️ I've lost the draft those changes applied to, so nothing was rewritten. Tap ✏️ Suggest changes on the card again.",
      );
      return { status: "no_source_draft" as const };
    }

    // Who the draft is for. Without this the model is asked to "answer their
    // question about parking" having never seen the customer ask it. Worse, it
    // never learns that Luke already confirmed a date, so the redraft reverts
    // his answered availability to "he'll check and let you know". Every read
    // that hangs off it below is best-effort: a degraded redraft beats a lost
    // voicenote, so those failures only warn.
    //
    // THIS read is not, and it is the only one that cannot be. It also carries
    // the id of the card whose Approve button this revision is about to start
    // offering, and that button has to be retired before the write. Failing to
    // read it means failing to know what is live in the chat, so the run
    // retries rather than writing a draft behind a button it cannot account
    // for. Nothing has changed at that point: the old card still approves
    // exactly the text it prints.
    let context: SuggestChangeTargetContext;
    try {
      context = await getSuggestChangeTargetContext(bound.requestId);
    } catch (error) {
      logger.error("Redraft target context unavailable; not writing a revision", {
        requestId: bound.requestId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }

    if (!context.found) {
      logger.warn("Redraft target carried no context", {
        requestId: bound.requestId,
        reason: context.reason,
      });
    }

    const found = context.found ? context : null;
    const leadDetails = found?.targetKind === "website_lead" ? found.lead : null;

    let burstMessages: InquiryMessageRow[] = [];
    let renderedHistory = "";
    let renderedProfile = "";
    let availabilityFact: AvailabilityFact | null = null;
    let conversationId: string | undefined;
    // What the first draft retrieved its learned corrections against. Empty
    // when the context read failed or the run stored none: an empty list means
    // NO examples, which is the safe direction, because a guessed superset
    // would pull priced corrections into a cosmetic edit.
    let intents: string[] = [];
    // The attachments this draft already carries, for the card only. Approve
    // sends them either way; naming them is what stops Luke approving a
    // revision he thinks is text-only.
    let mediaAssets: MediaAssetRow[] = [];

    if (found?.targetKind === "approval") {
      conversationId = found.conversationId;
      availabilityFact = found.availabilityFact;
      intents = found.intents;

      // Best-effort, like the history and profile reads below: a card that
      // cannot list its attachments is worth far more than a lost voicenote.
      if (found.proposedMediaSlugs.length > 0) {
        try {
          mediaAssets = await getMediaAssetsBySlugs(found.proposedMediaSlugs);
        } catch (mediaError) {
          logger.warn("Redraft attachments unavailable; card will omit them", {
            requestId: bound.requestId,
            message:
              mediaError instanceof Error
                ? mediaError.message
                : "Unknown media error",
          });
        }
      }

      try {
        burstMessages = await getInquiryMessagesByIds(found.messageIds);
      } catch (messageError) {
        logger.warn("Burst messages unavailable; redrafting without them", {
          requestId: bound.requestId,
          message:
            messageError instanceof Error
              ? messageError.message
              : "Unknown message error",
        });
      }

      // Same posture as process-inquiry-conversation: Zernio is a third party
      // and its history is a nicety, so a failure warns and drafts on.
      let history: ZernioHistoryMessage[] = [];
      try {
        const providerIds =
          await getInquiryConversationProviderIds(found.conversationId);
        history = await getZernioConversationHistory({
          conversationId: providerIds.providerConversationId,
          accountId: providerIds.providerAccountId,
        });
      } catch (historyError) {
        logger.warn("Conversation history unavailable; redrafting without it", {
          conversationId: found.conversationId,
          message:
            historyError instanceof Error
              ? historyError.message
              : "Unknown history error",
        });
      }

      let profile: ClientProfile | null = null;
      try {
        profile = await getInquiryClientProfile(found.conversationId);
      } catch (profileError) {
        logger.warn("Client profile unavailable; redrafting without it", {
          conversationId: found.conversationId,
          message:
            profileError instanceof Error
              ? profileError.message
              : "Unknown profile error",
        });
      }

      renderedHistory = renderConversationHistory(history, burstMessages);
      renderedProfile = renderClientProfile(profile);
    }

    // A lead whose availability we cannot read is the one degraded case Luke
    // has to know about: the redraft prompt falls back to "carry the current
    // draft's answer across", which is safe but unverified. Never silent.
    if (bound.targetKind === "website_lead" && !leadDetails?.availability) {
      await tell(
        "⚠️ I couldn't confirm this lead's availability answer, so I've told the model to carry across whatever the current draft says about the date. Check the new draft still gives the right answer before you approve it.",
      );
    }

    let redraft: { draft: string; model: string };
    try {
      redraft =
        bound.targetKind === "approval"
          ? await redraftInquiryReply({
              currentDraft,
              instructions,
              instructionHistory: bound.instructionHistory,
              revision: bound.revision,
              messages: burstMessages,
              renderedHistory,
              renderedProfile,
              availabilityFact,
              conversationId,
              intents,
            })
          : await redraftWebsiteLeadReply({
              currentDraft,
              instructions,
              instructionHistory: bound.instructionHistory,
              revision: bound.revision,
              lead: leadDetails,
            });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown redraft error";
      logger.error("Redraft generation failed", {
        requestId: bound.requestId,
        message,
      });
      await tell(
        `⚠️ I couldn't redraft that (${message}). Nothing was changed — tap ✏️ Suggest changes on the card to try again.`,
      );
      return { status: "redraft_failed" as const };
    }

    // RETIRE THE OLD APPROVE BUTTON, THEN WRITE.
    //
    // Both halves of one invariant. No button may offer text the target does
    // not contain — which is why the write comes before the new card, since the
    // reverse order left a card quoting a corrected price over a target row
    // still holding the old one. And no button may SEND text Luke has never
    // been shown — which is why the old card's Approve goes first, since the
    // moment this write lands that button starts offering a revision he has not
    // read. Between the two calls the old card carries Dismiss and ✏️ Suggest
    // changes over the text it prints, which is consistent in both directions.
    //
    // A throw here leaves nothing written and the old card intact; the run
    // retries from the stored transcript and `onFailure` covers the rest.
    //
    // The coordinates of whatever is stripped are recorded on the request first,
    // so every way out of the window between the two calls can put the button
    // back: `onFailure` when the retries are spent, the branch below when the
    // write is refused, and the reconcile cron when neither of those runs.
    let retiredCard: RetiredApproveCard | null = null;
    if (found) {
      retiredCard = await retireSupersededApproveButton({
        requestId: bound.requestId,
        targetKind: found.targetKind,
        targetId: found.targetId,
        chatId: found.cardChatId,
        messageId: found.cardMessageId,
      });
    }

    // If this throws, the run retries and resumes from the stored transcript;
    // if it exhausts its retries, `onFailure` tells Luke.
    const completed = await completeSuggestChangeRequest({
      requestId: bound.requestId,
      newDraft: redraft.draft,
    });

    if (!completed.completed) {
      // NOTHING WAS WRITTEN, SO THE STRIPPED BUTTON GOES BACK.
      //
      // This exit does not throw, so `onFailure` never runs for it: without the
      // repair here the only recovery is the cron, and Luke stares at a card he
      // cannot approve until it ticks. The target still holds exactly the draft
      // its card prints, which is the one state where restoring Approve is
      // safe.
      //
      // Skipped for 'target_not_actionable', where the enquiry was approved,
      // dismissed or expired while the model was drafting: there is nothing
      // left to approve, and re-arming a button on a decision Luke already made
      // is noise at best.
      if (retiredCard && completed.reason !== "target_not_actionable") {
        try {
          await restoreRetiredApproveButton(retiredCard);
          await clearRetiredSuggestChangeCard(bound.requestId);
        } catch (error) {
          logger.error(
            "Could not restore an Approve button; the cron will retry it",
            {
              requestId: bound.requestId,
              message: error instanceof Error ? error.message : "Unknown error",
            },
          );
        }
      }

      // No card was posted, so there is nothing to retract — just say so.
      await tell(
        completed.reason === "target_not_actionable"
          ? "⚠️ Not applied\n\nThis enquiry was approved, dismissed, or expired while I was redrafting, so your changes were not saved and nothing was sent."
          : `⚠️ Not applied\n\nYour changes were not saved (${completed.reason ?? "unknown"}). Nothing was sent.`,
      );

      return { status: "not_applied" as const, reason: completed.reason };
    }

    // The revision IS written, so the stripped card must stay stripped: the new
    // card below carries the live Approve over text Luke can read, and the old
    // one now prints a draft the target no longer holds. Dropping the recorded
    // coordinates is what stops any restore path ever re-arming it. Only a
    // warning: every restore path is already gated on the request not being
    // 'completed', so this is the second lock on the same door.
    try {
      await clearRetiredSuggestChangeCard(bound.requestId);
    } catch (error) {
      logger.warn("Could not clear a retired card after a completed redraft", {
        requestId: bound.requestId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    let card: { chatId: string; messageId: number } | null = null;
    try {
      card = await sendTelegramRedraftReview({
        target: bound.targetKind,
        targetId: bound.targetId,
        draft: redraft.draft,
        // The real name when the context read found the target; the same
        // generic fallback open_suggest_change_request uses when it did not.
        targetName: found?.targetName ?? "the customer",
        instructions,
        revision: bound.revision,
        // Approval targets only, and empty for every other case. A website
        // lead's draft is a single text message (websiteLeadDraftSchema) with
        // no media to attach, so there is nothing to name on that card; an
        // approval whose context or media read failed renders as it did
        // before, which is the pre-existing behaviour rather than a new gap.
        mediaAssets,
      });
    } catch (error) {
      logger.error("Failed to send the redraft review card", {
        requestId: bound.requestId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    if (card) {
      try {
        // Records the card AND repoints the target at it, so a typed
        // correction swipe-replied to this card still finds its target. Only
        // ever a warning: the draft is already correct, and a card that exists
        // but is not registered is far better than a write that never landed.
        await attachSuggestChangeCard({
          requestId: bound.requestId,
          cardMessageId: card.messageId,
        });
      } catch (error) {
        logger.error("Failed to attach the redraft card to its request", {
          requestId: bound.requestId,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } else {
      // The draft landed but its card did not. Nothing in the chat can send it
      // unread: the old card's Approve was retired above, and the request is
      // now 'completed' with `card_message_id` null, which
      // `reconcile_stale_inquiry_work` sweeps for and re-posts on the */3 cron.
      // THAT is the recovery — minutes later, over a connection that is not the
      // one that just broke. This message is a courtesy on top of it, and a
      // deliberately unreliable one: it is the same Telegram sendMessage that
      // just failed, to the same chat, on the same token, so under a flood
      // control or a 5xx it fails too. Nothing depends on it arriving.
      await tell(
        `✏️ Revision ${bound.revision} is saved, but I couldn't post the new card. Approve is off the old card, so nothing in this chat can send a draft you haven't read, and I'll put the new card up automatically within a few minutes.\n\nThe saved text is:\n\n${redraft.draft}`,
      );
    }

    if (promptMessageId !== null) {
      try {
        await editTelegramReplyMarkup({
          chatId: payload.telegramChatId,
          messageId: promptMessageId,
          replyMarkup: { inline_keyboard: [] },
        });
      } catch (error) {
        logger.warn("Failed to retire the superseded suggest-change prompt", {
          requestId: bound.requestId,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      status: "redrafted" as const,
      requestId: completed.requestId,
      revision: completed.revision,
      messageId: card?.messageId,
    };
  },
  /**
   * Every retry is spent and `run` never reached a `tell()`.
   *
   * Without this, a transcription that fails the same way three times (a
   * misconfigured model, a missing key, a degraded gateway) leaves Luke with
   * no message at all, next to a live Approve button on the draft he just
   * recorded himself objecting to. The request also has to leave 'drafting',
   * or `get_open_suggest_change_request` keeps answering his next voicenote
   * with "I'm still redrafting from your last note" for 24 hours.
   *
   * And it is where the stripped Approve button comes back. The retire runs
   * before the write precisely so a half-finished redraft cannot leave a live
   * button over unread text; when the redraft then dies, that same button is
   * missing from a card whose draft never changed, and this is the first place
   * that knows it is never coming back on its own.
   */
  onFailure: async ({ payload, error }) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    let hadBound = false;
    // What the message is allowed to claim about the source card. 'intact' is
    // the common case, a redraft that never stripped anything, and 'unknown' is
    // the honest answer when the reopen itself failed: promising a repair that
    // never happened is the defect being fixed here, and so is promising a card
    // is fine when nothing checked.
    let cardRepair: "restored" | "pending" | "intact" | "unknown" = "intact";

    if (payload.requestId) {
      try {
        const reopened = await reopenSuggestChangeRequest(payload.requestId);
        // 'drafting' means the transcript landed and the redraft died after
        // it; anything else means the voicenote never got that far.
        hadBound = reopened.previousStatus === "drafting";

        // The SQL hands these over only when the request is NOT 'completed',
        // which is exactly when no revision was written. That is the whole
        // safety gate: restoring Approve over a target that already holds an
        // unread redraft would be a one-tap send of text Luke has never seen.
        const chatId = reopened.retiredCardChatId;
        const messageId = reopened.retiredCardMessageId;
        const targetKind = reopened.targetKind;
        const targetId = reopened.targetId;

        if (chatId && messageId && targetKind && targetId) {
          cardRepair = "pending";
          try {
            await restoreRetiredApproveButton({
              targetKind,
              targetId,
              chatId,
              messageId,
            });
            cardRepair = "restored";
          } catch (restoreError) {
            // Never fatal. The request is already reopened and the transcript
            // is still on it, so the voicenote is not lost; the reconcile cron
            // sweeps this exact state every three minutes and repeats the
            // repair until it lands.
            logger.error("Failed to restore a retired Approve button", {
              requestId: payload.requestId,
              message:
                restoreError instanceof Error
                  ? restoreError.message
                  : "Unknown error",
            });
          }

          if (cardRepair === "restored") {
            try {
              await clearRetiredSuggestChangeCard(payload.requestId);
            } catch (clearError) {
              // The button is already back. Left unclear, the cron sets the
              // same keyboard once more and Telegram answers "message is not
              // modified", which the restore treats as success and clears then.
              logger.warn("Could not clear a restored card's coordinates", {
                requestId: payload.requestId,
                message:
                  clearError instanceof Error
                    ? clearError.message
                    : "Unknown error",
              });
            }
          }
        }
      } catch (reopenError) {
        // The read that would have told us about the card is the thing that
        // failed, so the message must not claim the card is fine either.
        cardRepair = "unknown";
        logger.error("Failed to reopen a request after an exhausted redraft", {
          requestId: payload.requestId,
          message:
            reopenError instanceof Error ? reopenError.message : "Unknown error",
        });
      }
    }

    // What is actually true, rather than the old "check the newest card for
    // this enquiry before you approve it": there is no newest card, because the
    // redraft never wrote one, and the card he is already looking at is the one
    // that matters.
    const cardLine = {
      restored:
        "The original card still holds the draft it prints, and its Approve button is back, so you can approve it as it stands or tap ✏️ Suggest changes to send the note again.",
      pending:
        "The original card still holds the draft it prints, but I couldn't put its Approve button back yet; I'll keep retrying every few minutes. Tap ✏️ Suggest changes to send the note again.",
      intact:
        "The original card is untouched, so you can approve it as it stands or tap ✏️ Suggest changes to send the note again.",
      unknown:
        "I couldn't reach the database to check the original card. If its Approve button is missing I'll put it back within a few minutes; otherwise it still holds the draft it prints.",
    }[cardRepair];

    try {
      await sendTelegramMessage({
        chatId: payload.telegramChatId,
        text: hadBound
          ? `⚠️ I couldn't finish that redraft (${message}). Your changes were not applied and nothing was sent to anyone. ${cardLine}`
          : `🎙️ I couldn't read that voicenote (${message}), so the draft is unchanged and nothing was sent. Record it again, or type the changes as a reply to the ✏️ prompt.`,
      });
    } catch (telegramError) {
      logger.error("Failed to report an exhausted redraft on Telegram", {
        message:
          telegramError instanceof Error
            ? telegramError.message
            : "Unknown error",
      });
    }
  },
});

const outboxPayloadSchema = z.object({
  conversationId: z.string().uuid().optional(),
  approvalId: z.string().uuid().optional(),
  checkId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
});

export const dispatchInquiryOutbox = schedules.task({
  id: "dispatch-inquiry-outbox",
  cron: "*/3 * * * *",
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

    // Close the cards of anything that aged out before Luke acted on it.
    const expiredCards = [
      ...stale.expiredAvailabilityCards.map((card) => ({
        ...card,
        text: "⏰ Expired\n\nThis availability question is no longer actionable; the enquiry aged out before it was answered.",
      })),
      ...stale.expiredLeadCards.map((card) => ({
        ...card,
        text: "⏰ Expired\n\nThis website lead aged out before a reply was approved. Message them manually if it still matters.",
      })),
      ...stale.expiredOverridePrompts.map((prompt) => ({
        telegramChatId: prompt.telegramChatId,
        telegramMessageId: prompt.promptMessageId,
        text: "⌛ Expired\n\nThis override was never confirmed; nothing was sent.",
      })),
      // The reconciler expires these too. Left unrepainted, the prompt keeps
      // reading "send me a voicenote" and keeps its 🚫 Cancel button, while a
      // voicenote sent against it is answered "nothing is waiting for changes"
      // and a typed reply to it is dropped without a word.
      ...stale.expiredSuggestChangePrompts.map((prompt) => ({
        telegramChatId: prompt.telegramChatId,
        telegramMessageId: prompt.promptMessageId,
        text: "⌛ Expired\n\nThis redraft request timed out, so nothing was changed. Tap ✏️ Suggest changes on the card if you still want it redrafted.",
      })),
    ];
    for (const card of expiredCards) {
      if (!card.telegramChatId || !card.telegramMessageId) continue;
      try {
        await editTelegramReview({
          chatId: card.telegramChatId,
          messageId: card.telegramMessageId,
          text: card.text,
        });
      } catch (error) {
        logger.warn("Failed to close expired card in Telegram", {
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // THE REDRAFT THAT LANDED WITHOUT A CARD.
    //
    // `process-suggest-change` commits the revision into the target table and
    // then posts its card. When the send fails, the request is left 'completed'
    // with no card and the revision sits in the target unread. The task's own
    // compensation is a Telegram sendMessage issued a moment after a Telegram
    // sendMessage failed, which under flood control or a 5xx fails for exactly
    // the same reason — a correlated fallback is not a fallback. This is the
    // one that is not correlated: it runs on the next tick of this cron,
    // minutes later, and keeps trying every three minutes until the card lands
    // or the target expires.
    //
    // The text comes from the reconciler, read fresh from the target row, so
    // the card prints what Approve would actually send.
    for (const pending of stale.cardlessRedrafts) {
      try {
        // Best-effort, exactly as on the first attempt: a card that cannot list
        // its attachments still beats a revision Luke never sees.
        let mediaAssets: MediaAssetRow[] = [];
        if (pending.mediaSlugs.length > 0) {
          try {
            mediaAssets = await getMediaAssetsBySlugs(pending.mediaSlugs);
          } catch (mediaError) {
            logger.warn("Recovered redraft card will omit its attachments", {
              requestId: pending.requestId,
              message:
                mediaError instanceof Error
                  ? mediaError.message
                  : "Unknown media error",
            });
          }
        }

        const card = await sendTelegramRedraftReview({
          target: pending.targetKind,
          targetId: pending.targetId,
          draft: pending.draft,
          targetName: pending.targetName,
          instructions: pending.instructions,
          revision: pending.revision,
          mediaAssets,
        });

        // Attaching is what takes the request out of this sweep, so a failure
        // here means the next tick posts another card. Duplicate cards are
        // noise, not a defect: every one of them offers the text the target
        // holds.
        await attachSuggestChangeCard({
          requestId: pending.requestId,
          cardMessageId: card.messageId,
        });
      } catch (error) {
        logger.warn("Could not post a missing redraft card; retrying next tick", {
          requestId: pending.requestId,
          telegramChatId: pending.telegramChatId,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // THE CARD THAT LOST ITS APPROVE BUTTON.
    //
    // The mirror of the sweep above. `process-suggest-change` strips the source
    // card's Approve before it writes, because Approve sends whatever the
    // target holds when it is tapped. When the write then never happens, the
    // target still holds exactly the draft that card prints and the only thing
    // missing is the button to accept it. `onFailure` repairs that itself, but
    // `onFailure` is a network call away from failing too, and before this
    // branch existed a failure there left a live enquiry behind a card with no
    // way to say yes and no message explaining it.
    //
    // The reconciler only reports requests that are NOT 'completed', so a
    // redraft that did write is never in this set and its retired button stays
    // retired. Clearing the coordinates is what takes a repaired card out of
    // the sweep; a failure here just means the next tick tries again, and a
    // restore that lands twice is a no-op.
    let restoredApproveCards = 0;
    for (const retired of stale.retiredApproveCards) {
      try {
        await restoreRetiredApproveButton({
          targetKind: retired.targetKind,
          targetId: retired.targetId,
          chatId: retired.telegramChatId,
          messageId: retired.messageId,
        });
        await clearRetiredSuggestChangeCard(retired.requestId);
        restoredApproveCards += 1;
      } catch (error) {
        logger.warn("Could not restore an Approve button; retrying next tick", {
          requestId: retired.requestId,
          telegramChatId: retired.telegramChatId,
          message: error instanceof Error ? error.message : "Unknown error",
        });
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
              // Trailing debounce with no maxDelay: every new message pushes
              // execution out another 2 minutes, so a burst of any length is
              // analysed as one batch once the customer goes quiet.
              debounce: {
                key: conversationId,
                delay: "2m",
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
        } else if (event.eventType === "inquiry.availability_requested") {
          const checkId = payload.checkId ?? event.aggregateId;
          await notifyAvailabilityCheck.trigger(
            { checkId },
            { concurrencyKey: checkId },
          );
        } else if (event.eventType === "inquiry.availability_answered") {
          // Immediate resume, no debounce: Luke already waited for his own
          // answer, and the aggregate is the check, so the conversation id
          // must come from the payload.
          const conversationId = payload.conversationId;
          if (!conversationId) {
            throw new Error(
              "availability_answered outbox event is missing conversationId",
            );
          }
          await processInquiryConversation.trigger(
            { conversationId },
            { concurrencyKey: conversationId },
          );
        } else if (event.eventType === "inquiry.redraft_requested") {
          // Recovery path for a redraft that was written to the outbox instead
          // of dispatched inline. No RPC emits this event today (the webhook
          // enqueues directly because there is no function that inserts one),
          // so this branch is dormant until one does — but the event type is
          // already in the CHECK constraint and the union, and an unhandled
          // type here would fall through to the approved-send branch.
          const redraft = suggestChangeTaskPayloadSchema.parse(event.payload);
          await processSuggestChange.trigger(redraft, {
            concurrencyKey: String(redraft.telegramChatId),
          });
        } else if (event.eventType === "website_lead.availability_decided") {
          const leadId = payload.leadId ?? event.aggregateId;
          await draftWebsiteLeadReplyTask.trigger(
            { leadId },
            { concurrencyKey: leadId },
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
      staleLeadWork: stale.staleLeadWork,
      expiredCards: expiredCards.length,
      restoredApproveCards,
    };
  },
});
