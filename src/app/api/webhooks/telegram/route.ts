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
  parseTelegramCallback,
} from "@/lib/inquiries/security";
import {
  answerInquiryAvailability,
  attachOverrideConfirmationPrompt,
  attachSuggestChangePrompt,
  cancelInquiryOverride,
  cancelSuggestChangeRequest,
  claimInquiryOutboxEvent,
  completeInquiryOutboxEvent,
  confirmInquiryOverride,
  decideInquiryApproval,
  decideWebsiteLeadAvailability,
  decideWebsiteLeadDraft,
  getOpenSuggestChangeRequest,
  openSuggestChangeRequest,
  recordInquiryOverride,
  releaseInquiryOutboxEvent,
  stageInquiryOverride,
  type OpenSuggestChangeRequest,
} from "@/lib/inquiries/supabase";
import {
  answerTelegramCallback,
  buildWaMePrefill,
  editTelegramReplyMarkup,
  editTelegramReview,
  sendTelegramMessage,
  sendTelegramOverrideConfirm,
  sendTelegramSuggestChangesPrompt,
  type InlineKeyboard,
} from "@/lib/inquiries/telegram";
import { renderNamedTemplate } from "@/lib/admin/templates";
import {
  triggerApprovedResponse,
  triggerAvailabilityResume,
  triggerSuggestChangeRedraft,
  triggerWebsiteLeadDraft,
} from "@/lib/inquiries/triggering";

// Every hop from the webhook into trigger.dev goes through the transactional
// outbox: claim, dispatch, complete — release on failure so the cron retries.
function dispatchOutboxAfter(
  outboxId: string,
  dispatch: () => Promise<void>,
): void {
  after(async () => {
    const claimed = await claimInquiryOutboxEvent(outboxId);
    if (!claimed) return;

    try {
      await dispatch();
      await completeInquiryOutboxEvent(claimed.id, claimed.claimToken);
    } catch (error) {
      await releaseInquiryOutboxEvent(
        claimed.id,
        claimed.claimToken,
        error instanceof Error ? error.message : "Unknown trigger error",
      );
    }
  });
}

// The approved website-lead card: WhatsApp cannot be cold-messaged through
// Zernio (Meta requires a template to open a conversation), so approval hands
// Luke a wa.me button with the message prefilled — one tap, then send.
function buildApprovedLeadCard(input: {
  firstName: string;
  reply: string;
  whatsappDigits: string | null;
}): { text: string; replyMarkup?: InlineKeyboard } {
  if (!input.whatsappDigits) {
    return {
      text: renderNamedTemplate("telegram.approved_lead_card_no_number", {
        first_name: input.firstName,
        reply: input.reply,
      }),
    };
  }

  const prefill = buildWaMePrefill(input.whatsappDigits, input.reply);
  const truncatedNote = prefill.truncated
    ? "⚠️ Too long to prefill: the button opens the chat, copy the text above."
    : "";

  return {
    text: renderNamedTemplate("telegram.approved_lead_card", {
      reply: input.reply,
      truncated_note: truncatedNote,
    }),
    replyMarkup: {
      inline_keyboard: [
        [
          {
            text: `Send to ${input.firstName} on WhatsApp`,
            url: prefill.url,
          },
        ],
      ],
    },
  };
}

