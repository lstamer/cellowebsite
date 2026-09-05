"use client";

import { sendAdminReplyAction } from "@/app/admin/(app)/conversations/[id]/actions";
import { ActionForm, TextAreaField } from "@/components/admin/controls";

export function ReplyForm({ conversationId }: { conversationId: string }) {
  return (
    <ActionForm
      action={sendAdminReplyAction}
      submitLabel="Send on WhatsApp"
      confirm="Send this message to the customer on WhatsApp now?"
    >
      <input type="hidden" name="conversation_id" value={conversationId} />
      <TextAreaField
        name="reply"
        label="Reply as Luke"
        rows={5}
        required
        hint="Sent exactly as written through Zernio. Separate bubbles with a line containing only ---."
      />
    </ActionForm>
  );
}
