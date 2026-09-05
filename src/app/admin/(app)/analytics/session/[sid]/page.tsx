import { notFound } from "next/navigation";

import { SessionPath } from "@/components/admin/SessionPath";
import { PageHeader, Panel } from "@/components/admin/ui";
import { getSessionPath } from "@/lib/admin/queries";

export const metadata = { title: "Session" };

export default async function SessionPage({ params }: { params: Promise<{ sid: string }> }) {
  const { sid } = await params;
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(sid)) notFound();
  const steps = await getSessionPath(sid);

  return (
    <>
      <PageHeader eyebrow="Visitor session" title="One path through the site" description={`Session ${sid}. Random per-tab id; no cookie, no IP, no person unless a form was submitted.`} />
      <Panel>
        <SessionPath steps={steps} sessionId={sid} />
      </Panel>
    </>
  );
}
