import { PersonForm } from "@/components/admin/PersonForm";
import { PageHeader, Panel } from "@/components/admin/ui";

export const metadata = { title: "New contact" };

export default function NewContactPage() {
  return (
    <>
      <PageHeader eyebrow="CRM" title="Add a contact" description="For people who reached Luke by phone, email or in person. A later form or WhatsApp message from the same number or email links to this row automatically." />
      <Panel>
        <PersonForm />
      </Panel>
    </>
  );
}
