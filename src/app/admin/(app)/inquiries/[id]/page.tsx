import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { LeadEditForm, LeadStatusForm, LinkPersonForm, ResendAlertForm } from "@/app/admin/(app)/inquiries/[id]/LeadForms";
import { Badge, Card, DefinitionList, LinkButton, PageHeader, Pre, Timeline, formatDateTime, humanise, statusTone } from "@/components/admin/ui";
import { getAdminBasePath } from "@/lib/admin/auth";
import { getEmailThread, getInquiryRecord, getPerson, getWebsiteLead, listAuditForRow, listEventsForLead } from "@/lib/admin/queries";
import { buildWaMePrefill } from "@/lib/inquiries/telegram";

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = await getAdminBasePath();

  const lead = await getWebsiteLead(id);
  if (!lead) {
    const inquiry = await getInquiryRecord(id);
    if (inquiry) redirect(`${base}/conversations/${inquiry.conversation_id}`);
    const emailThread = await getEmailThread(id);
    if (emailThread) redirect(`${base}/emails/${emailThread.id}`);
    notFound();
  }

  const [person, events, audit] = await Promise.all([
    lead.person_id ? getPerson(lead.person_id) : Promise.resolve(null),
    listEventsForLead(lead.id),
    listAuditForRow("inquiry_website_leads", lead.id),
  ]);

  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ");
  const reply = lead.final_reply ?? lead.draft_reply;
  const waHref = lead.whatsapp_digits ? buildWaMePrefill(lead.whatsapp_digits, reply ?? "").url : null;

  const timeline = [
    { id: "created", at: lead.created_at, title: `Submitted via ${lead.source === "lead_form" ? "the booking form" : "the home-page form"}` },
    ...(lead.alert_sent_at
      ? [{ id: "alert", at: lead.alert_sent_at, title: "Telegram alert delivered", tone: "success" as const }]
      : lead.alert_status === "failed"
        ? [{ id: "alert", at: lead.updated_at, title: `Telegram alert failed after ${lead.alert_attempts} attempts`, body: lead.alert_error, tone: "danger" as const }]
        : []),
    ...(lead.decided_at
      ? [{ id: "decided", at: lead.decided_at, title: `Marked ${humanise(lead.availability ?? lead.status)} by ${lead.decided_by ?? "unknown"}` }]
      : []),
    ...(reply ? [{ id: "draft", at: lead.updated_at, title: lead.final_reply ? "Reply approved" : "AI draft ready", body: <Pre>{reply}</Pre> }] : []),
    ...events.map((event) => ({
      id: event.id,
      at: event.created_at,
      title: event.message,
      tone: event.level === "error" ? ("danger" as const) : event.level === "warn" ? ("warning" as const) : ("success" as const),
    })),
    ...audit.map((row) => ({
      id: row.id,
      at: row.created_at,
      title: `${row.actor} ${row.action === "action" ? row.note ?? "took an action" : `edited ${Object.keys(row.after ?? {}).join(", ") || "the record"}`}`,
    })),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return (
    <>
      <PageHeader
        eyebrow="Website enquiry"
        title={fullName || "Unknown"}
        description={[lead.event_type, lead.event_date_text, lead.location].filter(Boolean).join(" · ")}
        actions={
          <>
            <Badge tone={statusTone(lead.status)}>{humanise(lead.status)}</Badge>
            {lead.availability ? <Badge tone={lead.availability === "available" ? "success" : "danger"}>{humanise(lead.availability)}</Badge> : null}
            <Badge tone={statusTone(lead.alert_status)}>Alert {humanise(lead.alert_status)}</Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Details" eyebrow="As submitted">
            <DefinitionList
              items={[
                { label: "Email", value: <a href={`mailto:${lead.email}`} className="underline underline-offset-4 hover:text-accent">{lead.email}</a> },
                { label: "Phone", value: lead.phone },
                { label: "WhatsApp", value: lead.whatsapp ?? (lead.whatsapp_digits ? `+${lead.whatsapp_digits}` : null) },
                { label: "Preferred contact", value: humanise(lead.contact_preference) },
                { label: "Role", value: lead.booker_role },
                { label: "Event", value: lead.event_type },
                { label: "Date", value: lead.event_date_text ?? lead.event_date_iso },
                { label: "Flexible date", value: lead.date_flexible === null ? "—" : lead.date_flexible ? "Yes" : "No" },
                { label: "Location", value: lead.location },
                { label: "Guests", value: lead.guest_count },
                { label: "Performance", value: lead.performance_minutes ? `${lead.performance_minutes} min` : null },
                { label: "Submitted", value: formatDateTime(lead.created_at) },
              ]}
            />
            {lead.message ? (
              <div className="mt-5">
                <p className="font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">Message</p>
                <Pre className="mt-2">{lead.message}</Pre>
              </div>
            ) : null}
          </Card>

          <Card title="Edit" eyebrow="Correct the record" >
            <LeadEditForm lead={lead} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Actions">
            <div className="flex flex-col gap-3">
              {waHref ? (
                <LinkButton href={waHref} variant="primary" external>
                  Open WhatsApp {reply ? "with the approved reply" : "chat"}
                </LinkButton>
              ) : null}
              <ResendAlertForm lead={lead} />
              <LeadStatusForm lead={lead} />
            </div>
          </Card>

          <Card title="Contact" eyebrow="Person">
            {person ? (
              <div>
                <Link href={`${base}/contacts/${person.id}`} className="font-sans text-sm font-semibold text-foreground hover:text-accent">
                  {person.display_name ?? person.email ?? person.phone_e164}
                </Link>
                <p className="mt-1 font-sans text-xs text-foreground/60">
                  {[person.phone_e164, person.email].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-2">
                  <Badge tone={statusTone(person.stage)}>{humanise(person.stage)}</Badge>
                </div>
              </div>
            ) : (
              <p className="font-sans text-sm text-foreground/60">Not linked to a contact yet.</p>
            )}
            <div className="mt-4">
              <LinkPersonForm lead={lead} />
            </div>
          </Card>

          <Card title="Timeline" eyebrow="Everything that happened">
            <Timeline items={timeline} />
          </Card>
        </div>
      </div>
    </>
  );
}
