"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button, Input, Label, TextArea, TextField } from "react-aria-components";

import { resetTemplate, saveTemplate, type ActionResult } from "@/app/admin/(app)/actions";
import { inputClass, labelClass, SubmitButton } from "@/components/admin/fields";
import { formatDateTime, Panel, Pill } from "@/components/admin/ui";
import type { TemplateOverrideRow, TemplateVersionRow } from "@/lib/admin/queries";
import { renderTemplate, validateTemplateContent, type TemplateDefinition } from "@/lib/admin/templates";
import { cn } from "@/lib/utils";

const SAMPLE_VALUES: Record<string, string> = {
  source_label: "Booking form (/book)",
  name: "Thandi Nkosi",
  role: "Bride",
  event_type: "Wedding",
  event_date: "14 November 2026",
  location: "Babylonstoren, Franschhoek",
  email: "thandi@example.com",
  phone: "+27 82 123 4567",
  whatsapp: "+27 82 123 4567",
  contact_preference: "WhatsApp",
  guest_count: "120",
  performance: "60 min",
  message: "Ceremony and cocktails please.",
  reply_heading: "Proposed reply — this exact text will be sent:",
  proposed_reply: "Hi Thandi, thank you for thinking of me for the 14th. Babylonstoren is a favourite of mine 🙂 Let me check the date and come back to you shortly.",
  media_line: "",
  intents: "availability, event_details",
  lead_temperature: "warm",
  confidence: "86%",
  details: "Name: Thandi\nEvent: Wedding\nDate: 14 November 2026\nLocation: Babylonstoren\nSource: website",
  summary: "Bride asking about availability for a November wedding ceremony and cocktail hour.",
  transcript: "• Hi Luke! Are you free on 14 November for our wedding at Babylonstoren?",
  first_name: "Thandi",
  availability_line: "You marked this date: AVAILABLE ✅",
  draft: "Hi Thandi, lovely to hear from you. The 14th is free on my side and Babylonstoren is a favourite. Would you like music for the ceremony, the drinks, or both?",
  message_block: "Their message:\nCeremony and cocktails please.",
  date_line: "📅 Are you available on 14 November 2026?",
  who: "Thandi",
  context: "Wedding ceremony at Babylonstoren, around 120 guests.",
  window_hint: "WhatsApp's reply window closes Sat 18:40 — answer before then so the reply can still send.",
  target_name: "Thandi Nkosi",
  current_draft: "Hi Thandi, thank you for the enquiry…",
  revision: "2",
  media_lines: "",
  instructions: "\"Make it warmer and mention the ceremony set.\"",
  reply: "Hi Thandi, the 14th is free on my side. Shall I hold it for you?",
  truncated_note: "",
  availability_block: "- Never say a date is available, quote a price, promise a discount, or imply a calendar was checked unless it's clear from conversation history.\n- If availability is asked, say Luke (you) will check and let them know soon.",
  date_text: "14 November 2026",
  address_bullet: "- Write as Luke in first-person singular and address Thandi by name.",
  availability_bullet: "- Luke has personally confirmed he IS available on 14 November 2026. Say so plainly and warmly early in the message.",
};

