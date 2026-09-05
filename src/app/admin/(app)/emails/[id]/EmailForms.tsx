"use client";

import { setEmailThreadAction } from "@/app/admin/(app)/emails/[id]/actions";
import { ActionForm } from "@/components/admin/controls";
import type { EmailThread } from "@/lib/admin/queries";

export function EmailThreadActions({ thread }: { thread: EmailThread }) {
  return (
    <div className="flex flex-wrap gap-2">
      {thread.classification !== "inquiry" ? (
        <ActionForm action={setEmailThreadAction} inline submitVariant="primary" submitLabel="Mark as enquiry">
          <input type="hidden" name="id" value={thread.id} />
          <input type="hidden" name="classification" value="inquiry" />
          <input type="hidden" name="status" value="new" />
        </ActionForm>
      ) : (
        <ActionForm action={setEmailThreadAction} inline submitVariant="secondary" submitLabel="Not an enquiry">
          <input type="hidden" name="id" value={thread.id} />
          <input type="hidden" name="classification" value="not_inquiry" />
        </ActionForm>
      )}
      {thread.status !== "dismissed" ? (
        <ActionForm action={setEmailThreadAction} inline submitVariant="danger" submitLabel="Dismiss" confirm="Dismiss this email thread?">
          <input type="hidden" name="id" value={thread.id} />
          <input type="hidden" name="status" value="dismissed" />
        </ActionForm>
      ) : (
        <ActionForm action={setEmailThreadAction} inline submitVariant="secondary" submitLabel="Reopen">
          <input type="hidden" name="id" value={thread.id} />
          <input type="hidden" name="status" value="new" />
        </ActionForm>
      )}
    </div>
  );
}
