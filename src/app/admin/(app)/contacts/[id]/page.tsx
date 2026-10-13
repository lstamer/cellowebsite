import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/admin/ActionButton";
import { MergeForm } from "@/components/admin/MergeForm";
import { PersonForm } from "@/components/admin/PersonForm";
import { Empty, formatDateTime, formatRelative, KeyValue, PageHeader, Panel, Pill } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";
import { getPersonBundle } from "@/lib/admin/queries";

import { archivePerson, setPersonStage } from "../../actions";

export const metadata = { title: "Contact" };

const STAGES = ["new", "contacted", "quoted", "booked", "played", "lost"] as const;

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getPersonBundle(id);
  if (!bundle) notFound();
  const { person, leads, contacts, audit } = bundle;
  const name = person.display_name ?? person.email ?? person.phone_e164 ?? "Unnamed contact";
  const waLink = person.phone_e164 ? `https://wa.me/${person.phone_e164.replace("+", "")}` : null;

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title={name}
        description={[person.email, person.phone_e164, person.source ? `via ${person.source.replace(/_/g, " ")}` : null].filter(Boolean).join(" · ")}
        actions={
          <>
            {waLink ? (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-whatsapp px-[1.25em] py-[0.6em] font-sans text-sm font-medium text-on-dark hover:bg-whatsapp/90">
                Open WhatsApp
              </a>
            ) : null}
            {person.email ? (
              <a href={`mailto:${person.email}`} className="inline-flex min-h-11 items-center rounded-full border border-foreground/15 px-[1.25em] py-[0.6em] font-sans text-sm text-foreground hover:border-foreground/40">
                Email
              </a>
            ) : null}
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Pill value={person.stage} />
        {person.archived_at ? <Pill value="lost" label="archived" /> : null}
        {person.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-foreground/15 px-[0.7em] py-[0.15em] font-jost text-xs text-foreground/70">
            {tag}
          </span>
        ))}
        <span className="font-sans text-sm text-foreground/60">Created {formatDateTime(person.created_at)}</span>
      </div>

      <Panel title="Stage" className="mb-6">
        <div className="flex flex-wrap gap-2">
          {STAGES.map((stage) => (
            <ActionButton
              key={stage}
              action={setPersonStage}
              fields={{ id: person.id, stage }}
              variant={person.stage === stage ? "primary" : "secondary"}
            >
              {stage}
            </ActionButton>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <Panel title="Website enquiries">
            {leads.length === 0 ? (
              <Empty>No form submissions from this person.</Empty>
            ) : (
              <ul className="flex flex-col divide-y divide-foreground/10">
                {leads.map((lead) => (
                  <li key={lead.id} className="py-3">
                    <Link href={adminPath(`/inquiries/${lead.id}`)} className="font-sans text-base font-medium text-foreground underline-offset-4 hover:underline">
                      {lead.event_type ?? "Enquiry"}
                      {lead.event_date_text ? ` · ${lead.event_date_text}` : ""}
                    </Link>
                    <span className="mt-1 flex flex-wrap items-center gap-2 font-sans text-xs text-foreground/60">
                      <Pill value={lead.status} />
                      {lead.source === "lead_form" ? "Booking form" : "Contact form"} · {formatRelative(lead.created_at)}
                      {lead.location ? ` · ${lead.location}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="WhatsApp">
            {contacts.length === 0 ? (
              <Empty>No WhatsApp identity linked yet.</Empty>
            ) : (
              <ul className="flex flex-col gap-4">
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <p className="font-sans text-sm text-foreground/70">
                      {contact.display_name ?? contact.phone_e164} {contact.whatsapp_username ? `(@${contact.whatsapp_username})` : ""}
                    </p>
                    {contact.profile ? (
                      <div className="mt-2">
                        <KeyValue
                          items={[
                            ["Booking stage", contact.profile.booking_stage],
                            ["Event", contact.profile.event_type],
                            ["Date", contact.profile.event_date_text],
                            ["Venue", contact.profile.venue ?? contact.profile.location],
                            ["Quoted", contact.profile.quoted_amount_text],
                            ["Deposit", contact.profile.deposit_status === "none" ? null : contact.profile.deposit_status],
                          ]}
                        />
                      </div>
                    ) : null}
                    {contact.conversations.length === 0 ? (
                      <p className="mt-2 font-sans text-xs text-foreground/50">No conversations stored.</p>
                    ) : (
                      <ul className="mt-2 flex flex-col divide-y divide-foreground/10">
                        {contact.conversations.map((conversation) => (
                          <li key={conversation.id} className="py-2">
                            <Link href={adminPath(`/conversations/${conversation.id}`)} className="font-sans text-sm font-medium text-foreground underline-offset-4 hover:underline">
                              Conversation · {conversation.state.replace(/_/g, " ")}
                            </Link>
                            <span className="block font-sans text-xs text-foreground/50">last message {formatRelative(conversation.last_inbound_at)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Details">
            <PersonForm person={person} />
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Notes">
            {person.notes ? (
              <p className="whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground/85">{person.notes}</p>
            ) : (
              <Empty>No notes yet. Add them in Details.</Empty>
            )}
          </Panel>

          <Panel title="History">
            {audit.length === 0 ? (
              <Empty>No manual changes yet.</Empty>
            ) : (
              <ul className="flex flex-col divide-y divide-foreground/10 font-sans text-sm">
                {audit.map((entry) => (
                  <li key={entry.id} className="py-2">
                    <span className="text-foreground/85">
                      {entry.action}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </span>
                    <span className="block text-xs text-foreground/50">
                      {entry.actor} · {formatDateTime(entry.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Merge into this contact">
            <MergeForm keepId={person.id} />
          </Panel>

          <Panel title="Archive">
            <p className="mb-3 font-sans text-sm text-foreground/60">Archived contacts drop out of lists but keep their history.</p>
            {person.archived_at ? (
              <ActionButton action={archivePerson} fields={{ id: person.id, restore: "1" }}>Restore</ActionButton>
            ) : (
              <ActionButton action={archivePerson} fields={{ id: person.id }} variant="danger" confirm="Archive?">Archive contact</ActionButton>
            )}
            <p className="mt-4 font-mono text-xs text-foreground/50">id {person.id}</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
