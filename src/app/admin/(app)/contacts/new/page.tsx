import { PersonForm } from "@/components/admin/PersonForm";
import { PageHeader, Panel } from "@/components/admin/ui";

export const metadata = { title: "New contact" };

export default function NewContactPage() {
  return (
    <>
      <PageHeader eyebrow="CRM" title="Add a contact" description="For people who reached you outside the website or WhatsApp, or enquiries that were missed." />
      <Panel>
        <PersonForm />
      </Panel>
    </>
  );
}
