import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Card, DefinitionList, LinkButton, PageHeader, Pre, formatDateTime, humanise, statusTone } from "@/components/admin/ui";
import { getAdminBasePath } from "@/lib/admin/auth";
import {
  getContact,
  getConversation,
  getInquiryByConversation,
  getPerson,
  listApprovals,
  listEventsForConversation,
  listMessages,
  listResponseRuns,
} from "@/lib/admin/queries";
import { getZernioConversationHistory, type ZernioHistoryMessage } from "@/lib/inquiries/zernio";
import { cn } from "@/lib/utils";

import { ReplyForm } from "@/app/admin/(app)/conversations/[id]/ReplyForm";

/**
 * The live thread from Zernio, both directions, including replies Luke typed
 * on his phone that never reached the webhook. Null when Zernio is not
 * configured or unreachable; the page then shows the stored messages.
 */
async function loadLiveThread(conversation: { provider_conversation_id: string; provider_account_id?: string }): Promise<ZernioHistoryMessage[] | null> {
  if (!process.env.ZERNIO_API_KEY?.trim() || !conversation.provider_account_id) return null;
  try {
    return await getZernioConversationHistory({
      conversationId: conversation.provider_conversation_id,
      accountId: conversation.provider_account_id,
      limit: 200,
    });
  } catch (error) {
    console.error("Zernio thread could not be loaded for the admin:", error);
    return null;
  }
}

