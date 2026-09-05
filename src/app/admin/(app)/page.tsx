import Link from "next/link";

import { Empty, formatRelative, LinkButton, PageHeader, Panel, Pill, Stat, Table, Td, Th } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";
import { getDashboardStats, listInquiries, listNeedsAttention } from "@/lib/admin/queries";

export const metadata = { title: "Dashboard" };

function attentionHref(row: { entity_type: string; entity_id: string }): string {
  switch (row.entity_type) {
    case "website_lead":
      return adminPath(`/inquiries/${row.entity_id}`);
    case "approval":
      return adminPath("/console?source=zernio");
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
    listInquiries({ pageSize: 10 }),
  ]);

  const website = stats.byChannel.find((row) => row.channel === "website");
  const whatsapp = stats.byChannel.find((row) => row.channel === "whatsapp");
  const last7 = (website?.last_7 ?? 0) + (whatsapp?.last_7 ?? 0);
  const last30 = (website?.last_30 ?? 0) + (whatsapp?.last_30 ?? 0);
  const booked = stats.stages.filter((row) => row.stage === "booked" || row.stage === "played").reduce((sum, row) => sum + row.total, 0);
  const peopleTotal = stats.stages.reduce((sum, row) => sum + row.total, 0);
  const median = stats.medianResponseMinutes;
  const medianLabel =
    median === null ? "n/a" : median < 90 ? `${Math.round(median)} min` : `${(median / 60).toFixed(1)} h`;

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="What needs Luke"
        description="Every enquiry from the website and WhatsApp in one place, with anything that failed or stalled at the top."
        actions={<LinkButton href={adminPath("/inquiries")}>All enquiries</LinkButton>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Enquiries · 7 days" value={last7} hint={`${website?.last_7 ?? 0} website · ${whatsapp?.last_7 ?? 0} WhatsApp`} tone="accent" />
        <Stat label="Enquiries · 30 days" value={last30} hint={`${website?.last_30 ?? 0} website · ${whatsapp?.last_30 ?? 0} WhatsApp`} />
        <Stat
          label="Needs attention"
          value={stats.needsAttention}
          hint={stats.needsAttention === 0 ? "Nothing failing" : "Alerts, sends, health"}
          tone={stats.needsAttention === 0 ? "good" : "bad"}
        />
        <Stat label="Median time to decision" value={medianLabel} hint="Website leads, last 90 days" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Awaiting approval" value={stats.pendingApprovals} hint="WhatsApp review cards open" tone={stats.pendingApprovals > 0 ? "accent" : "neutral"} />
        <Stat label="Open website leads" value={stats.openLeads} hint="New, drafting or draft ready" />
        <Stat label="Contacts booked or played" value={booked} hint={`of ${peopleTotal} contacts`} tone="good" />
        <Stat
          label="Top event type · 90 d"
          value={stats.byEventType[0]?.event_type ?? "n/a"}
          hint={stats.byEventType[0] ? `${stats.byEventType[0].total} enquiries` : "No data yet"}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Latest enquiries" actions={<Link href={adminPath("/inquiries")} className="font-jost text-xs uppercase tracking-[0.16em] text-on-dark/60 hover:text-on-dark">View all</Link>}>
          {latest.rows.length === 0 ? (
            <Empty>No enquiries yet.</Empty>
          ) : (
            <Table
              head={
                <tr>
                  <Th>Who</Th>
                  <Th>Event</Th>
                  <Th>Channel</Th>
                  <Th>Status</Th>
                  <Th>When</Th>
                </tr>
              }
            >
              {latest.rows.map((row) => (
                <tr key={row.id} className="hover:bg-surface-dark">
                  <Td>
                    <Link href={adminPath(`/inquiries/${row.id}`)} className="font-medium text-on-dark underline-offset-4 hover:underline">
                      {row.name ?? "Unknown"}
                    </Link>
                    <span className="block text-xs text-on-dark/50">{row.email ?? row.phone ?? ""}</span>
                  </Td>
                  <Td>
                    {row.event_type ?? "—"}
                    <span className="block text-xs text-on-dark/50">{row.event_date_text ?? ""}</span>
                  </Td>
                  <Td><Pill value={row.channel} /></Td>
                  <Td>
                    <Pill value={row.status} />
                    {row.needs_attention ? <Pill value="failed" label="attention" className="ml-1" /> : null}
                  </Td>
                  <Td className="whitespace-nowrap text-on-dark/60">{formatRelative(row.created_at)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title="Needs attention" actions={<Link href={adminPath("/console")} className="font-jost text-xs uppercase tracking-[0.16em] text-on-dark/60 hover:text-on-dark">Console</Link>}>
            {attention.length === 0 ? (
              <Empty>All clear. Nothing has failed or stalled.</Empty>
            ) : (
              <ul className="flex flex-col divide-y divide-on-dark/10">
                {attention.map((row) => (
                  <li key={`${row.kind}-${row.entity_id}`} className="py-3">
                    <Link href={attentionHref(row)} className="block hover:text-cream">
                      <span className="font-sans text-sm font-medium text-on-dark">{row.title}</span>
                      {row.detail ? <span className="mt-0.5 block truncate font-sans text-xs text-on-dark/55">{row.detail}</span> : null}
                      <span className="mt-0.5 block font-jost text-[0.6875rem] uppercase tracking-[0.14em] text-on-dark/45">
                        {row.kind.replace(/_/g, " ")} · {formatRelative(row.at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Pipeline by stage">
            {peopleTotal === 0 ? (
              <Empty>No contacts yet.</Empty>
            ) : (
              <ul className="flex flex-col gap-2">
                {(["new", "contacted", "quoted", "booked", "played", "lost"] as const).map((stage) => {
                  const total = stats.stages.find((row) => row.stage === stage)?.total ?? 0;
                  const width = peopleTotal ? Math.max(2, Math.round((total / peopleTotal) * 100)) : 0;
                  return (
                    <li key={stage} className="grid grid-cols-[6rem_minmax(0,1fr)_2.5rem] items-center gap-3 font-sans text-sm">
                      <span className="capitalize text-on-dark/80">{stage}</span>
                      <span className="h-[8px] overflow-hidden rounded-full bg-surface-darker">
                        <span className={stage === "booked" || stage === "played" ? "block h-full bg-success" : "block h-full bg-cream"} style={{ width: `${width}%` }} />
                      </span>
                      <span className="text-right tabular-nums text-on-dark/70">{total}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Sources · 90 days">
            {stats.bySource.length === 0 ? (
              <Empty>No data yet.</Empty>
            ) : (
              <ul className="flex flex-col gap-1 font-sans text-sm">
                {stats.bySource.map((row) => (
                  <li key={row.source} className="flex justify-between">
                    <span className="text-on-dark/80">{row.source.replace(/_/g, " ")}</span>
                    <span className="tabular-nums text-on-dark/70">{row.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
