import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ActionButton } from "@/components/admin/ActionButton";
import { LeadEditForm } from "@/components/admin/LeadEditForm";
import { PersonLinker } from "@/components/admin/PersonLinker";
import { SessionPath } from "@/components/admin/SessionPath";
import { Empty, formatDateTime, formatRelative, KeyValue, LinkButton, PageHeader, Panel, Pill } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";
import {
  getInquiryRow,
  getSessionPath,
  getWebsiteLead,
  listAuditForRow,
  listEventsForEntity,
  listSuggestChangesForLead,
} from "@/lib/admin/queries";

import { rerunLeadDraft, resendLeadAlert, setWebsiteLeadStatus, skipLeadAlert } from "../../actions";

export const metadata = { title: "Enquiry" };

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getInquiryRow(id);
  if (!row) notFound();
  if (row.channel === "whatsapp") {
    redirect(adminPath(`/conversations/${row.conversation_id ?? row.id}`));
  }

  const lead = await getWebsiteLead(id);
  if (!lead) notFound();

  const [suggestChanges, events, audit, path] = await Promise.all([
    listSuggestChangesForLead(id),
    listEventsForEntity("website_lead", id),
    listAuditForRow("inquiry_website_leads", id),
    getSessionPath(lead.session_id),
  ]);

  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ");
  const waLink = lead.whatsapp_digits ? `https://wa.me/${lead.whatsapp_digits}` : null;
  const reply = lead.final_reply ?? lead.draft_reply;

  return (
    <>
      <PageHeader
        eyebrow={lead.source === "lead_form" ? "Booking form" : "Contact form"}
        title={fullName}
        description={`${lead.event_type ?? "Enquiry"}${lead.event_date_text ? ` · ${lead.event_date_text}` : ""}${lead.location ? ` · ${lead.location}` : ""}`}
        actions={
          <>
            {waLink ? (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-whatsapp px-[1.25em] py-[0.6em] font-sans text-sm font-medium text-on-dark hover:bg-whatsapp/90">
                Open WhatsApp
              </a>
            ) : null}
            <a href={`mailto:${lead.email}`} className="inline-flex min-h-11 items-center rounded-full border border-on-dark/25 px-[1.25em] py-[0.6em] font-sans text-sm text-on-dark hover:border-on-dark">
              Email
            </a>
            {lead.person_id ? <LinkButton href={adminPath(`/contacts/${lead.person_id}`)}>Contact profile</LinkButton> : null}
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Pill value={lead.status} />
        <Pill value={lead.alert_status} label={`alert ${lead.alert_status}`} />
        {lead.availability ? <Pill value={lead.availability === "available" ? "ok" : "lost"} label={lead.availability} /> : null}
        <span className="font-sans text-sm text-on-dark/60">Received {formatDateTime(lead.created_at)} ({formatRelative(lead.created_at)})</span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <Panel title="What they sent">
            <KeyValue
              items={[
                ["Email", lead.email],
                ["Phone", lead.phone],
                ["WhatsApp", lead.whatsapp ?? (lead.whatsapp_digits ? `+${lead.whatsapp_digits}` : null)],
                ["Preferred contact", lead.contact_preference],
                ["Role", lead.booker_role],
                ["Event type", lead.event_type],
                ["Date", lead.event_date_text ? `${lead.event_date_text}${lead.date_flexible ? " (flexible)" : ""}` : null],
                ["Location", lead.location],
                ["Guests", lead.guest_count === null ? null : lead.guest_count >= 200 ? "200+" : String(lead.guest_count)],
                ["Performance", lead.performance_minutes === null ? null : `${lead.performance_minutes} min`],
              ]}
            />
            {lead.message ? (
              <div className="mt-5">
                <p className="font-jost text-[0.6875rem] uppercase tracking-[0.18em] text-on-dark/50">Message</p>
                <p className="mt-1 whitespace-pre-wrap font-sans text-base leading-relaxed text-on-dark">{lead.message}</p>
              </div>
            ) : null}
            {lead.notes ? (
              <details className="mt-5">
                <summary className="cursor-pointer font-jost text-[0.6875rem] uppercase tracking-[0.18em] text-on-dark/50">Form summary</summary>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-relaxed text-on-dark/70">{lead.notes}</pre>
              </details>
            ) : null}
          </Panel>

          <Panel title="Reply draft">
            {reply ? (
              <>
                <p className="whitespace-pre-wrap rounded-input border border-on-dark/10 bg-surface-darker p-4 font-sans text-base leading-relaxed">{reply}</p>
                <p className="mt-2 font-sans text-xs text-on-dark/50">
                  {lead.final_reply ? "Luke's own text (override)" : `AI draft${lead.model ? ` · ${lead.model}` : ""}`}
                  {lead.decided_at ? ` · decided ${formatDateTime(lead.decided_at)} by ${lead.decided_by ?? "unknown"}` : ""}
                </p>
              </>
            ) : (
              <Empty>
                {lead.availability
                  ? "No draft yet. The draft task runs after Available / Unavailable is tapped."
                  : "Waiting for Luke to tap Available or Unavailable on the Telegram card."}
              </Empty>
            )}
            {suggestChanges.length > 0 ? (
              <ol className="mt-4 flex flex-col gap-3 border-t border-on-dark/10 pt-4">
                {suggestChanges.map((request) => (
                  <li key={request.id} className="font-sans text-sm">
                    <span className="font-jost text-[0.6875rem] uppercase tracking-[0.16em] text-on-dark/50">
                      Revision {request.revision} · {request.status.replace(/_/g, " ")} · {formatRelative(request.created_at)}
                    </span>
                    {request.instructions ? <p className="mt-1 text-on-dark/85">“{request.instructions}”</p> : null}
                  </li>
                ))}
              </ol>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <ActionButton action={rerunLeadDraft} fields={{ id: lead.id }} confirm="Really re-run?">
                Re-run draft
              </ActionButton>
              {lead.status !== "dismissed" ? (
                <ActionButton action={setWebsiteLeadStatus} fields={{ id: lead.id, status: "dismissed" }} confirm="Dismiss?">
                  Dismiss enquiry
                </ActionButton>
              ) : (
                <ActionButton action={setWebsiteLeadStatus} fields={{ id: lead.id, status: "new" }}>
                  Reopen
                </ActionButton>
              )}
            </div>
          </Panel>

          <Panel title="Edit details">
            <p className="mb-4 font-sans text-sm text-on-dark/60">
              Corrections are audited and do not re-send Telegram or re-run the draft on their own.
            </p>
            <LeadEditForm lead={lead} />
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Telegram">
            <KeyValue
              items={[
                ["Alert", lead.alert_status],
                ["Attempts", String(lead.alert_attempts)],
                ["Sent", lead.alert_sent_at ? formatDateTime(lead.alert_sent_at) : null],
                ["Card", lead.telegram_message_id ? `#${lead.telegram_message_id}` : null],
                ["Review card", lead.review_telegram_message_id ? `#${lead.review_telegram_message_id} · ${lead.review_notification_status}` : null],
                ["Last error", lead.alert_error ?? lead.review_notification_error ?? lead.last_error],
              ]}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton action={resendLeadAlert} fields={{ id: lead.id }} variant="primary" confirm="Send again?">
                Resend alert
              </ActionButton>
              {lead.alert_status === "failed" || lead.alert_status === "pending" ? (
                <ActionButton action={skipLeadAlert} fields={{ id: lead.id }}>
                  Stop retrying
                </ActionButton>
              ) : null}
            </div>
          </Panel>

          <Panel title="Contact">
            <PersonLinker leadId={lead.id} personId={lead.person_id} />
          </Panel>

          <Panel title="Path through the site">
            <SessionPath steps={path} sessionId={lead.session_id} />
          </Panel>

          <Panel title="Events">
            {events.length === 0 ? (
              <Empty>No integration events for this lead.</Empty>
            ) : (
              <ul className="flex flex-col divide-y divide-on-dark/10 font-sans text-sm">
                {events.map((event) => (
                  <li key={event.id} className="py-2">
                    <Pill value={event.level} className="mr-2" />
                    <span className="text-on-dark/85">{event.message}</span>
                    <span className="block text-xs text-on-dark/50">{event.kind} · {formatRelative(event.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Audit">
            {audit.length === 0 ? (
              <Empty>No manual changes yet.</Empty>
            ) : (
              <ul className="flex flex-col divide-y divide-on-dark/10 font-sans text-sm">
                {audit.map((entry) => (
                  <li key={entry.id} className="py-2">
                    <span className="text-on-dark/85">
                      {entry.action}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </span>
                    <span className="block text-xs text-on-dark/50">
                      {entry.actor} · {formatDateTime(entry.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 font-sans text-xs text-on-dark/40">
              <Link href={adminPath("/console")} className="underline-offset-4 hover:underline">
                Full console
              </Link>
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
