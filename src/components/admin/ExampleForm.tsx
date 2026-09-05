"use client";

import { useRouter } from "next/navigation";

import { saveReplyExample } from "@/app/admin/(app)/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { AreaField, CheckField, Field, SelectField } from "@/components/admin/fields";
import type { ReplyExampleRow } from "@/lib/admin/queries";

const KINDS = [
  { value: "manual", label: "manual (voice example)" },
  { value: "past_chat", label: "past chat (voice example)" },
  { value: "override", label: "override (learned correction)" },
];

export function ExampleForm({ example }: { example?: ReplyExampleRow }) {
  const router = useRouter();
  return (
    <ActionForm action={saveReplyExample} submitLabel={example ? "Save example" : "Add example"} onSuccess={() => router.refresh()}>
      {example ? <input type="hidden" name="id" value={example.id} /> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField name="kind" label="Kind" options={KINDS} defaultValue={example?.kind ?? "manual"} placeholder="Kind" />
        <Field name="intents" label="Intents" defaultValue={example?.intents.join(", ")} placeholder="availability, pricing, event_details" description="Comma-separated. Retrieval matches any of these." />
      </div>
      <AreaField name="customer_message" label="Customer wrote" defaultValue={example?.customer_message} rows={3} className="mt-4" isRequired />
      <Field name="situation_summary" label="Situation (optional)" defaultValue={example?.situation_summary} className="mt-4" />
      <AreaField name="rejected_draft" label="Rejected draft (optional, for corrections)" defaultValue={example?.rejected_draft} rows={3} className="mt-4" />
      <AreaField name="reply" label="Luke's reply" defaultValue={example?.reply} rows={4} className="mt-4" isRequired />
      <CheckField name="active" label="Active" defaultSelected={example ? example.active : true} className="mt-3" />
    </ActionForm>
  );
}
