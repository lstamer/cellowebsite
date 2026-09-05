import Link from "next/link";
import { notFound } from "next/navigation";

import { PersonArchiveForm, PersonEditForm, PersonMergeForm } from "@/app/admin/(app)/contacts/PersonForms";
import { Badge, Card, DefinitionList, LinkButton, PageHeader, Timeline, formatDateTime, humanise, statusTone } from "@/components/admin/ui";
import { getAdminBasePath } from "@/lib/admin/auth";
import { getPerson, listAuditForRow, listContactsForPerson, listConversationsForContact, listWebsiteLeadsForPerson } from "@/lib/admin/queries";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = await getAdminBasePath();
  const person = await getPerson(id);
  if (!person) notFound();

  const [leads, contacts, audit] = await Promise.all([
    listWebsiteLeadsForPerson(person.id),
    listContactsForPerson(person.id),
    listAuditForRow("inquiry_people", person.id),
  ]);
  const conversations = (await Promise.all(contacts.map((contact) => listConversationsForContact(contact.id)))).flat();

  const timeline = [
    ...leads.map((lead) => ({
      id: lead.id,
      at: lead.created_at,
      title: `Website enquiry: ${lead.event_type ?? "unspecified"}${lead.event_date_text ? `, ${lead.event_date_text}` : ""}`,
      body: <Link href={`${base}/inquiries/${lead.id}`} className="underline underline-offset-4 hover:text-accent">Open enquiry</Link>,
      tone: "info" as const,
    })),
    ...conversations.map((conversation) => ({
      id: conversation.id,
      at: conversation.last_inbound_at ?? conversation.created_at,
      title: `WhatsApp conversation (${humanise(conversation.state)})`,
      body: <Link href={`${base}/conversations/${conversation.id}`} className="underline underline-offset-4 hover:text-accent">Open thread</Link>,
      tone: "success" as const,
    })),
    ...audit.map((row) => ({
      id: row.id,
      at: row.created_at,
      title: `${row.actor}: ${row.action === "merge" ? row.note ?? "merged a duplicate" : `${row.action} ${Object.keys(row.after ?? {}).join(", ")}`}`,
    })),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title={person.display_name ?? person.email ?? person.phone_e164 ?? "Unnamed"}
        description={[person.phone_e164, person.email].filter(Boolean).join(" · ")}
        actions={
          <>
            <Badge tone={statusTone(person.stage)}>{humanise(person.stage)}</Badge>
            {person.archived_at ? <Badge tone="neutral">Archived</Badge> : null}
            {person.phone_e164 ? (
              <LinkButton href={`https://wa.me/${person.phone_e164.replace(/\D/g, "")}`} external variant="primary">
                WhatsApp
              </LinkButton>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Edit" eyebrow="Correct the record">
            <PersonEditForm person={person} />
          </Card>
          <Card title="History" eyebrow="Enquiries, threads and edits">
            <Timeline items={timeline} />
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Summary">
            <DefinitionList
              items={[
                { label: "Contact id", value: <code className="font-jakarta text-xs">{person.id}</code> },
                { label: "Source", value: person.source },
                { label: "Tags", value: person.tags.join(", ") || null },
                { label: "Created", value: formatDateTime(person.created_at) },
                { label: "Updated", value: formatDateTime(person.updated_at) },
                { label: "WhatsApp identities", value: contacts.length ? contacts.map((c) => c.whatsapp_username ?? c.phone_e164 ?? c.id).join(", ") : null },
              ]}
            />
          </Card>
          <Card title="Merge duplicates" eyebrow="Keep this one">
            <p className="mb-3 font-sans text-sm text-foreground/70">Paste the id of a duplicate contact. Its enquiries and threads move here, empty fields are filled from it, and it is deleted.</p>
            <PersonMergeForm person={person} />
          </Card>
          <Card title="Archive">
            <PersonArchiveForm person={person} />
          </Card>
        </div>
      </div>
    </>
  );
}
