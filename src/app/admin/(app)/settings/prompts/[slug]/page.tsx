import { notFound } from "next/navigation";

import { PromptTemplateForm, ResetPromptForm, RestorePromptForm } from "@/app/admin/(app)/settings/SettingsForms";
import { Badge, Card, PageHeader, Pre, formatDateTime } from "@/components/admin/ui";
import { getPromptTemplateRow, listPromptVersions } from "@/lib/admin/queries";
import { PROMPT_TEMPLATE_DEFAULTS, isPromptTemplateSlug } from "@/lib/inquiries/prompt-templates";

export default async function PromptEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isPromptTemplateSlug(slug)) notFound();

  const definition = PROMPT_TEMPLATE_DEFAULTS[slug];
  const [row, versions] = await Promise.all([getPromptTemplateRow(slug), listPromptVersions(slug)]);
  const overridden = Boolean(row?.active);

  return (
    <>
      <PageHeader
        eyebrow="Prompts"
        title={definition.title}
        description={definition.description}
        actions={
          <>
            <Badge tone={overridden ? "accent" : "neutral"}>{overridden ? `Custom v${row?.version} active` : "Code default active"}</Badge>
            {overridden ? <ResetPromptForm slug={slug} /> : null}
          </>
        }
      />
      {definition.requiredFragments?.length ? (
        <p className="mb-4 rounded-xl border border-accent/40 bg-background px-4 py-3 font-sans text-sm text-foreground/80">
          This prompt must keep {definition.requiredFragments.length} lines verbatim; the availability flow rewrites them at draft time. Saving without them is rejected.
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <PromptTemplateForm slug={slug} row={row} defaultContent={definition.content} />
        </Card>
        <div className="space-y-6">
          <Card title="Code default" eyebrow="What runs when no override is active">
            <Pre className="max-h-[20rem] overflow-auto text-xs">{definition.content}</Pre>
          </Card>
          <Card title="Versions" eyebrow="History">
            {versions.length === 0 ? (
              <p className="font-sans text-sm text-foreground/60">No saved versions yet.</p>
            ) : (
              <ul className="divide-y divide-foreground/5">
                {versions.map((version) => (
                  <li key={version.id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-sans text-sm font-semibold">v{version.version}{version.note ? <span className="ml-2 font-normal text-foreground/60">{version.note}</span> : null}</p>
                      {row && version.version === row.version ? <span className="font-sans text-xs text-foreground/50">current</span> : <RestorePromptForm slug={slug} version={version.version} />}
                    </div>
                    <p className="font-sans text-xs text-foreground/55">{formatDateTime(version.saved_at)}{version.saved_by ? ` · ${version.saved_by}` : ""}</p>
                    <details className="mt-1">
                      <summary className="cursor-pointer font-sans text-xs text-foreground/60">Show content</summary>
                      <pre className="mt-1 max-h-[16rem] overflow-auto whitespace-pre-wrap rounded-lg bg-cream p-3 font-jakarta text-xs text-foreground/80">{version.content}</pre>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