// Typed overrides: Luke answers with the text that should be sent instead of
// the draft. A reply to a specific card applies immediately; a bare message
// binds to the newest pending card but must be confirmed with a tap first, so
// stray chat text can never reach a customer. Both are reached only once
// `arbitrateTypedText` has confirmed no suggest-changes request is open, since
// while one is, the same keystrokes mean the opposite thing.
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

  // Group chatter and non-approvers: acknowledge so Telegram does not retry,
  // act on none of it.
  if (!authorised) {
    return Response.json({ received: true, ignored: true });
  }

  // Voice before the empty-text bail: a voicenote carries no `text`, so it used
  // to be discarded here. Checked before the reply-to branch too, since an
  // override needs text and a voicenote has none either way.
  const voice = message.voice ?? message.audio ?? message.video_note;
  if (voice) {
    return handleVoiceMessage(update, voice.file_id, approverId);
  }

  if (overrideText === "") {
    return Response.json({ received: true, ignored: true });
  }

  if (!message.reply_to_message) {
    return handleBareMessage(update, overrideText, approverId);
  }

  // Arbitration runs BEFORE the override, not after it. This gate used to be
  // keyed on the suggest-changes prompt's own message id, which only caught a
  // swipe on the prompt. But the prompt is posted threaded under the review
  // card and quotes the draft, so the card is what reads as the subject and
  // swiping it is the natural gesture. That reply fell straight through to
  // record_inquiry_override, which sets final_reply and approves in one
  // statement with no confirm tap: "make it warmer and mention parking" left
  // for the customer as Luke's reply. Any open request now claims typed text,
  // whichever message it replies to.
  const redraft = await arbitrateTypedText({
    update,
    approverId,
    text: overrideText,
  });
  if (redraft) return redraft;

  // Guarded for the same reason as the arbitration above it, plus one specific
  // to retrying: mode arbitration is not replayable. A 500 here makes Telegram
  // redeliver the whole update, and `arbitrateTypedText` runs again against
  // chat state that has moved — if Luke tapped ✏️ in between, text he meant as
  // an override is re-read as redraft instructions on the second delivery.
  // Refuse once, out loud, rather than let the same keystrokes mean something
  // different on a retry.
  let result: Awaited<ReturnType<typeof recordInquiryOverride>>;
  try {
    result = await recordInquiryOverride({
      telegramChatId: message.chat.id,
      replyToMessageId: message.reply_to_message.message_id,
      overrideText,
      approverId,
      telegramUpdateId: update.update_id,
    });
  } catch (error) {
    console.error("Failed to record the typed override", error);
    try {
      await sendTelegramMessage({
        chatId: message.chat.id,
        replyToMessageId: message.message_id,
        text: "⚠️ I couldn't save that over the draft, so nothing was changed and nothing was sent to anyone. Reply to the card again in a moment.",
      });
    } catch (notifyError) {
      console.error("Failed to report the override write failure", notifyError);
    }
    return Response.json({ received: true, status: "override_write_failed" });
  }

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

  if (result.targetKind === "website_lead") {
    // Website leads never touch Zernio: the "send" is Luke's own tap on the
    // prefilled wa.me button.
    try {
      await editTelegramReview({
        chatId: message.chat.id,
        messageId: message.reply_to_message.message_id,
        ...buildApprovedLeadCard({
          firstName: result.firstName ?? "them",
          reply: result.reply ?? overrideText,
          whatsappDigits: result.whatsappDigits ?? null,
        }),
      });
    } catch (error) {
      console.error("Failed to update overridden website lead card", error);
    }
    return Response.json({ received: true, status: "override_approved" });
  }

  dispatchOutboxAfter(result.outboxId!, () =>
    triggerApprovedResponse(result.approvalId!),
  );

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

/**
 * Hand redraft instructions to the background task and answer Telegram.
 *
 * Deliberately NOT `after()`: without an outbox row to recover from, a failed
 * dispatch there would lose the voicenote silently. Awaiting it costs one fast
 * API call and lets the failure be reported, which is the same trade the
 * override path already makes with its confirm prompt.
 *
 * `requestId` is REQUIRED, and required by the compiler on purpose. The task
 * treats a missing one as "bind to whatever is newest and awaiting in this
 * chat", which can apply Luke's instructions to a customer he was not looking
 * at when a second ✏️ tap lands inside the enqueue-to-dequeue window. There is
 * no caller that may guess: if the open request cannot be read, refuse and say
 * so rather than enqueue an unbound redraft.
 */
async function enqueueRedraft(input: {
  update: TelegramMessageUpdate;
  approverId: string;
  requestId: string;
  voiceFileId?: string;
  instructionText?: string;
}): Promise<Response> {
  const message = input.update.message;

  try {
    await triggerSuggestChangeRedraft({
      requestId: input.requestId,
      telegramChatId: message.chat.id,
      telegramUpdateId: input.update.update_id,
      requestedBy: input.approverId,
      voiceFileId: input.voiceFileId,
      instructionText: input.instructionText,
    });
  } catch (error) {
    console.error("Failed to enqueue the redraft", error);
    try {
      await sendTelegramMessage({
        chatId: message.chat.id,
        replyToMessageId: message.message_id,
        text: "⚠️ I couldn't pick that up, so nothing was changed. Send it again in a moment.",
      });
    } catch (notifyError) {
      console.error("Failed to report the redraft enqueue failure", notifyError);
    }
    return Response.json({ received: true, status: "redraft_enqueue_failed" });
  }

  return Response.json({ received: true, status: "redraft_queued" });
}

