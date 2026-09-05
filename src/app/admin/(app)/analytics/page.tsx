import Link from "next/link";

import { Empty, formatRelative, PageHeader, Panel, Stat, Table, Td, Th } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";
import { getAnalytics, listRecentLeadSessions } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

export const metadata = { title: "Analytics" };

type Search = Record<string, string | string[] | undefined>;

function Bars({ rows, labelKey, valueKey, total }: { rows: Array<Record<string, string | number>>; labelKey: string; valueKey: string; total: number }) {
  if (rows.length === 0) return <Empty>No data in this window.</Empty>;
  const max = Math.max(...rows.map((row) => Number(row[valueKey])), 1);
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => {
        const value = Number(row[valueKey]);
        const share = total ? Math.round((value / total) * 100) : 0;
        return (
          <li key={String(row[labelKey])} className="grid grid-cols-[minmax(0,1fr)_3rem_3rem] items-center gap-3 font-sans text-sm">
            <span className="min-w-0">
              <span className="block truncate text-on-dark/85">{String(row[labelKey])}</span>
              <span className="mt-1 block h-[6px] overflow-hidden rounded-full bg-surface-darker">
                <span className="block h-full bg-cream" style={{ width: `${Math.max(2, Math.round((value / max) * 100))}%` }} />
              </span>
            </span>
            <span className="text-right tabular-nums text-on-dark/80">{value}</span>
            <span className="text-right tabular-nums text-on-dark/50">{share}%</span>
          </li>
        );
      })}
    </ul>
  );
}

function DailyChart({ daily }: { daily: Array<{ day: string; views: number; sessions: number }> }) {
  if (daily.length === 0) return <Empty>No page views recorded yet. The beacon starts counting once this branch is live.</Empty>;
  const max = Math.max(...daily.map((row) => row.views), 1);
  const width = 600;
  const height = 140;
  const step = width / Math.max(daily.length, 1);
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full min-w-[20rem]" role="img" aria-label="Daily page views">
        {daily.map((row, index) => {
          const barHeight = Math.max(2, Math.round((row.views / max) * (height - 24)));
          const sessionHeight = Math.max(1, Math.round((row.sessions / max) * (height - 24)));
          const x = index * step + step * 0.15;
          const barWidth = step * 0.7;
          return (
            <g key={row.day}>
              <title>{`${row.day}: ${row.views} views, ${row.sessions} sessions`}</title>
              <rect x={x} y={height - 20 - barHeight} width={barWidth} height={barHeight} className="fill-on-dark/25" />
              <rect x={x} y={height - 20 - sessionHeight} width={barWidth} height={sessionHeight} className="fill-cream" />
            </g>
          );
        })}
        <text x={0} y={height - 4} className="fill-on-dark/50 font-jost text-[10px]">{daily[0]?.day}</text>
        <text x={width} y={height - 4} textAnchor="end" className="fill-on-dark/50 font-jost text-[10px]">{daily[daily.length - 1]?.day}</text>
      </svg>
      <p className="mt-1 font-sans text-xs text-on-dark/50">Cream = sessions, grey = page views.</p>
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const requested = Number(Array.isArray(params.days) ? params.days[0] : params.days);
  const days = [7, 30, 90].includes(requested) ? requested : 30;
  const [summary, leadSessions] = await Promise.all([getAnalytics(days), listRecentLeadSessions(15)]);

  const { totals, funnel } = summary;
  const rate = (numerator: number, denominator: number) => (denominator ? `${Math.round((numerator / denominator) * 100)}%` : "n/a");

  return (
    <>
      <PageHeader
        eyebrow="Visitors"
        title="Who came through the site"
        description="First-party and cookieless: page, referrer, device class, country, and a random per-tab id. Nothing here identifies a person until they submit a form."
        actions={
          <div className="flex gap-1 rounded-full border border-on-dark/20 p-1">
            {[7, 30, 90].map((option) => (
              <Link
                key={option}
                href={adminPath(`/analytics?days=${option}`)}
                className={cn(
                  "rounded-full px-[1em] py-[0.45em] font-sans text-sm",
                  option === days ? "bg-cream text-primary" : "text-on-dark/70 hover:text-on-dark",
                )}
              >
                {option} d
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Sessions" value={totals.sessions} hint={`${totals.views} page views`} tone="accent" />
        <Stat label="Reached /book" value={funnel.book_views} hint={rate(funnel.book_views, totals.sessions) + " of sessions"} />
        <Stat label="Submitted the form" value={funnel.submitted} hint={`${rate(funnel.submitted, funnel.book_views)} of /book visits`} tone="good" />
        <Stat label="Tapped WhatsApp" value={funnel.whatsapp_clicks} hint="FAB or mobile bar" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <Panel title="Daily traffic">
            <DailyChart daily={summary.daily} />
          </Panel>

          <Panel title="Booking funnel">
            <ol className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              {[
                ["Sessions", totals.sessions],
                ["Opened /book", funnel.book_views],
                ["Step 2", funnel.step_2],
                ["Submitted", funnel.submitted],
              ].map(([label, value], index, all) => {
                const previous = index === 0 ? null : Number(all[index - 1][1]);
                return (
                  <li key={String(label)} className="rounded-input border border-on-dark/10 bg-surface-darker p-4">
                    <p className="font-jost text-[0.6875rem] uppercase tracking-[0.16em] text-on-dark/50">{label}</p>
                    <p className="mt-1 font-serif text-3xl italic tabular-nums">{value}</p>
                    {previous !== null ? <p className="font-sans text-xs text-on-dark/50">{rate(Number(value), previous)} of previous</p> : null}
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 font-sans text-xs text-on-dark/50">
              {totals.leads} lead{totals.leads === 1 ? "" : "s"} stored in this window (includes submissions without a beacon session).
            </p>
          </Panel>

          <Panel title="Top pages">
            <Bars rows={summary.pages} labelKey="path" valueKey="sessions" total={totals.sessions} />
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Referrers">
            <Bars rows={summary.referrers} labelKey="host" valueKey="sessions" total={totals.sessions} />
          </Panel>
          <Panel title="Campaign sources (utm_source)">
            <Bars rows={summary.sources} labelKey="source" valueKey="sessions" total={totals.sessions} />
          </Panel>
          <Panel title="Devices">
            <Bars rows={summary.devices} labelKey="device" valueKey="sessions" total={totals.sessions} />
          </Panel>
          <Panel title="Countries">
            <Bars rows={summary.countries} labelKey="country" valueKey="sessions" total={totals.sessions} />
          </Panel>
        </div>
      </div>

      <Panel title="Recent leads with a recorded path" className="mt-6">
        {leadSessions.length === 0 ? (
          <Empty>No lead has carried a session id yet.</Empty>
        ) : (
          <Table
            head={
              <tr>
                <Th>Lead</Th>
                <Th>Source</Th>
                <Th>When</Th>
                <Th>Path</Th>
              </tr>
            }
          >
            {leadSessions.map((lead) => (
              <tr key={lead.id} className="hover:bg-surface-dark">
                <Td>
                  <Link href={adminPath(`/inquiries/${lead.id}`)} className="font-medium text-on-dark underline-offset-4 hover:underline">
                    {lead.first_name}
                  </Link>
                </Td>
                <Td>{lead.source === "lead_form" ? "Booking form" : "Contact form"}</Td>
                <Td className="text-on-dark/60">{formatRelative(lead.created_at)}</Td>
                <Td>
                  <Link href={adminPath(`/analytics/session/${lead.session_id}`)} className="font-mono text-xs text-on-dark/70 underline-offset-4 hover:underline">
                    {lead.session_id}
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
