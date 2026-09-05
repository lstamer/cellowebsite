import Link from "next/link";
import { Suspense } from "react";

import { ActionButton } from "@/components/admin/ActionButton";
import { FilterBar } from "@/components/admin/FilterBar";
import { Empty, formatDateTime, formatRelative, PageHeader, Pagination, Panel, Pill } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";
import { listAdminEvents, listNeedsAttention, listRecentAudit } from "@/lib/admin/queries";

import { acknowledgeEvent } from "../actions";

export const metadata = { title: "Console" };

type Search = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] ?? "" : value ?? "");

function attentionHref(row: { entity_type: string; entity_id: string }): string | null {
  if (row.entity_type === "website_lead") return adminPath(`/inquiries/${row.entity_id}`);
  if (row.entity_type === "health") return adminPath("/health");
  return null;
}

export default async function ConsolePage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const open = first(params.open) !== "0";
  const [events, attention, audit] = await Promise.all([
    listAdminEvents({ level: first(params.level), source: first(params.source), open, page: Number(first(params.page)) || 1 }),
    listNeedsAttention(30),
    listRecentAudit(20),
  ]);

  function makeHref(page: number) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const single = first(value);
      if (single && key !== "page") search.set(key, single);
    }
    search.set("page", String(page));
    return `${adminPath("/console")}?${search.toString()}`;
  }

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Console"
        description="Every integration failure, uncertain send and recovery, plus the rows that are currently stuck. Acknowledge an event once you have dealt with it."
        actions={
          <>
            <Link href={adminPath(open ? "/console?open=0" : "/console")} className="inline-flex min-h-11 items-center rounded-full border border-on-dark/25 px-[1.25em] py-[0.6em] font-sans text-sm text-on-dark hover:border-on-dark">
              {open ? "Show acknowledged too" : "Only open"}
            </Link>
            <ActionButton action={acknowledgeEvent} fields={{ all: "1" }} confirm="Acknowledge all?">Acknowledge all</ActionButton>
          </>
        }
      />

      <Panel title={`Stuck right now (${attention.length})`} className="mb-6">
        {attention.length === 0 ? (
          <Empty>Nothing is stuck. Alerts delivered, sends confirmed, health green.</Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-on-dark/10">
            {attention.map((row) => {
              const href = attentionHref(row);
              const body = (
                <>
                  <span className="font-sans text-sm font-medium text-on-dark">{row.title}</span>
                  {row.detail ? <span className="mt-0.5 block font-sans text-xs text-on-dark/60">{row.detail}</span> : null}
                  <span className="mt-0.5 block font-jost text-[0.6875rem] uppercase tracking-[0.14em] text-on-dark/45">
                    {row.kind.replace(/_/g, " ")} · {formatRelative(row.at)}
                  </span>
                </>
              );
              return (
                <li key={`${row.kind}-${row.entity_id}`} className="py-3">
                  {href ? <Link href={href} className="block hover:text-cream">{body}</Link> : <div>{body}</div>}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Suspense>
        <FilterBar
          searchPlaceholder="(search not applied to events)"
          filters={[
            { name: "level", label: "Level", options: ["error", "warning", "info"].map((value) => ({ value, label: value })) },
            { name: "source", label: "Source", options: ["telegram", "supabase", "zernio", "ai", "trigger", "health", "admin", "auth", "beacon", "email"].map((value) => ({ value, label: value })) },
          ]}
        />
      </Suspense>

      <Panel title={`Events ${open ? "(open)" : "(all)"}`}>
        {events.rows.length === 0 ? (
          <Empty>No events{open ? " waiting for acknowledgement" : ""}.</Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-on-dark/10">
            {events.rows.map((event) => (
              <li key={event.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill value={event.level} />
                    <span className="font-jost text-[0.6875rem] uppercase tracking-[0.14em] text-on-dark/50">
                      {event.source} · {event.kind.replace(/_/g, " ")}
                    </span>
                    <span className="font-sans text-xs text-on-dark/50">{formatDateTime(event.created_at)}</span>
                  </div>
                  <p className="mt-1 break-words font-sans text-sm text-on-dark/90">{event.message}</p>
                  {event.entity_type === "website_lead" && event.entity_id ? (
                    <Link href={adminPath(`/inquiries/${event.entity_id}`)} className="font-sans text-xs text-on-dark/60 underline-offset-4 hover:underline">
                      Open lead
                    </Link>
                  ) : null}
                  {Object.keys(event.context).length > 0 ? (
                    <details className="mt-1">
                      <summary className="cursor-pointer font-sans text-xs text-on-dark/50">Context</summary>
                      <pre className="mt-1 overflow-x-auto rounded-input bg-surface-darker p-2 font-mono text-xs text-on-dark/70">{JSON.stringify(event.context, null, 2)}</pre>
                    </details>
                  ) : null}
                  {event.acknowledged_at ? (
                    <p className="mt-1 font-sans text-xs text-on-dark/45">Acknowledged by {event.acknowledged_by} · {formatRelative(event.acknowledged_at)}</p>
                  ) : null}
                </div>
                {!event.acknowledged_at ? (
                  <ActionButton action={acknowledgeEvent} fields={{ id: event.id }}>Acknowledge</ActionButton>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <Pagination page={events.page} pageSize={events.pageSize} total={events.total} makeHref={makeHref} />
      </Panel>

      <Panel title="Recent manual changes" className="mt-6">
        {audit.length === 0 ? (
          <Empty>No edits from the admin yet.</Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-on-dark/10 font-sans text-sm">
            {audit.map((entry) => (
              <li key={entry.id} className="py-2">
                <span className="text-on-dark/85">
                  {entry.action} on {entry.table_name.replace("inquiry_", "").replace(/_/g, " ")}
                  {entry.note ? ` · ${entry.note}` : ""}
                </span>
                <span className="block text-xs text-on-dark/50">
                  {entry.actor} · {formatDateTime(entry.created_at)} · row {entry.row_id.slice(0, 8)}…
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
