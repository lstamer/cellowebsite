import { notFound } from "next/navigation";

import { BrainDocForm, RestoreBrainDocForm } from "@/app/admin/(app)/settings/SettingsForms";
import { Card, PageHeader, formatDateTime } from "@/components/admin/ui";
import { getBrainDoc, listBrainDocVersions } from "@/lib/admin/queries";

export default async function BrainDocEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === "new") {
    return (
      <>
        <PageHeader eyebrow="Brain docs" title="New document" description="The slug is derived from the title and cannot change later." />
        <Card className="max-w-4xl">
          <BrainDocForm />
        </Card>
      </>
    );
  }

  const doc = await getBrainDoc(slug);
  if (!doc) notFound();
  const versions = await listBrainDocVersions(slug);

  return (
    <>
      <PageHeader eyebrow="Brain docs" title={doc.title} description={`Version ${doc.version}${doc.updated_by ? `, last saved by ${doc.updated_by}` : ""}. Slug: ${doc.slug}`} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <BrainDocForm doc={doc} />
        </Card>
        <Card title="Versions" eyebrow="History">
          {versions.length === 0 ? (
            <p className="font-sans text-sm text-foreground/60">No saved versions yet. The first save from here starts the history.</p>
          ) : (
            <ul className="divide-y divide-foreground/5">
              {versions.map((version) => (
                <li key={version.version} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-sans text-sm font-semibold">v{version.version}</p>
                    {version.version !== doc.version ? <RestoreBrainDocForm slug={doc.slug} version={version.version} /> : <span className="font-sans text-xs text-foreground/50">current</span>}
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
    </>
  );
}
