"use client";

import { useRouter } from "next/navigation";

import { mergePeople } from "@/app/admin/(app)/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { Field } from "@/components/admin/fields";
import { adminPath } from "@/lib/admin/paths";

export function MergeForm({ keepId }: { keepId?: string }) {
  const router = useRouter();
  return (
    <ActionForm
      action={mergePeople}
      submitLabel="Merge"
      onSuccess={(result) => {
        if (result.id) router.push(adminPath(`/contacts/${result.id}`));
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="keep" label="Keep (contact id)" defaultValue={keepId} placeholder="Paste the id to keep" isRequired description="Copy from the contact page URL." />
        <Field name="drop" label="Fold in (contact id)" placeholder="Paste the duplicate's id" isRequired description="This row is deleted after its data moves." />
      </div>
    </ActionForm>
  );
}
