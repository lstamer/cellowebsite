import { BrainDocForm } from "@/components/admin/BrainDocForm";
import { PageHeader, Panel } from "@/components/admin/ui";

export const metadata = { title: "New knowledge document" };

export default function NewBrainDocPage() {
  return (
    <>
      <PageHeader eyebrow="Business knowledge" title="New document" description="Add a fact sheet the AI may quote from. It takes effect on the next draft." />
      <Panel>
        <BrainDocForm />
      </Panel>
    </>
  );
}
