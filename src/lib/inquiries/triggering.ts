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
      debounce: {
        key: conversationId,
        delay: "15s",
        maxDelay: "60s",
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
