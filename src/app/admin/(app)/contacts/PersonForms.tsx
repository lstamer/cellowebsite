"use client";

import { archivePersonAction, createPersonAction, mergePersonAction, updatePersonAction } from "@/app/admin/(app)/contacts/actions";
import { ActionForm, Field, SelectField, TextAreaField } from "@/components/admin/controls";
import type { Person } from "@/lib/admin/queries";

const STAGE_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "booked", label: "Booked" },
  { value: "played", label: "Played" },
  { value: "lost", label: "Lost" },
];

function PersonFields({ person }: { person?: Person }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="display_name" label="Name" defaultValue={person?.display_name} className="sm:col-span-2" />
        <Field name="email" label="Email" type="email" defaultValue={person?.email} />
        <Field name="phone_e164" label="Phone / WhatsApp" type="tel" defaultValue={person?.phone_e164} hint="Full number with country code" />
        <SelectField name="stage" label="Stage" options={STAGE_OPTIONS} defaultValue={person?.stage ?? "new"} />
        <Field name="source" label="Source" defaultValue={person?.source} placeholder="referral, busking, website…" />
        <Field name="tags" label="Tags" defaultValue={person?.tags.join(", ")} hint="Comma separated" className="sm:col-span-2" />
      </div>
      <TextAreaField name="notes" label="Notes" defaultValue={person?.notes} rows={4} />
    </>
  );
}

export function PersonCreateForm() {
  return (
    <ActionForm action={createPersonAction} submitLabel="Create contact">
      <PersonFields />
    </ActionForm>
  );
}

export function PersonEditForm({ person }: { person: Person }) {
  return (
    <ActionForm action={updatePersonAction} submitLabel="Save changes">
      <input type="hidden" name="id" value={person.id} />
      <PersonFields person={person} />
    </ActionForm>
  );
}

export function PersonMergeForm({ person }: { person: Person }) {
  return (
    <ActionForm
      action={mergePersonAction}
      inline
      submitVariant="secondary"
      submitLabel="Merge into this contact"
      confirm="Merge the other contact into this one? Its enquiries and WhatsApp threads move here and the duplicate is deleted."
    >
      <input type="hidden" name="keep" value={person.id} />
      <Field name="drop" label="Duplicate contact id" placeholder="Paste the id of the duplicate" className="min-w-[18rem]" />
    </ActionForm>
  );
}

export function PersonArchiveForm({ person }: { person: Person }) {
  const restore = Boolean(person.archived_at);
  return (
    <ActionForm
      action={archivePersonAction}
      inline
      submitVariant={restore ? "secondary" : "danger"}
      submitLabel={restore ? "Restore contact" : "Archive contact"}
      confirm={restore ? undefined : "Archive this contact? It is hidden from lists but nothing is deleted."}
    >
      <input type="hidden" name="id" value={person.id} />
      {restore ? <input type="hidden" name="restore" value="1" /> : null}
    </ActionForm>
  );
}
