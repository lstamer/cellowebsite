import { tasks } from "@trigger.dev/sdk";

import type {
  draftWebsiteLeadReplyTask,
  processInquiryConversation,
  processSuggestChange,
  sendApprovedInquiryResponse,
} from "../../../trigger/inquiries";

export async function triggerInquiryProcessing(
  conversationId: string,
): Promise<void> {
  await tasks.trigger<typeof processInquiryConversation>(
    "process-inquiry-conversation",
    { conversationId },
    {
      // Trailing debounce with no maxDelay: every new message pushes execution
      // out another 2 minutes, so a burst of any length is analysed as one
      // batch once the customer goes quiet.
      debounce: {
        key: conversationId,
        delay: "2m",
        mode: "trailing",
      },
      concurrencyKey: conversationId,
      maxAttempts: 3,
    },
  );
}

export async function triggerApprovedResponse(
  approvalId: string,
): Promise<void> {
  await tasks.trigger<typeof sendApprovedInquiryResponse>(
    "send-approved-inquiry-response",
    { approvalId },
    {
      concurrencyKey: approvalId,
      maxAttempts: 1,
    },
  );
}

export async function triggerWebsiteLeadDraft(leadId: string): Promise<void> {
  await tasks.trigger<typeof draftWebsiteLeadReplyTask>(
    "draft-website-lead-reply",
    { leadId },
    {
      concurrencyKey: leadId,
      maxAttempts: 3,
    },
  );
}

/**
 * Hand a voicenote (or typed notes) to the redraft task.
 *
 * Immediate and un-debounced: Luke is watching the chat waiting for the new
 * card. Keyed on the chat because that is what identifies the open request —
 * the instructions arrive as a bare message with no id attached to them.
 */
export async function triggerSuggestChangeRedraft(input: {
  requestId?: string;
  telegramChatId: number;
  telegramUpdateId: number;
  requestedBy: string;
  voiceFileId?: string;
  instructionText?: string;
}): Promise<void> {
  await tasks.trigger<typeof processSuggestChange>(
    "process-suggest-change",
    input,
    {
      concurrencyKey: String(input.telegramChatId),
      maxAttempts: 3,
    },
  );
}

// Immediate, no debounce: Luke already waited for his own availability answer,
// so the paused conversation resumes as soon as he taps.
export async function triggerAvailabilityResume(
  conversationId: string,
): Promise<void> {
  await tasks.trigger<typeof processInquiryConversation>(
    "process-inquiry-conversation",
    { conversationId },
    {
      concurrencyKey: conversationId,
      maxAttempts: 3,
    },
  );
}