/**
 * MODE ARBITRATION, and the only place it happens.
 *
 * Typed text normally means "send this exact text to the customer". While a
 * suggest-changes request is open it means the opposite: it is a note to the
 * drafter. Getting this backwards sends "make it warmer" to a paying customer,
 * which is the worst outcome this system has, so every typed path runs through
 * here before it can reach an override — bare messages and replies alike.
 *
 * Returns null ONLY when there is provably no open request. That is the one
 * answer that licenses the caller to treat the text as customer-bound.
 */
async function arbitrateTypedText(input: {
  update: TelegramMessageUpdate;
  approverId: string;
  text: string;
}): Promise<Response | null> {
  const message = input.update.message;

  let open: OpenSuggestChangeRequest | null;
  try {
    open = await getOpenSuggestChangeRequest(message.chat.id);
  } catch (error) {
    // REFUSE. Both of the tempting answers here send someone the wrong thing.
    //
    // Reading the failure as "no request open" hands the text to the override
    // path, where it becomes final_reply on a live enquiry: "make it warmer and
    // mention parking" arrives as Luke's reply to a bride.
    //
    // Enqueueing the redraft without a request id is no safer. A falsy
    // requestId is the request-LESS path in the task, which binds to whatever
    // is newest and awaiting in the chat rather than to the request Luke was
    // actually looking at. The enqueue-to-dequeue gap is seconds to tens of
    // seconds (the redraft queue runs one at a time), and a second ✏️ tap in
    // that window cancels the first request and makes a different customer the
    // newest — so the instructions, prices and all, land on their draft. That
    // is exactly the wrong-customer bug request-scoped binding was written to
    // remove; the enqueue must never omit a request id it could not confirm.
    //
    // So take no consequential action: nothing is bound, nothing is written,
    // nothing reaches a customer. Tell Luke plainly that the state could not be
    // read and that resending is safe. He loses a few seconds; nobody receives
    // anything wrong.
    console.error("Failed to read the open suggest-change request", error);
    try {
      await sendTelegramMessage({
        chatId: message.chat.id,
        replyToMessageId: message.message_id,
        text: "⚠️ I couldn't check what state your draft is in, so I did nothing with that. It was not applied to any draft and nothing was sent to anyone. Send it again in a moment and it'll land normally.",
      });
    } catch (notifyError) {
      console.error(
        "Failed to report the suggest-change lookup failure",
        notifyError,
      );
    }
    // Still 200: Telegram retries non-2xx indefinitely, and a retry would only
    // hit the same unreadable state.
    return Response.json({ received: true, status: "request_state_unknown" });
  }

  if (!open) return null;

  if (open.status === "drafting") {
    // A redraft is already running against this target, and the request stops
    // accepting instructions the moment it binds. Enqueueing a second one
    // would either run on top of the first or bind nothing and report "nothing
    // was waiting", so say what actually happened rather than queue work that
    // cannot land. Mirrors the answer a voicenote already gets in this window.
    try {
      await sendTelegramMessage({
        chatId: message.chat.id,
        replyToMessageId: message.message_id,
        text: "✏️ I'm still redrafting from your last note, so I haven't applied this one. Nothing was changed and nothing was sent. Once the new card lands, tap ✏️ Suggest changes on it and send me this again.",
      });
    } catch (error) {
      console.error("Failed to report a redraft already in progress", error);
    }
    return Response.json({ received: true, status: "redraft_in_progress" });
  }

  return enqueueRedraft({
    update: input.update,
    approverId: input.approverId,
    requestId: open.requestId,
    instructionText: input.text,
  });
}

/**
 * A voicenote from an approver. Transcription costs money and Telegram retries
 * a slow webhook, so nothing is transcribed here: the file id is handed to the
 * background task and this returns immediately.
 */
