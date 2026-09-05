import Link from "next/link";

import { AcknowledgeAllForm, AcknowledgeForm, RetryOutboxForm } from "@/app/admin/(app)/console/ConsoleForms";
import { Badge, Card, EmptyState, PageHeader, formatDateTime, humanise, relativeTime, statusTone } from "@/components/admin/ui";
import { getAdminBasePath } from "@/lib/admin/auth";
import { isAdminSchemaReady, listAdminEvents, listNeedsAttention } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

const LEVELS = ["", "error", "warn", "info"] as const;
const SOURCES = ["", "telegram", "zernio", "supabase", "ai", "trigger", "email", "webhook", "health", "admin", "analytics", "site"];

export default async function ConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; source?: string; all?: string }>;
}) {
  const params = await searchParams;
  const base = await getAdminBasePath();
  const level = params.level === "error" || params.level === "warn" || params.level === "info" ? params.level : undefined;
  const [ready, attention, events] = await Promise.all([
    isAdminSchemaReady(),
    listNeedsAttention(50),
    listAdminEvents({ level, source: params.source || undefined, open: params.all !== "1", limit: 150 }),
  ]);

  const link = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { level: params.level, source: params.source, all: params.all, ...overrides };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const qs = next.toString();
    return `${base}/console${qs ? `?${qs}` : ""}`;
  };

  const attentionHref = (kind: string, id: string) =>
    kind === "lead_alert_failed" || kind === "lead_draft_ready" ? `${base}/inquiries/${id}` : null;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Console"
        description="API failures, uncertain sends, stuck work and anything else that needs a human. Acknowledge what you have handled."
        actions={ready ? <AcknowledgeAllForm /> : null}
      />

      {!ready ? (
        <div className="mb-6">
          <EmptyState title="Database migration pending" body="Run `npx supabase db push` to create admin_events. Row-level failures from the inquiry tables still show below." />
        </div>
      ) : null}

      <Card title="Needs attention" eyebrow="Derived from live state" className="mb-6">
        {attention.length === 0 ? (
          <p className="font-sans text-sm text-foreground/60">Nothing is stuck or failing.</p>
        ) : (
          <ul className="divide-y divide-foreground/5">
            {attention.map((row) => {
              const href = attentionHref(row.kind, row.ref_id);
              return (
                <li key={`${row.kind}-${row.ref_id}`} className="flex flex-col gap-2 py-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={row.kind === "event_error" || row.kind.includes("failed") || row.kind.includes("uncertain") ? "danger" : "warning"}>{humanise(row.kind)}</Badge>
                      {href ? (
                        <Link href={href} className="font-sans text-sm font-semibold text-foreground hover:text-accent">{row.title}</Link>
                      ) : (
                        <span className="font-sans text-sm font-semibold text-foreground">{row.title}</span>
                      )}
                    </div>
                    {row.detail ? <p className="mt-1 break-words font-sans text-xs text-foreground/60">{row.detail}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-sans text-xs text-foreground/50">{relativeTime(row.created_at)}</span>
                    {row.kind === "outbox_failed" ? <RetryOutboxForm id={row.ref_id} /> : null}
                    {row.kind === "event_error" ? <AcknowledgeForm id={row.ref_id} /> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {LEVELS.map((value) => (
          <Link
            key={value || "all"}
            href={link({ level: value || undefined })}
            className={cn(
              "rounded-full border px-[0.9em] py-[0.35em] font-sans text-sm transition-colors",
              (params.level ?? "") === value ? "border-primary bg-primary text-on-dark" : "border-foreground/15 bg-background text-foreground/80 hover:border-foreground/40",
            )}
          >
            {value ? humanise(value) : "All levels"}
          </Link>
        ))}
        <span className="mx-1 h-[16px] w-[1px] bg-foreground/15" aria-hidden />
        {SOURCES.map((value) => (
          <Link
            key={value || "all-sources"}
            href={link({ source: value || undefined })}
            className={cn(
              "rounded-full border px-[0.9em] py-[0.35em] font-sans text-xs transition-colors",
              (params.source ?? "") === value ? "border-foreground bg-foreground text-on-dark" : "border-foreground/15 bg-background text-foreground/70 hover:border-foreground/40",
            )}
          >
            {value || "All sources"}
          </Link>
        ))}
        <Link href={link({ all: params.all === "1" ? undefined : "1" })} className="ml-auto rounded-full border border-foreground/15 px-[0.9em] py-[0.35em] font-sans text-xs text-foreground/70">
          {params.all === "1" ? "Open only" : "Include acknowledged"}
        </Link>
      </div>

      <Card title="Event log" eyebrow={params.all === "1" ? "All events" : "Open events"} padded={false}>
        {events.length === 0 ? (
          <div className="p-6">
            <p className="font-sans text-sm text-foreground/60">No events match.</p>
          </div>
        ) : (
          <ul className="divide-y divide-foreground/5">
            {events.map((event) => (
              <li key={event.id} className="flex flex-col gap-2 px-5 py-3 md:flex-row md:items-start md:justify-between md:px-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={statusTone(event.level)}>{event.level}</Badge>
                    <Badge tone="neutral">{event.source}</Badge>
                    <span className="font-jakarta text-xs text-foreground/50">{event.kind}</span>
                  </div>
                  <p className="mt-1 break-words font-sans text-sm text-foreground/90">{event.message}</p>
                  <p className="mt-1 font-sans text-xs text-foreground/50">
                    {formatDateTime(event.created_at)}
                    {event.lead_id ? (
                      <>
                        {" · "}
                        <Link href={`${base}/inquiries/${event.lead_id}`} className="underline underline-offset-4 hover:text-accent">Open enquiry</Link>
                      </>
                    ) : null}
                    {event.conversation_id ? (
                      <>
                        {" · "}
                        <Link href={`${base}/conversations/${event.conversation_id}`} className="underline underline-offset-4 hover:text-accent">Open thread</Link>
                      </>
                    ) : null}
                    {event.acknowledged_at ? ` · acknowledged by ${event.acknowledged_by ?? "someone"}` : null}
                  </p>
                  {Object.keys(event.context).length > 0 ? (
                    <details className="mt-1">
                      <summary className="cursor-pointer font-sans text-xs text-foreground/60">Context</summary>
                      <pre className="mt-1 overflow-x-auto rounded-lg bg-cream p-3 font-jakarta text-xs text-foreground/80">{JSON.stringify(event.context, null, 2)}</pre>
                    </details>
                  ) : null}
                </div>
                {!event.acknowledged_at && event.level !== "info" ? <AcknowledgeForm id={event.id} /> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