export function TemplateEditor({
  definition,
  override,
  versions,
  backHref,
}: {
  definition: TemplateDefinition;
  override: TemplateOverrideRow | null;
  versions: TemplateVersionRow[];
  backHref: string;
}) {
  const router = useRouter();
  const initial = override?.active ? override.content : definition.defaultContent;
  const [content, setContent] = useState(initial);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  const validation = useMemo(() => validateTemplateContent(definition, content), [definition, content]);
  const preview = useMemo(() => {
    try {
      return renderTemplate(content, SAMPLE_VALUES);
    } catch {
      return "";
    }
  }, [content]);
  const dirty = content !== initial;
  const customised = Boolean(override?.active);

  function save() {
    const formData = new FormData();
    formData.set("slug", definition.slug);
    formData.set("content", content);
    formData.set("note", note);
    startTransition(async () => {
      const outcome = await saveTemplate(formData);
      setResult(outcome);
      if (outcome.ok) {
        setNote("");
        router.refresh();
      }
    });
  }

  function reset() {
    const formData = new FormData();
    formData.set("slug", definition.slug);
    startTransition(async () => {
      const outcome = await resetTemplate(formData);
      setResult(outcome);
      if (outcome.ok) {
        setContent(definition.defaultContent);
        router.refresh();
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-6">
        <Panel
          title="Template"
          actions={
            <span className="flex items-center gap-2">
              <Pill value={customised ? "warning" : "info"} label={customised ? `customised · v${override?.version}` : "built-in default"} />
              <Link href={backHref} className="font-jost text-xs uppercase tracking-[0.16em] text-foreground/60 hover:text-foreground">Back</Link>
            </span>
          }
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (validation.ok) save();
            }}
          >
            <TextField value={content} onChange={setContent} aria-label="Template content" className="flex flex-col gap-1.5">
              <Label className={labelClass}>Content</Label>
              <TextArea rows={Math.min(30, Math.max(8, content.split("\n").length + 2))} className={cn(inputClass, "min-h-0 py-3 font-mono text-sm leading-relaxed")} />
            </TextField>
            {!validation.ok ? <p role="alert" className="mt-2 font-sans text-sm text-accent">{validation.reason}</p> : null}
            <TextField value={note} onChange={setNote} className="mt-4 flex flex-col gap-1.5">
              <Label className={labelClass}>Change note (optional)</Label>
              <Input placeholder="Why this changed" className={inputClass} />
            </TextField>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <SubmitButton pending={pending}>{dirty ? "Save as new version" : "Saved"}</SubmitButton>
              {customised ? (
                <Button
                  onPress={reset}
                  isDisabled={pending}
                  className="inline-flex min-h-11 items-center rounded-full border border-foreground/15 px-[1.25em] py-[0.6em] font-sans text-sm text-foreground hover:border-foreground/40"
                >
                  Restore built-in default
                </Button>
              ) : null}
              {dirty ? (
                <Button onPress={() => setContent(initial)} className="font-sans text-sm text-foreground/60 underline-offset-4 hover:underline">
                  Discard edits
                </Button>
              ) : null}
              {result ? (
                <span role="status" className={cn("font-sans text-sm", result.ok ? "text-primary" : "text-accent")}>
                  {result.ok ? result.message : result.error}
                </span>
              ) : null}
            </div>
          </form>
        </Panel>

        <Panel title="Placeholders">
          {definition.placeholders.length === 0 ? (
            <p className="font-sans text-sm text-foreground/60">This template has no placeholders; it is inserted verbatim.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {definition.placeholders.map((placeholder) => (
                <li key={placeholder.name} className="rounded-input border border-foreground/10 bg-cream px-3 py-2">
                  <code className="font-mono text-sm text-primary">{`{{${placeholder.name}}}`}</code>
                  {placeholder.required ? <span className="ml-2 font-jost text-[0.6875rem] uppercase tracking-[0.14em] text-accent">required</span> : null}
                  <p className="mt-1 font-sans text-xs text-foreground/60">{placeholder.description}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="flex flex-col gap-6">
        <Panel title="Preview with sample data">
          <pre className="whitespace-pre-wrap rounded-input border border-foreground/10 bg-cream p-4 font-sans text-sm leading-relaxed text-foreground/85">{preview || "(empty)"}</pre>
          <p className="mt-2 font-sans text-xs text-foreground/50">Rendered exactly as the code renders it: lines whose placeholders are all empty are dropped, blank runs collapse.</p>
        </Panel>

        <Panel title="Version history">
          {versions.length === 0 ? (
            <p className="font-sans text-sm text-foreground/60">Never customised. The first save becomes version 1.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {versions.map((version) => (
                <li key={version.id} className="border-t border-foreground/10 pt-3 first:border-t-0 first:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-jost text-[0.6875rem] uppercase tracking-[0.16em] text-foreground/50">
                      v{version.version} · {formatDateTime(version.created_at)}{version.created_by ? ` · ${version.created_by}` : ""}
                    </span>
                    <Button
                      onPress={() => setContent(version.content)}
                      className="rounded-full border border-foreground/15 px-[0.9em] py-[0.3em] font-sans text-xs text-foreground hover:border-foreground/40"
                    >
                      Load into editor
                    </Button>
                  </div>
                  {version.note ? <p className="mt-1 font-sans text-sm text-foreground/70">{version.note}</p> : null}
                  <details className="mt-1">
                    <summary className="cursor-pointer font-sans text-xs text-foreground/60">Show content</summary>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-input bg-cream p-3 font-mono text-xs leading-relaxed text-foreground/70">{version.content}</pre>
                  </details>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 font-sans text-xs text-foreground/50">Rollback = load an older version and save it; that becomes the newest version and history is never rewritten.</p>
        </Panel>
      </div>
    </div>
  );
}
