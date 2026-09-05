"use client";

import { useActionState } from "react";

import {
  resetPromptToDefaultAction,
  restoreBrainDocVersionAction,
  restorePromptVersionAction,
  saveBrainDocAction,
  savePromptTemplateAction,
  saveReplyExampleAction,
  sendTelegramTestAction,
  toggleReplyExampleAction,
} from "@/app/admin/(app)/settings/actions";
import { ActionForm, Field, SelectField, SubmitButton, SwitchField, TextAreaField, idleAction } from "@/components/admin/controls";
import type { BrainDoc, PromptTemplateRow, ReplyExample } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS = ["identity", "services", "pricing", "logistics", "repertoire", "faq", "general"].map((value) => ({ value, label: value }));
const INTENT_OPTIONS = [
  "availability",
  "pricing",
  "booking_process",
  "event_details",
  "repertoire",
  "media_request",
  "technical_requirements",
  "referral",
  "other",
];

export function BrainDocForm({ doc }: { doc?: BrainDoc }) {
  return (
    <ActionForm action={saveBrainDocAction} submitLabel={doc ? "Save new version" : "Create document"}>
      {doc ? <input type="hidden" name="slug" value={doc.slug} /> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field name="title" label="Title" defaultValue={doc?.title} required className="sm:col-span-2" />
        <SelectField name="category" label="Category" options={CATEGORY_OPTIONS} defaultValue={doc?.category ?? "general"} />
        <Field name="sort_order" label="Sort order" type="number" defaultValue={String(doc?.sort_order ?? 100)} hint="Lower appears earlier in the prompt" />
        <div className="flex items-end pb-2 sm:col-span-2">
          <SwitchField name="active" label="Included in prompts" defaultSelected={doc?.active ?? true} />
        </div>
      </div>
      <TextAreaField name="content" label="Content" defaultValue={doc?.content} rows={16} mono required hint="Plain text or light markdown. No em dashes." />
    </ActionForm>
  );
}

export function RestoreBrainDocForm({ slug, version }: { slug: string; version: number }) {
  return (
    <ActionForm action={restoreBrainDocVersionAction} inline submitVariant="ghost" submitLabel={`Restore v${version}`} confirm={`Restore version ${version}? It becomes a new version on top.`}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="version" value={version} />
    </ActionForm>
  );
}

export function ReplyExampleForm({ example }: { example?: ReplyExample }) {
  return (
    <ActionForm action={saveReplyExampleAction} submitLabel={example ? "Save" : "Add example"}>
      {example ? <input type="hidden" name="id" value={example.id} /> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          name="kind"
          label="Kind"
          defaultValue={example?.kind ?? "manual"}
          options={[
            { value: "manual", label: "Manual voice example" },
            { value: "override", label: "Correction (what should have been sent)" },
            { value: "past_chat", label: "Past chat" },
          ]}
        />
        <div className="flex items-end pb-2">
          <SwitchField name="active" label="Used by the drafter" defaultSelected={example?.active ?? true} />
        </div>
      </div>
      <fieldset>
        <legend className="mb-1.5 block font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">Applies to intents</legend>
        <div className="flex flex-wrap gap-2">
          {INTENT_OPTIONS.map((intent) => (
            <label key={intent} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-foreground/15 px-[0.8em] py-[0.35em] font-sans text-sm has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-on-dark">
              <input type="checkbox" name="intents" value={intent} defaultChecked={example?.intents.includes(intent)} className="sr-only" />
              {intent.replace(/_/g, " ")}
            </label>
          ))}
        </div>
      </fieldset>
      <TextAreaField name="customer_message" label="Customer message" defaultValue={example?.customer_message} rows={4} required />
      <TextAreaField name="situation_summary" label="Situation summary" defaultValue={example?.situation_summary} rows={2} hint="One line on what was going on, optional" />
      <TextAreaField name="rejected_draft" label="Rejected draft" defaultValue={example?.rejected_draft} rows={3} hint="For corrections: the draft that was wrong" />
      <TextAreaField name="reply" label="Reply in Luke's voice" defaultValue={example?.reply} rows={6} required />
    </ActionForm>
  );
}

export function ToggleExampleForm({ example }: { example: ReplyExample }) {
  return (
    <ActionForm action={toggleReplyExampleAction} inline submitVariant="ghost" submitLabel={example.active ? "Deactivate" : "Activate"}>
      <input type="hidden" name="id" value={example.id} />
      <input type="hidden" name="active" value={example.active ? "0" : "1"} />
    </ActionForm>
  );
}

export function PromptTemplateForm({ slug, row, defaultContent }: { slug: string; row: PromptTemplateRow | null; defaultContent: string }) {
  return (
    <ActionForm action={savePromptTemplateAction} submitLabel="Save new version">
      <input type="hidden" name="slug" value={slug} />
      <SwitchField name="active" label="Override the code default" defaultSelected={row?.active ?? true} />
      <TextAreaField name="content" label="Prompt" defaultValue={row?.content ?? defaultContent} rows={18} mono required />
      <Field name="note" label="Change note" placeholder="Why this changed, optional" />
    </ActionForm>
  );
}

export function RestorePromptForm({ slug, version }: { slug: string; version: number }) {
  return (
    <ActionForm action={restorePromptVersionAction} inline submitVariant="ghost" submitLabel={`Restore v${version}`} confirm={`Restore version ${version}? It becomes a new active version.`}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="version" value={version} />
    </ActionForm>
  );
}

export function ResetPromptForm({ slug }: { slug: string }) {
  return (
    <ActionForm action={resetPromptToDefaultAction} inline submitVariant="danger" submitLabel="Use code default" confirm="Switch this prompt back to the code default? Your versions are kept.">
      <input type="hidden" name="slug" value={slug} />
    </ActionForm>
  );
}

export function TelegramTestButton() {
  const [state, action, pending] = useActionState(sendTelegramTestAction, idleAction);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <SubmitButton variant="secondary" pending={pending}>
        Send a test message
      </SubmitButton>
      {state.message ? <p role="status" className={cn("font-sans text-sm", state.ok ? "text-primary" : "text-error")}>{state.message}</p> : null}
    </form>
  );
}
