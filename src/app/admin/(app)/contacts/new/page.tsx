import { PersonCreateForm } from "@/app/admin/(app)/contacts/PersonForms";
import { Card, PageHeader } from "@/components/admin/ui";

export default function NewContactPage() {
  return (
    <>
      <PageHeader eyebrow="CRM" title="Add a contact" description="For people who reached you outside the website or WhatsApp, or enquiries that were missed." />
      <Card className="max-w-3xl">
        <PersonCreateForm />
      </Card>
    </>
  );
}
