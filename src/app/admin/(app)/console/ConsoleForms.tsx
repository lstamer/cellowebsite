"use client";

import { acknowledgeAllErrorsAction, acknowledgeEventAction, retryOutboxEventAction } from "@/app/admin/(app)/console/actions";
import { ActionForm } from "@/components/admin/controls";

export function AcknowledgeForm({ id }: { id: string }) {
  return (
    <ActionForm action={acknowledgeEventAction} inline submitVariant="ghost" submitLabel="Acknowledge">
      <input type="hidden" name="id" value={id} />
    </ActionForm>
  );
}

export function AcknowledgeAllForm() {
  return <ActionForm action={acknowledgeAllErrorsAction} inline submitVariant="secondary" submitLabel="Acknowledge all open" confirm="Mark every open warning and error as seen?" />;
}

export function RetryOutboxForm({ id }: { id: string }) {
  return (
    <ActionForm action={retryOutboxEventAction} inline submitVariant="secondary" submitLabel="Requeue">
      <input type="hidden" name="id" value={id} />
    </ActionForm>
  );
}
