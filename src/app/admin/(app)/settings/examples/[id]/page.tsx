import { notFound } from "next/navigation";

import { ReplyExampleForm } from "@/app/admin/(app)/settings/SettingsForms";
import { Card, PageHeader } from "@/components/admin/ui";
import { getReplyExample } from "@/lib/admin/queries";

export default async function ReplyExampleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (id === "new") {
    return (
      <>
        <PageHeader eyebrow="Reply examples" title="Add an example" description="A real exchange in Luke's voice. Pick the intents it should influence." />
        <Card className="max-w-4xl">
          <ReplyExampleForm />
        </Card>
      </>
    );
  }

  const example = await getReplyExample(id);
  if (!example) notFound();

  return (
    <>
      <PageHeader eyebrow="Reply examples" title="Edit example" description={`Source: ${example.source}`} />
      <Card className="max-w-4xl">
        <ReplyExampleForm example={example} />
      </Card>
    </>
  );
}