async function handleVoiceMessage(
  update: TelegramMessageUpdate,
  voiceFileId: string,
  approverId: string,
): Promise<Response> {
  const message = update.message;

  let open: OpenSuggestChangeRequest | null;
  try {
    open = await getOpenSuggestChangeRequest(message.chat.id);
  } catch (error) {
    // The same refusal `arbitrateTypedText` makes, for the same reason: with
    // the request unreadable there is no safe action left to take.
    //
    // Enqueueing anyway is the tempting answer and the dangerous one. The task
    // treats a missing request id as "bind to whatever is newest and awaiting
    // in this chat", and a second ✏️ tap inside the enqueue-to-dequeue window
    // makes that a DIFFERENT customer — Luke's spoken instructions, prices and
    // all, land on their draft. `enqueueRedraft` requires a real request id
    // precisely so this branch cannot fabricate one.
    //
    // So bind nothing, write nothing, enqueue nothing, and say so. Silence is
    // the specific failure to avoid: Luke has just talked into his phone and
    // would otherwise assume the draft was revised, then approve the untouched
    // one believing it carries his changes.
    console.error(
      "Failed to read the open suggest-change request for a voicenote",
      error,
    );
    try {
      await sendTelegramMessage({
        chatId: message.chat.id,
        replyToMessageId: message.message_id,
        text: "⚠️ I couldn't check what state your draft is in, so I did nothing with that voicenote. It was not applied to any draft and nothing was sent to anyone. Send it again in a moment and it'll land normally.",
      });
    } catch (notifyError) {
      console.error(
        "Failed to report the suggest-change lookup failure",
        notifyError,
      );
    }
    // Still 200: Telegram retries non-2xx indefinitely, and a retry would only
    // hit the same unreadable state.
    return Response.json({ received: true, status: "request_state_unknown" });
  }

  if (!open || open.status !== "awaiting_instructions") {
    // Silence would be the worst answer here: Luke has just recorded himself
    // talking and would assume it landed.
    try {
      await sendTelegramMessage({
        chatId: message.chat.id,
        replyToMessageId: message.message_id,
        text:
          open?.status === "drafting"
            ? "🎙️ I'm still redrafting from your last note — the new card is on its way."
            : "🎙️ Nothing is waiting for changes right now, so I didn't do anything with that. Tap ✏️ Suggest changes on a card first, then send the voicenote.",
      });
    } catch (error) {
      console.error("Failed to report an unexpected voicenote", error);
    }
    return Response.json({ received: true, status: "no_open_request" });
  }

  return enqueueRedraft({
    update,
    approverId,
    requestId: open.requestId,
    voiceFileId,
  });
}

