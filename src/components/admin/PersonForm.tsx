"use client";

import { useRouter } from "next/navigation";

import { savePerson } from "@/app/admin/(app)/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { AreaField, Field, SelectField } from "@/components/admin/fields";
import { adminPath } from "@/lib/admin/paths";
import type { PersonRow } from "@/lib/admin/queries";

const STAGES = ["new", "contacted", "quoted", "booked", "played", "lost"].map((value) => ({ value, label: value }));

export function PersonForm({ person }: { person?: PersonRow }) {
  const router = useRouter();
  return (
    <ActionForm
      action={savePerson}
      submitLabel={person ? "Save contact" : "Create contact"}
      onSuccess={(result) => {
        if (!person && result.id) router.push(adminPath(`/contacts/${result.id}`));
      }}
    >
      {person ? <input type="hidden" name="id" value={person.id} /> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="display_name" label="Name" defaultValue={person?.display_name} />
        <SelectField name="stage" label="Stage" options={STAGES} defaultValue={person?.stage ?? "new"} placeholder="Stage" />
        <Field name="email" label="Email" type="email" defaultValue={person?.email} />
        <Field name="phone" label="Phone" defaultValue={person?.phone_e164} description="Any format; normalised to +27… on save." />
        <Field name="source" label="Source" defaultValue={person?.source} placeholder="referral, instagram, cavendish…" />
        <Field name="tags" label="Tags" defaultValue={person?.tags.join(", ")} placeholder="wedding, planner, repeat" description="Comma-separated." />
      </div>
      <AreaField name="notes" label="Notes" defaultValue={person?.notes} className="mt-4" rows={5} />
    </ActionForm>
  );
}