/** The WhatsApp 24-hour customer-service window is still open. */
function isServiceWindowOpen(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return Date.parse(expiresAt) > Date.now();
}

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = await getAdminBasePath();
  const conversation = await getConversation(id);
  if (!conversation) notFound();

  const [inquiry, messages, approvals, runs, contact, events] = await Promise.all([
    getInquiryByConversation(conversation.id),
    listMessages(conversation.id),
    listApprovals(conversation.id),
    listResponseRuns(conversation.id),
    conversation.contact_id ? getContact(conversation.contact_id) : Promise.resolve(null),
    listEventsForConversation(conversation.id),
  ]);
  const person = contact?.person_id ? await getPerson(contact.person_id) : null;
  const liveThread = await loadLiveThread(conversation);
  const thread: Array<{ key: string; direction: "incoming" | "outgoing"; body: string; at: string | null; unprocessed?: boolean }> = liveThread
    ? liveThread.map((message, index) => ({ key: `live-${index}`, direction: message.direction, body: message.text, at: message.sentAt }))
    : messages.map((message) => ({
        key: message.id,
        direction: message.direction,
        body: message.body ?? (message.attachments.length ? "[attachment]" : ""),
        at: message.occurred_at,
        unprocessed: message.direction === "incoming" && !message.processed_at,
      }));
  const analysis = (inquiry?.latest_analysis ?? {}) as Record<string, unknown>;
  const event = (analysis.event ?? {}) as Record<string, unknown>;
  const windowOpen = isServiceWindowOpen(conversation.service_window_expires_at);
  const name = contact?.display_name ?? person?.display_name ?? contact?.phone_e164 ?? "WhatsApp contact";

  return (
    <>
      <PageHeader
        eyebrow="WhatsApp conversation"
        title={name}
        description={[typeof event.event_type === "string" ? event.event_type : null, typeof event.event_date_text === "string" ? event.event_date_text : null, typeof event.location === "string" ? event.location : null].filter(Boolean).join(" · ") || contact?.phone_e164 || undefined}
        actions={
          <>
            {inquiry ? <Badge tone={statusTone(inquiry.status)}>{humanise(inquiry.status)}</Badge> : null}
            <Badge tone={windowOpen ? "success" : "neutral"}>{windowOpen ? "24h window open" : "Window closed"}</Badge>
            {contact?.phone_e164 ? <LinkButton href={`https://wa.me/${contact.phone_e164.replace(/\D/g, "")}`} external variant="primary">Open in WhatsApp</LinkButton> : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Thread" eyebrow={liveThread ? `Live from Zernio, ${thread.length} messages` : `${thread.length} messages stored`} padded={false}>
            {thread.length === 0 ? (
              <p className="p-6 font-sans text-sm text-foreground/60">No messages on this conversation yet.</p>
            ) : (
              <ol className="flex flex-col gap-3 p-5 md:p-6">
                {thread.map((message) => (
                  <li key={message.key} className={cn("flex", message.direction === "outgoing" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 font-sans text-sm leading-relaxed",
                        message.direction === "outgoing" ? "rounded-br-md bg-primary text-on-dark" : "rounded-bl-md bg-cream text-foreground",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      <p className={cn("mt-1 text-xs", message.direction === "outgoing" ? "text-on-dark/70" : "text-foreground/50")}>
                        {formatDateTime(message.at)}
                        {message.unprocessed ? " · unprocessed" : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <div className="border-t border-foreground/10 p-5 md:p-6">
              {windowOpen ? (
                <ReplyForm conversationId={conversation.id} />
              ) : (
                <p className="font-sans text-sm text-foreground/60">
                  The 24-hour WhatsApp window has closed, so a free-form reply cannot be sent from here. Reply from your phone, or send an approved template.
                </p>
              )}
            </div>
          </Card>

          <Card title="Drafts and approvals" eyebrow="What the agent proposed and what happened">
            {approvals.length === 0 ? (
              <p className="font-sans text-sm text-foreground/60">No drafts yet.</p>
            ) : (
              <ul className="space-y-4">
                {approvals.map((approval) => {
                  const run = runs.find((candidate) => candidate.id === approval.response_run_id);
                  return (
                    <li key={approval.id} className="rounded-xl border border-foreground/10 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={statusTone(approval.status)}>{humanise(approval.status)}</Badge>
                        <Badge tone={statusTone(approval.telegram_notification_status)}>Telegram {humanise(approval.telegram_notification_status)}</Badge>
                        {run ? <Badge tone="neutral">{run.policy_decision}</Badge> : null}
                        <span className="font-sans text-xs text-foreground/50">{formatDateTime(approval.created_at)}</span>
                      </div>
                      <Pre className="mt-3">{approval.final_reply ?? run?.proposed_reply ?? ""}</Pre>
                      {approval.decided_by ? <p className="mt-2 font-sans text-xs text-foreground/60">Decided by {approval.decided_by} at {formatDateTime(approval.decided_at)}{approval.sent_at ? `, sent ${formatDateTime(approval.sent_at)}` : ""}</p> : null}
                      {approval.last_error ? <p className="mt-1 font-sans text-xs text-error">{approval.last_error}</p> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Analysis" eyebrow="Latest extraction">
            {inquiry ? (
              <>
                <DefinitionList
                  items={[
                    { label: "Primary intent", value: humanise(inquiry.primary_intent) },
                    { label: "Intents", value: inquiry.intents.map(humanise).join(", ") || null },
                    { label: "Source", value: humanise(inquiry.source) },
                    { label: "Lead temperature", value: typeof analysis.lead_temperature === "string" ? humanise(analysis.lead_temperature) : null },
                    { label: "Completeness", value: inquiry.completeness === null ? null : `${Math.round(Number(inquiry.completeness) * 100)}%` },
                    { label: "Guests", value: typeof event.guest_count === "number" ? event.guest_count : null },
                    { label: "Budget", value: typeof event.budget_text === "string" ? event.budget_text : null },
                  ]}
                />
                {typeof analysis.summary === "string" ? <Pre className="mt-4">{analysis.summary}</Pre> : null}
                {Array.isArray(analysis.risk_flags) && analysis.risk_flags.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {(analysis.risk_flags as string[]).map((flag) => (
                      <li key={flag}><Badge tone="warning">{humanise(flag)}</Badge></li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="font-sans text-sm text-foreground/60">Not analysed yet.</p>
            )}
          </Card>

          <Card title="Contact" eyebrow="Person">
            {person ? (
              <Link href={`${base}/contacts/${person.id}`} className="font-sans text-sm font-semibold text-foreground hover:text-accent">
                {person.display_name ?? person.email ?? person.phone_e164}
              </Link>
            ) : (
              <p className="font-sans text-sm text-foreground/60">Not linked to a contact.</p>
            )}
            <DefinitionList
              items={[
                { label: "Phone", value: contact?.phone_e164 },
                { label: "WhatsApp name", value: contact?.whatsapp_username ?? contact?.display_name },
                { label: "State", value: humanise(conversation.state) },
                { label: "Last inbound", value: formatDateTime(conversation.last_inbound_at) },
                { label: "Window expires", value: formatDateTime(conversation.service_window_expires_at) },
              ]}
            />
          </Card>

          {events.length > 0 ? (
            <Card title="Events" eyebrow="From the console">
              <ul className="space-y-2">
                {events.map((item) => (
                  <li key={item.id} className="font-sans text-sm">
                    <Badge tone={statusTone(item.level)} className="mr-2">{item.level}</Badge>
                    {item.message}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
