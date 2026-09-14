import Link from "next/link";
import { notFound } from "next/navigation";

import { EmailThreadActions } from "@/app/admin/(app)/emails/[id]/EmailForms";
import { Badge, Card, DefinitionList, LinkButton, PageHeader, Pre, formatDateTime, humanise, statusTone } from "@/components/admin/ui";
import { getAdminBasePath } from "@/lib/admin/auth";
import { getEmailThread, getPerson, listEmailMessages } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

export default async function EmailThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const base = await getAdminBasePath();
  const thread = await getEmailThread(id);
  if (!thread) notFound();
  const [messages, person] = await Promise.all([listEmailMessages(thread.id), thread.person_id ? getPerson(thread.person_id) : Promise.resolve(null)]);
  const replyHref = thread.from_email
    ? `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(thread.from_email)}&su=${encodeURIComponent(`Re: ${thread.subject ?? "your enquiry"}`)}`
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Email enquiry"
        title={thread.from_name ?? thread.from_email ?? "Unknown sender"}
        description={thread.subject ?? undefined}
        actions={
          <>
            <Badge tone={thread.classification === "inquiry" ? "success" : "neutral"}>{humanise(thread.classification)}</Badge>
            <Badge tone={statusTone(thread.status)}>{humanise(thread.status)}</Badge>
            {replyHref ? <LinkButton href={replyHref} external variant="primary">Reply in Gmail</LinkButton> : null}
          </>
        }
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Thread" eyebrow={`${messages.length} messages`} padded={false}>
            {messages.length === 0 ? (
              <p className="p-6 font-sans text-sm text-foreground/60">No messages stored.</p>
            ) : (
              <ol className="divide-y divide-foreground/5">
                {messages.map((message) => (
                  <li key={message.id} className={cn("px-5 py-4 md:px-6", message.direction === "outgoing" && "bg-cream/60")}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-sans text-sm font-semibold text-foreground">
                        {message.direction === "outgoing" ? "Luke" : (message.from_name ?? message.from_email ?? "Unknown")}
                        <span className="ml-2 font-normal text-foreground/50">{message.direction === "outgoing" ? `to ${message.to_email ?? ""}` : message.from_email}</span>
                      </p>
                      <span className="font-sans text-xs text-foreground/50">{formatDateTime(message.received_at)}</span>
                    </div>
                    <Pre className="mt-3 bg-background">{message.body_text ?? ""}</Pre>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Actions">
            <EmailThreadActions thread={thread} />
          </Card>
          <Card title="Extracted" eyebrow="By the classifier">
            <DefinitionList
              items={[
                { label: "Event", value: thread.event_type },
                { label: "Date", value: thread.event_date_text },
                { label: "Location", value: thread.location },
                { label: "First message", value: formatDateTime(thread.first_message_at) },
                { label: "Last message", value: formatDateTime(thread.last_message_at) },
                { label: "Telegram alert", value: thread.telegram_message_id ? "Sent" : thread.alert_error ? `Failed: ${thread.alert_error}` : "Not sent" },
              ]}
            />
            {thread.summary ? <Pre className="mt-4">{thread.summary}</Pre> : null}
          </Card>
          <Card title="Contact" eyebrow="Person">
            {person ? (
              <Link href={`${base}/contacts/${person.id}`} className="font-sans text-sm font-semibold text-foreground hover:text-accent">
                {person.display_name ?? person.email ?? person.phone_e164}
              </Link>
            ) : (
              <p className="font-sans text-sm text-foreground/60">Not linked to a contact. Marking the thread as an enquiry links it by email.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
