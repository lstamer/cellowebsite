import { ActionButton } from "@/components/admin/ActionButton";
import { ExampleForm } from "@/components/admin/ExampleForm";
import { Empty, formatRelative, PageHeader, Panel, Pill } from "@/components/admin/ui";
import { listReplyExamples } from "@/lib/admin/queries";

import { toggleReplyExample } from "../../actions";

export const metadata = { title: "Reply examples" };

export default async function ExamplesPage() {
  const examples = await listReplyExamples();
  const active = examples.filter((example) => example.active).length;

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Reply examples"
        description={`Retrieved by overlapping intents at draft time. Corrections are captured automatically when you reject a draft and type what should have been sent; add voice examples by hand here. ${active} active of ${examples.length}.`}
      />

      <Panel title="Add an example" className="mb-6">
        <ExampleForm />
      </Panel>

      {examples.length === 0 ? (
        <Empty>No examples yet.</Empty>
      ) : (
        <ul className="flex flex-col gap-4">
          {examples.map((example) => (
            <li key={example.id} className="rounded-card border border-foreground/10 bg-background p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Pill value={example.kind === "override" ? "warning" : "info"} label={example.kind.replace(/_/g, " ")} />
                <Pill value={example.active ? "ok" : "skipped"} label={example.active ? "active" : "off"} />
                {example.intents.map((intent) => (
                  <span key={intent} className="rounded-full border border-foreground/15 px-[0.6em] py-[0.1em] font-jost text-xs text-foreground/70">{intent}</span>
                ))}
                <span className="font-sans text-xs text-foreground/50">{example.source} · {formatRelative(example.created_at)}</span>
                <span className="ml-auto">
                  <ActionButton action={toggleReplyExample} fields={{ id: example.id, active: example.active ? "0" : "1" }}>
                    {example.active ? "Deactivate" : "Activate"}
                  </ActionButton>
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="font-jost text-[0.6875rem] uppercase tracking-[0.16em] text-foreground/50">Customer wrote</p>
                  <p className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/85">{example.customer_message}</p>
                  {example.situation_summary ? <p className="mt-2 font-sans text-xs text-foreground/60">Situation: {example.situation_summary}</p> : null}
                </div>
                <div>
                  <p className="font-jost text-[0.6875rem] uppercase tracking-[0.16em] text-foreground/50">Luke {example.kind === "override" ? "sent instead" : "replied"}</p>
                  <p className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/85">{example.reply}</p>
                  {example.rejected_draft ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-sans text-xs text-foreground/60">Rejected draft</summary>
                      <p className="mt-1 whitespace-pre-wrap font-sans text-xs text-foreground/60">{example.rejected_draft}</p>
                    </details>
                  ) : null}
                </div>
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer font-jost text-[0.6875rem] uppercase tracking-[0.16em] text-foreground/50">Edit</summary>
                <div className="mt-3">
                  <ExampleForm example={example} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
