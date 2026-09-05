"use client";

import { useRouter } from "next/navigation";

import { saveBrainDoc } from "@/app/admin/(app)/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { AreaField, CheckField, Field, SelectField } from "@/components/admin/fields";
import { adminPath } from "@/lib/admin/paths";
import type { BrainDocRow } from "@/lib/admin/queries";

const CATEGORIES = ["identity", "services", "pricing", "logistics", "repertoire", "faq", "general"].map((value) => ({ value, label: value }));

export function BrainDocForm({ doc }: { doc?: BrainDocRow }) {
  const router = useRouter();
  return (
    <ActionForm
      action={saveBrainDoc}
      submitLabel={doc ? "Save new version" : "Create document"}
      onSuccess={(result) => {
        if (!doc && result.id) router.push(adminPath(`/settings/brain/${result.id}`));
        else router.refresh();
      }}
    >
      {doc ? <input type="hidden" name="id" value={doc.id} /> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field name="title" label="Title" defaultValue={doc?.title} isRequired />
        <Field name="slug" label="Slug" defaultValue={doc?.slug} isRequired placeholder="pricing-policy" description="Lowercase letters, digits and hyphens." />
        <SelectField name="category" label="Category" options={CATEGORIES} defaultValue={doc?.category ?? "general"} placeholder="Category" />
        <Field name="sort_order" label="Order" type="number" defaultValue={doc?.sort_order ?? 100} description="Lower numbers are injected first." />
      </div>
      <AreaField name="content" label="Content" defaultValue={doc?.content} rows={14} className="mt-4" isRequired description="Plain text. Short declarative facts work best; the model quotes from here." />
      <CheckField name="active" label="Active (injected into drafts)" defaultSelected={doc ? doc.active : true} className="mt-3" />
    </ActionForm>
  );
}
