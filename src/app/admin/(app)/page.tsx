import Link from "next/link";

import { Badge, Empty, formatDateTime, formatRelative, humanise, PageHeader, Panel, Pill, Stat, Table, Td, Th } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";
import { getDashboardStats, listInquiries, listNeedsAttention } from "@/lib/admin/queries";

export const metadata = { title: "Dashboard" };

const STAGE_ORDER = ["new", "contacted", "quoted", "booked", "played", "lost"] as const;

function attentionHref(row: { entity_type: string; entity_id: string }): string {
  switch (row.entity_type) {
    case "website_lead":
      return adminPath(`/inquiries/${row.entity_id}`);
    case "health":
      return adminPath("/health");
    default:
      return adminPath("/console");
  }
}

export default async function DashboardPage() {
  const [stats, attention, latest] = await Promise.all([
    getDashboardStats(),
    listNeedsAttention(8),
    listInquiries({ pageSize: 8 }),
  ]);

  const website = stats.byChannel.find((row) => row.channel === "website");
  const whatsapp = stats.byChannel.find((row) => row.channel === "whatsapp");
  const last7 = (website?.last_7 ?? 0) + (whatsapp?.last_7 ?? 0);
  const last30 = (website?.last_30 ?? 0) + (whatsapp?.last_30 ?? 0);
  const peopleTotal = stats.stages.reduce((sum, row) => sum + row.total, 0);
  const booked = stats.stages
    .filter((row) => row.stage === "booked" || row.stage === "played")
    .reduce((sum, row) => sum + row.total, 0);
  const median = stats.medianResponseMinutes;
  const medianLabel =
    median === null ? "—" : median < 90 ? `${Math.round(median)} min` : `${(median / 60).toFixed(1)} h`;
  const topType = stats.byEventType[0];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Every enquiry from the website and WhatsApp, what needs you, and how the pipeline is moving."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Enquiries, 7 days" value={last7} hint={`${website?.last_7 ?? 0} website, ${whatsapp?.last_7 ?? 0} WhatsApp`} tone="accent" href={adminPath("/inquiries")} />
        <Stat label="Enquiries, 30 days" value={last30} hint={`${website?.last_30 ?? 0} website, ${whatsapp?.last_30 ?? 0} WhatsApp`} href={adminPath("/inquiries")} />
        <Stat
          label="Needs attention"
          value={stats.needsAttention}
          tone={stats.needsAttention > 0 ? "bad" : "good"}
          hint={stats.needsAttention > 0 ? "Open the console" : "All clear"}
          href={adminPath("/console")}
        />
        <Stat label="Median time to decision" value={medianLabel} hint="Website leads, 90 days" href={adminPath("/inquiries?channel=website")} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Awaiting approval" value={stats.pendingApprovals} hint="WhatsApp review cards open" href={adminPath("/inquiries?channel=whatsapp")} />
        <Stat label="Open website leads" value={stats.openLeads} hint="New, drafting or draft ready" href={adminPath("/inquiries?channel=website")} />
        <Stat label="Booked or played" value={booked} hint={`of ${peopleTotal} contacts`} tone={booked > 0 ? "good" : "neutral"} href={adminPath("/contacts")} />
        <Stat label="Top event type, 90 days" value={topType?.event_type ?? "—"} hint={topType ? `${topType.total} enquiries` : "No data yet"} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Needs attention" eyebrow="Now" className="xl:col-span-2">
          {attention.length === 0 ? (
            <p className="font-sans text-sm text-foreground/60">Nothing is waiting on you.</p>
          ) : (
            <ul className="divide-y divide-foreground/5">
              {attention.map((row) => (
                <li key={`${row.kind}-${row.entity_id}`} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link href={attentionHref(row)} className="font-sans text-sm font-semibold text-foreground hover:text-accent">
                      {row.title}
                    </Link>
                    {row.detail ? <p className="mt-0.5 truncate font-sans text-xs text-foreground/60">{row.detail}</p> : null}
                  </div>
                  <span className="shrink-0 font-sans text-xs text-foreground/50">{formatRelative(row.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Pipeline" eyebrow="Contacts by stage">
          <ul className="space-y-2">
            {STAGE_ORDER.map((stage) => {
              const count = stats.stages.find((row) => row.stage === stage)?.total ?? 0;
              return (
                <li key={stage} className="flex items-center gap-3">
                  <span className="w-24 font-sans text-sm text-foreground/80">{humanise(stage)}</span>
                  <progress
                    value={count}
                    max={peopleTotal || 1}
                    aria-label={`${humanise(stage)}: ${count}`}
                    className="h-[8px] flex-1 appearance-none overflow-hidden rounded-full bg-cream [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-cream [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary"
                  />
                  <span className="w-8 text-right font-sans text-sm font-semibold">{count}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 border-t border-foreground/10 pt-4">
            <p className="font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">Event types, 90 days</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {stats.byEventType.length === 0 ? (
                <li className="font-sans text-sm text-foreground/60">No enquiries yet.</li>
              ) : (
                stats.byEventType.map((item) => (
                  <li key={item.event_type}>
                    <Badge tone="neutral">
                      {item.event_type} · {item.total}
                    </Badge>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="mt-5 border-t border-foreground/10 pt-4">
            <p className="font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">Sources, 90 days</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {stats.bySource.map((item) => (
                <li key={item.source}>
                  <Badge tone="neutral">
                    {humanise(item.source)} · {item.total}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <Panel title="Latest enquiries" eyebrow="Recent" className="mt-6" padded={false} actions={<Link href={adminPath("/inquiries")} className="font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60 hover:text-accent">View all</Link>}>
        {latest.rows.length === 0 ? (
          <div className="p-6">
            <Empty title="No enquiries yet">Website form submissions and WhatsApp messages will show here.</Empty>
          </div>
        ) : (
          <Table
            className="rounded-t-none border-x-0 border-b-0"
            head={
              <tr>
                <Th>When</Th>
                <Th>Who</Th>
                <Th>Channel</Th>
                <Th>Event</Th>
                <Th>Status</Th>
              </tr>
            }
          >
            {latest.rows.map((row) => (
              <tr key={row.id} className="hover:bg-cream/60">
                <Td className="whitespace-nowrap text-foreground/60">{formatDateTime(row.created_at)}</Td>
                <Td>
                  <Link href={adminPath(`/inquiries/${row.id}`)} className="font-semibold text-foreground hover:text-accent">
                    {row.name ?? "Unknown"}
                  </Link>
                  <p className="text-xs text-foreground/60">{row.email ?? row.phone ?? ""}</p>
                </Td>
                <Td><Pill value={row.channel} /></Td>
                <Td>
                  {row.event_type ?? "—"}
                  {row.event_date_text ? <p className="text-xs text-foreground/60">{row.event_date_text}</p> : null}
                </Td>
                <Td>
                  <Pill value={row.status} />
                  {row.needs_attention ? <Pill value="failed" label="attention" className="ml-1" /> : null}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
