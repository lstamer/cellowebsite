import { notFound } from "next/navigation";

import { BrainDocForm } from "@/components/admin/BrainDocForm";
import { Empty, formatDateTime, PageHeader, Panel } from "@/components/admin/ui";
import { getBrainDoc } from "@/lib/admin/queries";

export const metadata = { title: "Knowledge document" };

export default async function BrainDocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getBrainDoc(id);
  if (!result) notFound();
  const { doc, versions } = result;

  return (
    <>
      <PageHeader eyebrow="Business knowledge" title={doc.title} description={`${doc.category} · version ${doc.version} · ${doc.active ? "active" : "inactive"}`} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Edit">
          <BrainDocForm doc={doc} />
        </Panel>
        <Panel title="Version history">
          {versions.length === 0 ? (
            <Empty>No versions recorded before this migration. The next save creates one.</Empty>
          ) : (
            <ol className="flex flex-col gap-4">
              {versions.map((version) => (
                <li key={version.id} className="border-t border-on-dark/10 pt-3 first:border-t-0 first:pt-0">
                  <p className="font-jost text-[0.6875rem] uppercase tracking-[0.16em] text-on-dark/50">
                    v{version.version} · {formatDateTime(version.created_at)}{version.created_by ? ` · ${version.created_by}` : ""}
                  </p>
                  <details className="mt-1">
                    <summary className="cursor-pointer font-sans text-sm text-on-dark/80">{version.title} ({version.category}{version.active ? "" : ", inactive"})</summary>
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-input bg-surface-darker p-3 font-sans text-sm leading-relaxed text-on-dark/80">{version.content}</pre>
                    <p className="mt-2 font-sans text-xs text-on-dark/50">To roll back, paste this content into the editor and save; the history keeps every step.</p>
                  </details>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </>
  );
}