async function handleBareMessage(
  update: TelegramMessageUpdate,
  overrideText: string,
  approverId: string,
): Promise<Response> {
  const message = update.message;

  // Slash commands and one-or-two-character fragments are never override
  // material; ignore them silently.
  if (overrideText.startsWith("/") || overrideText.length <= 2) {
    return Response.json({ received: true, ignored: true });
  }

  // The open request is checked before anything else, so the override path
  // below is only ever reached when there is none. Kept AFTER the two guards
  // above: a slash command or a two-character fragment is not instruction
  // material either.
  const redraft = await arbitrateTypedText({
    update,
    approverId,
    text: overrideText,
  });
  if (redraft) return redraft;

  // Same guard, same reasoning as the reply path: nothing is staged, so nothing
  // can be confirmed into a customer's chat, and a retry would only re-run the
  // arbitration above against chat state that has since moved.
  let staged: Awaited<ReturnType<typeof stageInquiryOverride>>;
  try {
    staged = await stageInquiryOverride({
      telegramChatId: message.chat.id,
      overrideText,
      approverId,
      telegramUpdateId: update.update_id,
      sourceMessageId: message.message_id,
    });
  } catch (error) {
    console.error("Failed to stage the typed override", error);
    try {
      await sendTelegramMessage({
        chatId: message.chat.id,
        replyToMessageId: message.message_id,
        text: "⚠️ I couldn't pick that up, so nothing was staged and nothing was sent to anyone. Send it again in a moment.",
      });
    } catch (notifyError) {
      console.error("Failed to report the override stage failure", notifyError);
    }
    return Response.json({ received: true, status: "override_stage_failed" });
  }

  if (!staged.staged) {
    if (staged.duplicate) {
      return Response.json({ received: true, duplicate: true });
    }
    try {
      await sendTelegramMessage({
        chatId: message.chat.id,
        replyToMessageId: message.message_id,
        text: "Nothing is awaiting review right now, so I didn't do anything with that. Reply to a specific card if you meant an older draft.",
      });
    } catch (error) {
      console.error("Failed to report empty override queue", error);
    }
    return Response.json({ received: true, status: "no_pending" });
  }

  // A newer typed message supersedes any confirm prompt still waiting.
  for (const prompt of staged.supersededPrompts) {
    if (!prompt.promptMessageId) continue;
    try {
      await editTelegramReview({
        chatId: message.chat.id,
        messageId: prompt.promptMessageId,
        text: "⌛ Superseded by your newer message\n\nNothing was sent.",
      });
    } catch (error) {
      console.error("Failed to close superseded override prompt", error);
    }
  }

  try {
    const prompt = await sendTelegramOverrideConfirm({
      confirmId: staged.confirmId,
      targetName: staged.targetName,
      overrideText,
      chatId: message.chat.id,
      replyToMessageId: message.message_id,
    });
    await attachOverrideConfirmationPrompt({
      confirmId: staged.confirmId,
      promptMessageId: prompt.messageId,
    });
  } catch (error) {
    // Telegram has already deduped this update, so a retry will not re-stage;
    // without feedback the typed override would vanish silently. Best-effort
    // tell Luke to fall back to a direct reply on the card.
    console.error("Failed to send override confirm prompt", error);
    try {
      await sendTelegramMessage({
        chatId: message.chat.id,
        replyToMessageId: message.message_id,
        text: "I couldn't show the Send/Cancel buttons for this. Nothing was sent — reply directly to the review card with your text to send it.",
      });
    } catch (notifyError) {
      console.error("Failed to report confirm prompt failure", notifyError);
    }
  }

  return Response.json({ received: true, status: "override_staged" });
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
  const updateId = parsed.data.update_id;
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

  const action = parseTelegramCallback(query.data);
  if (!action) {
    await answerTelegramCallback({
      callbackQueryId: query.id,
      text: "This approval action is invalid.",
      showAlert: true,
    });
    return Response.json({ error: "Invalid callback data" }, { status: 400 });
  }

  const cardMessageId = query.message.message_id;

  switch (action.kind) {
    case "approval": {
      const result = await decideInquiryApproval({
        approvalId: action.approvalId,
        decision: action.decision === "approve" ? "approve" : "reject",
        approverId,
        telegramUpdateId: updateId,
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
          text: "Dismissed. Nothing was sent.",
        });
        try {
          await editTelegramReview({
            chatId: configuredChatId,
            messageId: cardMessageId,
            text: "🚫 Dismissed\n\nNothing was sent to WhatsApp.\n\nType a message (or reply to this card) with what I should have said and I'll send your version instead — and learn from it.",
          });
        } catch (error) {
          console.error("Failed to update dismissed Telegram review", error);
        }
        return Response.json({ received: true, status: "dismissed" });
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

      dispatchOutboxAfter(result.outboxId, () =>
        triggerApprovedResponse(action.approvalId),
      );

      try {
        await editTelegramReview({
          chatId: configuredChatId,
          messageId: cardMessageId,
          text: "✅ Approved\n\nSending to WhatsApp now…",
        });
      } catch (error) {
        console.error("Failed to update approved Telegram review", error);
      }

      return Response.json({ received: true, status: "approved" });
    }

    case "availability": {
      const result = await answerInquiryAvailability({
        checkId: action.checkId,
        availability: action.availability,
        approverId,
        telegramUpdateId: updateId,
      });

      if (result.duplicate) {
        await answerTelegramCallback({
          callbackQueryId: query.id,
          text: "This availability question was already answered.",
        });
        return Response.json({ received: true, duplicate: true });
      }

      if (!result.applied || !result.outboxId || !result.conversationId) {
        await answerTelegramCallback({
          callbackQueryId: query.id,
          text: `This availability question is ${result.status ?? "missing"}.`,
          showAlert: true,
        });
        return Response.json({ received: true, status: result.status });
      }

      await answerTelegramCallback({
        callbackQueryId: query.id,
        text: "Got it — drafting the reply now.",
      });

      const conversationId = result.conversationId;
      dispatchOutboxAfter(result.outboxId, () =>
        triggerAvailabilityResume(conversationId),
      );

      const dateSuffix = result.eventDateText
        ? ` on ${result.eventDateText}`
        : "";
      try {
        await editTelegramReview({
          chatId: configuredChatId,
          messageId: cardMessageId,
          text:
            action.availability === "available"
              ? `✅ Available${dateSuffix}\n\nDrafting the reply now — the review card lands here shortly.`
              : `❌ Not available${dateSuffix}\n\nDrafting a polite decline — you'll approve it before anything sends.`,
        });
      } catch (error) {
        console.error("Failed to update availability question card", error);
      }

      return Response.json({ received: true, status: "answered" });
    }

    case "lead_availability": {
      const result = await decideWebsiteLeadAvailability({
        leadId: action.leadId,
        availability: action.availability,
        approverId,
        telegramUpdateId: updateId,
      });

      if (result.duplicate) {
        await answerTelegramCallback({
          callbackQueryId: query.id,
          text: "This lead was already handled.",
        });
        return Response.json({ received: true, duplicate: true });
      }

      if (!result.applied || !result.outboxId) {
        await answerTelegramCallback({
          callbackQueryId: query.id,
          text: `This lead is ${result.status ?? "missing"}.`,
          showAlert: true,
        });
        return Response.json({ received: true, status: result.status });
      }

      await answerTelegramCallback({
        callbackQueryId: query.id,
        text:
          action.availability === "available"
            ? "Marked available — drafting the reply."
            : "Marked unavailable — drafting a polite decline.",
      });

      dispatchOutboxAfter(result.outboxId, () =>
        triggerWebsiteLeadDraft(action.leadId),
      );

      // Keep the alert text intact; just retire the availability buttons,
      // leaving the plain wa.me shortcut in place.
      try {
        await editTelegramReplyMarkup({
          chatId: configuredChatId,
          messageId: cardMessageId,
          replyMarkup: {
            inline_keyboard: result.whatsappDigits
              ? [
                  [
                    {
                      text: `Message ${result.firstName ?? "them"} on WhatsApp`,
                      url: `https://wa.me/${result.whatsappDigits}`,
                    },
                  ],
                ]
              : [],
          },
        });
      } catch (error) {
        console.error("Failed to update lead alert buttons", error);
      }

      return Response.json({ received: true, status: "drafting" });
    }

    case "lead_review": {
      const result = await decideWebsiteLeadDraft({
        leadId: action.leadId,
        decision: action.decision,
        approverId,
        telegramUpdateId: updateId,
      });

      if (result.duplicate || !result.applied) {
        // A re-tap on an already-approved draft repaints the tap-to-send
        // button — the earlier card edit may have died before it rendered.
        if (result.status === "approved" && result.reply) {
          await answerTelegramCallback({
            callbackQueryId: query.id,
            text: "Already approved — button refreshed.",
          });
          try {
            await editTelegramReview({
              chatId: configuredChatId,
              messageId: cardMessageId,
              ...buildApprovedLeadCard({
                firstName: result.firstName ?? "them",
                reply: result.reply,
                whatsappDigits: result.whatsappDigits ?? null,
              }),
            });
          } catch (error) {
            console.error("Failed to repaint approved lead review", error);
          }
          return Response.json({ received: true, status: "approved" });
        }

        await answerTelegramCallback({
          callbackQueryId: query.id,
          text: `This draft was already handled (${result.status ?? "missing"}).`,
          showAlert: !result.duplicate,
        });
        return Response.json({
          received: true,
          duplicate: result.duplicate,
          status: result.status,
        });
      }

      if (result.status === "dismissed") {
        await answerTelegramCallback({
          callbackQueryId: query.id,
          text: "Dismissed. Nothing was sent.",
        });
        try {
          await editTelegramReview({
            chatId: configuredChatId,
            messageId: cardMessageId,
            text: "🚫 Dismissed\n\nNothing was sent. Message them manually if the enquiry still matters.",
          });
        } catch (error) {
          console.error("Failed to update dismissed lead review", error);
        }
        return Response.json({ received: true, status: "dismissed" });
      }

      await answerTelegramCallback({
        callbackQueryId: query.id,
        text: "Approved — tap the button to send it.",
      });

      try {
        await editTelegramReview({
          chatId: configuredChatId,
          messageId: cardMessageId,
          ...buildApprovedLeadCard({
            firstName: result.firstName ?? "them",
            reply: result.reply ?? "",
            whatsappDigits: result.whatsappDigits ?? null,
          }),
        });
      } catch (error) {
        console.error("Failed to update approved lead review", error);
      }

      return Response.json({ received: true, status: "approved" });
    }

    case "suggest_changes": {
      const result = await openSuggestChangeRequest({
        targetKind: action.target,
        targetId:
          action.target === "approval" ? action.approvalId : action.leadId,
        telegramChatId: query.message.chat.id,
        requestedBy: approverId,
        telegramUpdateId: updateId,
      });

      if (!result.opened) {
        await answerTelegramCallback({
          callbackQueryId: query.id,
          text:
            result.reason === "duplicate"
              ? "This tap was already handled."
              : result.reason === "no_draft"
                ? "There is no draft on this card to revise."
                : "This draft can't be revised any more — it was already sent, dismissed, or it expired.",
          showAlert: !result.duplicate,
        });
        return Response.json({
          received: true,
          duplicate: result.duplicate,
          status: result.reason,
        });
      }

      await answerTelegramCallback({
        callbackQueryId: query.id,
        text: "Send me a voicenote with the changes.",
      });

      // Only one request per chat may await instructions, or a bare voicenote
      // would be ambiguous. Opening this one cancelled the rest; close their
      // prompts the same way a newer typed override closes its confirm prompts.
      for (const prompt of result.supersededPrompts) {
        if (!prompt.promptMessageId) continue;
        try {
          await editTelegramReview({
            chatId: configuredChatId,
            messageId: prompt.promptMessageId,
            text: "⌛ Superseded\n\nYou asked to change a different draft. Nothing here was changed.",
          });
        } catch (error) {
          console.error("Failed to close superseded suggest-change prompt", error);
        }
      }

      try {
        const prompt = await sendTelegramSuggestChangesPrompt({
          requestId: result.requestId,
          targetName: result.targetName,
          currentDraft: result.currentDraft,
          chatId: query.message.chat.id,
          replyToMessageId: cardMessageId,
        });
        await attachSuggestChangePrompt({
          requestId: result.requestId,
          promptMessageId: prompt.messageId,
        });
      } catch (error) {
        // The request is open regardless, so a voicenote would still bind. The
        // missing piece is only the prompt, so say so rather than leave Luke
        // waiting for a message that never arrives.
        console.error("Failed to send the suggest-changes prompt", error);
        try {
          await sendTelegramMessage({
            chatId: query.message.chat.id,
            replyToMessageId: cardMessageId,
            text: "✏️ Ready for your changes — send a voicenote (or type them) describing what you want different.",
          });
        } catch (notifyError) {
          console.error("Failed to report the prompt failure", notifyError);
        }
      }

      return Response.json({
        received: true,
        status: "awaiting_instructions",
        requestId: result.requestId,
      });
    }

    case "suggest_changes_cancel": {
      const cancelled = await cancelSuggestChangeRequest({
        requestId: action.requestId,
        requestedBy: approverId,
        telegramUpdateId: updateId,
      });

      await answerTelegramCallback({
        callbackQueryId: query.id,
        text: cancelled.cancelled
          ? "Cancelled. The draft is unchanged."
          : "This request was already handled.",
      });

      if (cancelled.cancelled) {
        try {
          await editTelegramReview({
            chatId: configuredChatId,
            messageId: cardMessageId,
            text: "🚫 Cancelled\n\nNothing was changed. The review card above still holds the current draft.",
          });
        } catch (error) {
          console.error("Failed to update cancelled suggest-change prompt", error);
        }
      }

      return Response.json({
        received: true,
        duplicate: cancelled.duplicate,
        status: cancelled.status,
      });
    }

    case "override_confirm": {
      if (action.decision === "cancel") {
        const cancelled = await cancelInquiryOverride({
          confirmId: action.confirmId,
          approverId,
          telegramUpdateId: updateId,
        });

        await answerTelegramCallback({
          callbackQueryId: query.id,
          text: cancelled.applied
            ? "Cancelled. Nothing was sent."
            : "This override was already handled.",
        });

        if (cancelled.applied) {
          try {
            await editTelegramReview({
              chatId: configuredChatId,
              messageId: cardMessageId,
              text: "🚫 Cancelled\n\nNothing was sent.",
            });
          } catch (error) {
            console.error("Failed to update cancelled override prompt", error);
          }
        }

        return Response.json({ received: true, status: cancelled.status });
      }

      const result = await confirmInquiryOverride({
        confirmId: action.confirmId,
        approverId,
        telegramUpdateId: updateId,
      });

      if (result.duplicate) {
        await answerTelegramCallback({
          callbackQueryId: query.id,
          text: "This override was already handled.",
        });
        return Response.json({ received: true, duplicate: true });
      }

      if (!result.applied) {
        await answerTelegramCallback({
          callbackQueryId: query.id,
          text: `Can't send this — the draft is already ${result.status ?? "gone"}.`,
          showAlert: true,
        });
        try {
          await editTelegramReview({
            chatId: configuredChatId,
            messageId: cardMessageId,
            text: `⚠️ Not sent\n\nThe draft this replaced is already ${result.status ?? "gone"}. If the enquiry still needs a reply, send it manually from WhatsApp.`,
          });
        } catch (error) {
          console.error("Failed to update stale override prompt", error);
        }
        return Response.json({ received: true, status: result.status });
      }

      if (result.targetKind === "website_lead") {
        await answerTelegramCallback({
          callbackQueryId: query.id,
          text: "Approved — tap the button to send it.",
        });

        // The confirm prompt becomes the tap-to-send card; the review card
        // above just records that Luke's version replaced the draft.
        try {
          await editTelegramReview({
            chatId: configuredChatId,
            messageId: cardMessageId,
            ...buildApprovedLeadCard({
              firstName: result.firstName ?? "them",
              reply: result.reply ?? result.overrideText ?? "",
              whatsappDigits: result.whatsappDigits ?? null,
            }),
          });
        } catch (error) {
          console.error("Failed to update confirmed override prompt", error);
        }

        if (result.targetCardChatId && result.targetCardMessageId) {
          try {
            await editTelegramReview({
              chatId: result.targetCardChatId,
              messageId: result.targetCardMessageId,
              text: `✍️ Overridden with your version — saved as a teaching example:\n\n${result.overrideText ?? ""}\n\nUse the button on the confirmation below to send it.`,
            });
          } catch (error) {
            console.error("Failed to update overridden lead review", error);
          }
        }

        return Response.json({ received: true, status: "override_approved" });
      }

      await answerTelegramCallback({
        callbackQueryId: query.id,
        text: "Sending your version to WhatsApp.",
      });

      if (result.outboxId && result.approvalId) {
        const approvalId = result.approvalId;
        dispatchOutboxAfter(result.outboxId, () =>
          triggerApprovedResponse(approvalId),
        );
      }

      try {
        await editTelegramReview({
          chatId: configuredChatId,
          messageId: cardMessageId,
          text: `✍️ Override confirmed\n\nSending Luke's version now — saved as a teaching example:\n\n${result.overrideText ?? ""}`,
        });
      } catch (error) {
        console.error("Failed to update confirmed override prompt", error);
      }

      if (result.targetCardChatId && result.targetCardMessageId) {
        try {
          await editTelegramReview({
            chatId: result.targetCardChatId,
            messageId: result.targetCardMessageId,
            text: `✍️ Override received\n\nSending Luke's version now — saved as a teaching example:\n\n${result.overrideText ?? ""}`,
          });
        } catch (error) {
          console.error("Failed to update overridden review card", error);
        }
      }

      return Response.json({ received: true, status: "override_approved" });
    }
  }
}
