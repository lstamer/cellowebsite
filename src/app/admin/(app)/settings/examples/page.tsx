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
        description={`${active} active of ${examples.length}. Corrections (kind: override) are matched by intent and steer similar enquiries; voice examples teach rhythm, not facts.`}
      />

      <Panel title="Add an example" className="mb-6">
        <ExampleForm />
      </Panel>

      {examples.length === 0 ? (
        <Empty>No examples yet.</Empty>
      ) : (
        <ul className="flex flex-col gap-4">
          {examples.map((example) => (
            <li key={example.id} className="rounded-card border border-on-dark/10 bg-surface-dark p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Pill value={example.kind === "override" ? "warning" : "info"} label={example.kind.replace(/_/g, " ")} />
                <Pill value={example.active ? "ok" : "skipped"} label={example.active ? "active" : "off"} />
                {example.intents.map((intent) => (
                  <span key={intent} className="rounded-full border border-on-dark/20 px-[0.6em] py-[0.1em] font-jost text-xs text-on-dark/80">{intent}</span>
                ))}
                <span className="font-sans text-xs text-on-dark/50">{example.source} · {formatRelative(example.created_at)}</span>
                <span className="ml-auto">
                  <ActionButton action={toggleReplyExample} fields={{ id: example.id, active: example.active ? "0" : "1" }}>
                    {example.active ? "Deactivate" : "Activate"}
                  </ActionButton>
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="font-jost text-[0.6875rem] uppercase tracking-[0.16em] text-on-dark/50">Customer wrote</p>
                  <p className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-on-dark/85">{example.customer_message}</p>
                  {example.situation_summary ? <p className="mt-2 font-sans text-xs text-on-dark/60">Situation: {example.situation_summary}</p> : null}
                </div>
                <div>
                  <p className="font-jost text-[0.6875rem] uppercase tracking-[0.16em] text-on-dark/50">Luke {example.kind === "override" ? "sent instead" : "replied"}</p>
                  <p className="mt-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-on-dark/85">{example.reply}</p>
                  {example.rejected_draft ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-sans text-xs text-on-dark/60">Rejected draft</summary>
                      <p className="mt-1 whitespace-pre-wrap font-sans text-xs text-on-dark/60">{example.rejected_draft}</p>
                    </details>
                  ) : null}
                </div>
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer font-jost text-[0.6875rem] uppercase tracking-[0.16em] text-on-dark/50">Edit</summary>
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
