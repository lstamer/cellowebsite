import { tasks } from "@trigger.dev/sdk";

import type {
  processInquiryConversation,
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
