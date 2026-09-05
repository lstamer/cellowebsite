import { BrainDocForm } from "@/components/admin/BrainDocForm";
import { PageHeader, Panel } from "@/components/admin/ui";

export const metadata = { title: "New knowledge document" };

export default function NewBrainDocPage() {
  return (
    <>
      <PageHeader eyebrow="Brain docs" title="New document" description="A fact sheet the drafter may quote from. It takes effect on the next draft." />
      <Panel>
        <BrainDocForm />
      </Panel>
    </>
  );
}
