import Link from "next/link";
import { notFound } from "next/navigation";

import { Empty, formatDateTime, formatRelative, isInFuture, KeyValue, LinkButton, PageHeader, Panel, Pill } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";
import { getConversationBundle } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

export const metadata = { title: "WhatsApp conversation" };

function analysisField(analysis: Record<string, unknown> | null, path: string[]): string | null {
  let cursor: unknown = analysis;
  for (const key of path) {
    if (!cursor || typeof cursor !== "object") return null;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  if (cursor === null || cursor === undefined) return null;
  if (Array.isArray(cursor)) return cursor.join(", ");
  return typeof cursor === "object" ? JSON.stringify(cursor) : String(cursor);
}

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getConversationBundle(id);
  if (!bundle) notFound();

  const { conversation, contact, person, inquiry, profile, messages, approvals, suggestChanges, availabilityChecks } = bundle;
  const name = profile?.display_name ?? person?.display_name ?? contact?.display_name ?? contact?.phone_e164 ?? "WhatsApp contact";
  const analysis = inquiry?.latest_analysis ?? null;
  const windowOpen = isInFuture(conversation.service_window_expires_at);
  const waLink = contact?.phone_e164 ? `https://wa.me/${contact.phone_e164.replace("+", "")}` : null;

  return (
    <>
      <PageHeader
        eyebrow="WhatsApp"
        title={name}
        description={[analysisField(analysis, ["event", "event_type"]) ?? profile?.event_type, analysisField(analysis, ["event", "event_date_text"]) ?? profile?.event_date_text, profile?.location ?? analysisField(analysis, ["event", "location"])]
          .filter(Boolean)
          .join(" · ") || "No event details extracted yet."}
        actions={
          <>
            {waLink ? (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-whatsapp px-[1.25em] py-[0.6em] font-sans text-sm font-medium text-on-dark hover:bg-whatsapp/90">
                Open WhatsApp
              </a>
            ) : null}
            {person ? <LinkButton href={adminPath(`/contacts/${person.id}`)}>Contact profile</LinkButton> : null}
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Pill value={inquiry?.status ?? conversation.state} />
        <Pill value={windowOpen ? "ok" : "expired"} label={windowOpen ? "reply window open" : "reply window closed"} />
        {person?.stage ? <Pill value={person.stage} label={`stage ${person.stage}`} /> : null}
        <span className="font-sans text-sm text-on-dark/60">
          Last message {formatRelative(conversation.last_inbound_at)}
          {conversation.service_window_expires_at ? ` · window ${windowOpen ? "closes" : "closed"} ${formatDateTime(conversation.service_window_expires_at)}` : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <Panel title="Thread">
            <p className="mb-4 font-sans text-xs text-on-dark/50">
              Incoming messages are stored from the Zernio webhook. Replies Luke sends from his phone are fetched from Zernio at draft time and are not stored here yet (plan 007, phase 4); approved sends appear below.
            </p>
            {messages.length === 0 ? (
              <Empty>No messages stored.</Empty>
            ) : (
              <ol className="flex flex-col gap-3">
                {messages.map((message) => (
                  <li
                    key={message.id}
                    className={cn(
                      "max-w-[85%] rounded-card px-4 py-3 font-sans text-sm leading-relaxed",
                      message.direction === "incoming" ? "self-start bg-surface-darker text-on-dark" : "self-end bg-cream text-primary",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.body?.trim() || "[attachment]"}</p>
                    {message.attachments.length > 0 ? (
                      <p className="mt-1 text-xs opacity-70">{message.attachments.map((attachment) => attachment.type ?? "attachment").join(", ")}</p>
                    ) : null}
                    <p className="mt-1 font-mono text-[0.6875rem] opacity-60">{formatDateTime(message.occurred_at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="Drafts and approvals">
            {approvals.length === 0 ? (
              <Empty>No draft has been produced yet{inquiry ? "" : " (the AI runs two minutes after the last message)"}.</Empty>
            ) : (
              <ol className="flex flex-col gap-5">
                {approvals.map((approval) => {
                  const revisions = suggestChanges.filter((request) => request.source_draft && approval.response_run && request.source_draft === (approval.final_reply ?? approval.response_run.proposed_reply));
                  const text = approval.final_reply ?? approval.response_run?.proposed_reply ?? "";
                  return (
                    <li key={approval.id} className="border-t border-on-dark/10 pt-4 first:border-t-0 first:pt-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Pill value={approval.status} />
                        <Pill value={approval.telegram_notification_status} label={`card ${approval.telegram_notification_status}`} />
                        <span className="font-sans text-xs text-on-dark/50">
                          {formatDateTime(approval.created_at)}
                          {approval.decided_at ? ` · decided ${formatRelative(approval.decided_at)}` : ""}
                          {approval.response_run?.model ? ` · ${approval.response_run.model}` : ""}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap rounded-input border border-on-dark/10 bg-surface-darker p-4 font-sans text-sm leading-relaxed">{text}</p>
                      {approval.final_reply && approval.response_run && approval.final_reply !== approval.response_run.proposed_reply ? (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-jost text-[0.6875rem] uppercase tracking-[0.16em] text-on-dark/50">Original AI draft</summary>
                          <p className="mt-2 whitespace-pre-wrap font-sans text-sm text-on-dark/70">{approval.response_run.proposed_reply}</p>
                        </details>
                      ) : null}
                      {approval.last_error ? <p className="mt-2 font-sans text-xs text-accent">{approval.last_error}</p> : null}
                      {revisions.length > 0 ? (
                        <ul className="mt-2 font-sans text-xs text-on-dark/60">
                          {revisions.map((request) => (
                            <li key={request.id}>Revision {request.revision}: “{request.instructions}”</li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
            {suggestChanges.length > 0 ? (
              <details className="mt-4">
                <summary className="cursor-pointer font-jost text-[0.6875rem] uppercase tracking-[0.16em] text-on-dark/50">All revision requests ({suggestChanges.length})</summary>
                <ul className="mt-2 flex flex-col gap-1 font-sans text-sm text-on-dark/80">
                  {suggestChanges.map((request) => (
                    <li key={request.id}>
                      Rev {request.revision} · {request.status.replace(/_/g, " ")} · {formatRelative(request.created_at)}
                      {request.instructions ? `: “${request.instructions}”` : ""}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="AI understanding">
            {analysis ? (
              <>
                <KeyValue
                  items={[
                    ["Intents", analysisField(analysis, ["intents"])],
                    ["Lead temperature", analysisField(analysis, ["lead_temperature"])],
                    ["Source", analysisField(analysis, ["source"])],
                    ["Confidence", analysisField(analysis, ["confidence"]) ? `${Math.round(Number(analysisField(analysis, ["confidence"])) * 100)}%` : null],
                    ["Name", analysisField(analysis, ["event", "contact_name"])],
                    ["Event", analysisField(analysis, ["event", "event_type"])],
                    ["Date", analysisField(analysis, ["event", "event_date_text"])],
                    ["Venue", analysisField(analysis, ["event", "venue"])],
                    ["Location", analysisField(analysis, ["event", "location"])],
                    ["Guests", analysisField(analysis, ["event", "guest_count"])],
                    ["Risk flags", analysisField(analysis, ["risk_flags"])],
                  ]}
                />
                {analysisField(analysis, ["summary"]) ? (
                  <p className="mt-4 font-sans text-sm leading-relaxed text-on-dark/80">{analysisField(analysis, ["summary"])}</p>
                ) : null}
              </>
            ) : (
              <Empty>Not analysed yet.</Empty>
            )}
          </Panel>

          <Panel title="Client profile">
            {profile ? (
              <KeyValue
                items={[
                  ["Stage", profile.booking_stage],
                  ["Deposit", profile.deposit_status === "none" ? null : profile.deposit_status],
                  ["Quoted", profile.quoted_amount_text],
                  ["Budget", profile.budget_text],
                  ["Duration", profile.duration_minutes ? `${profile.duration_minutes} min` : null],
                  ["Role", profile.role],
                  ["Preferences", profile.preferences.length ? profile.preferences.join("; ") : null],
                  ["Notes", profile.notes],
                  ["Updated", formatDateTime(profile.updated_at)],
                ]}
              />
            ) : (
              <Empty>No profile yet; it is built from the first analysed burst.</Empty>
            )}
          </Panel>

          <Panel title="Availability checks">
            {availabilityChecks.length === 0 ? (
              <Empty>Luke was not asked about availability for this thread.</Empty>
            ) : (
              <ul className="flex flex-col gap-2 font-sans text-sm">
                {availabilityChecks.map((check) => (
                  <li key={check.id} className="flex flex-wrap items-center gap-2">
                    <Pill value={check.availability === "available" ? "ok" : check.availability === "unavailable" ? "lost" : check.status} label={check.availability ?? check.status} />
                    <span className="text-on-dark/80">{check.event_date_text ?? "no date"}</span>
                    <span className="text-xs text-on-dark/50">{check.answered_at ? `answered ${formatRelative(check.answered_at)}` : `asked ${formatRelative(check.created_at)}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Identity">
            <KeyValue
              items={[
                ["Phone", contact?.phone_e164],
                ["WhatsApp name", contact?.display_name],
                ["Username", contact?.whatsapp_username],
                ["Email", person?.email],
                ["Zernio conversation", conversation.provider_conversation_id],
                ["Account", conversation.provider_account_id],
                ["First seen", formatDateTime(conversation.created_at)],
              ]}
            />
            <p className="mt-3 font-sans text-xs text-on-dark/50">
              {person ? (
                <>
                  Linked to{" "}
                  <Link href={adminPath(`/contacts/${person.id}`)} className="underline-offset-4 hover:underline">
                    the contact profile
                  </Link>
                  .
                </>
              ) : (
                "Not linked to a contact: the number could not be normalised."
              )}
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
