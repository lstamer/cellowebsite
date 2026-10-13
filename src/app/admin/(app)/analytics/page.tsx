import Link from "next/link";

import { Badge, formatDateTime, formatRelative, humanise, PageHeader, Panel, Pill, Stat, Table, Td, Th } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";
import { getAnalytics, listRecentSessions } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

export const metadata = { title: "Analytics" };

function percent(part: number, whole: number): string {
  if (!whole) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function AnalyticsPage() {
  const [week, month, sessions] = await Promise.all([getAnalytics(7), getAnalytics(30), listRecentSessions(40)]);
  const maxViews = Math.max(1, ...month.daily.map((day) => day.views));
  const deviceTotal = month.devices.reduce((sum, row) => sum + row.sessions, 0) || 1;
  const { funnel } = month;

  return (
    <>
      <PageHeader
        eyebrow="Traffic"
        title="Analytics"
        description="First-party, cookieless. Sessions are one browser tab; nothing follows a visitor between visits. Vercel Analytics keeps running alongside."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Sessions, 7 days" value={week.totals.sessions} tone="accent" hint={`${week.totals.views} page views`} />
        <Stat label="Sessions, 30 days" value={month.totals.sessions} hint={`${month.totals.views} page views`} />
        <Stat
          label="Booking page → submit"
          value={percent(funnel.submitted, funnel.book_views)}
          hint={`${funnel.submitted} of ${funnel.book_views} sessions, 30 days`}
          href={adminPath("/inquiries?channel=website")}
        />
        <Stat label="Reached step 2" value={percent(funnel.step_2, funnel.book_views)} hint={`${funnel.step_2} sessions started the details step`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel title="Page views by day" eyebrow="Last 30 days" className="xl:col-span-2">
          {month.daily.length === 0 ? (
            <p className="font-sans text-sm text-foreground/60">No visits recorded yet. The beacon starts counting once this branch is live.</p>
          ) : (
            <>
              <ol className="flex h-[12rem] items-end gap-[2px]" aria-label="Page views per day">
                {month.daily.map((day) => (
                  <li key={day.day} className="flex h-full flex-1 flex-col justify-end" title={`${day.day}: ${day.views} views, ${day.sessions} sessions`}>
                    <progress
                      value={day.views}
                      max={maxViews}
                      aria-label={`${day.day}: ${day.views} views`}
                      className="h-full w-full appearance-none [writing-mode:vertical-lr] [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-cream [&::-webkit-progress-value]:bg-primary"
                    />
                  </li>
                ))}
              </ol>
              <div className="mt-2 flex justify-between font-sans text-xs text-foreground/50">
                <span>{month.daily[0].day}</span>
                <span>{month.daily[month.daily.length - 1].day}</span>
              </div>
            </>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-foreground/10 pt-4 sm:grid-cols-4">
            {[
              ["Sessions", month.totals.sessions],
              ["Opened /book", funnel.book_views],
              ["Step 2", funnel.step_2],
              ["Submitted", funnel.submitted],
            ].map(([label, value], index, all) => {
              const previous = index === 0 ? null : Number(all[index - 1][1]);
              return (
                <div key={String(label)}>
                  <p className="font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">{label}</p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
                  {previous !== null ? <p className="font-sans text-xs text-foreground/55">{percent(Number(value), previous)} of previous</p> : null}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Devices and countries" eyebrow="Sessions, 30 days">
          <ul className="space-y-2">
            {["mobile", "tablet", "desktop"].map((device) => {
              const count = month.devices.find((row) => row.device === device)?.sessions ?? 0;
              return (
                <li key={device} className="flex items-center gap-3">
                  <span className="w-20 font-sans text-sm text-foreground/80">{humanise(device)}</span>
                  <progress
                    value={count}
                    max={deviceTotal}
                    aria-label={`${device}: ${count}`}
                    className="h-[8px] flex-1 appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-cream [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary"
                  />
                  <span className="w-12 text-right font-sans text-sm font-semibold">{percent(count, deviceTotal)}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 border-t border-foreground/10 pt-4">
            <ul className="flex flex-wrap gap-2">
              {month.countries.length === 0 ? (
                <li className="font-sans text-sm text-foreground/60">No data yet.</li>
              ) : (
                month.countries.map((row) => (
                  <li key={row.country}>
                    <Badge tone="neutral">
                      {row.country} · {row.sessions}
                    </Badge>
                  </li>
                ))
              )}
            </ul>
          </div>
          {month.sources.some((row) => row.source !== "(none)") ? (
            <div className="mt-5 border-t border-foreground/10 pt-4">
              <p className="font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">Campaign sources</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {month.sources
                  .filter((row) => row.source !== "(none)")
                  .map((row) => (
                    <li key={row.source}>
                      <Badge tone="neutral">
                        {row.source} · {row.sessions}
                      </Badge>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Top pages" eyebrow="Views, 30 days" padded={false}>
          {month.pages.length === 0 ? (
            <p className="p-6 font-sans text-sm text-foreground/60">No data yet.</p>
          ) : (
            <Table
              className="rounded-t-none border-0"
              head={
                <tr>
                  <Th>Path</Th>
                  <Th className="text-right">Views</Th>
                  <Th className="text-right">Sessions</Th>
                </tr>
              }
            >
              {month.pages.map((row) => (
                <tr key={row.path}>
                  <Td className="font-jakarta text-xs">{row.path}</Td>
                  <Td className="text-right tabular-nums">{row.views}</Td>
                  <Td className="text-right tabular-nums">{row.sessions}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
        <Panel title="Referrers" eyebrow="Sessions, 30 days" padded={false}>
          {month.referrers.length === 0 ? (
            <p className="p-6 font-sans text-sm text-foreground/60">No data yet.</p>
          ) : (
            <Table
              className="rounded-t-none border-0"
              head={
                <tr>
                  <Th>Source</Th>
                  <Th className="text-right">Sessions</Th>
                </tr>
              }
            >
              {month.referrers.map((row) => (
                <tr key={row.host}>
                  <Td>{row.host}</Td>
                  <Td className="text-right tabular-nums">{row.sessions}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Panel>
      </div>

      <Panel title="Recent sessions" eyebrow="Last 7 days, the path each visitor took" className="mt-6" padded={false}>
        {sessions.length === 0 ? (
          <p className="p-6 font-sans text-sm text-foreground/60">No sessions yet.</p>
        ) : (
          <Table
            className="rounded-t-none border-0"
            head={
              <tr>
                <Th>Started</Th>
                <Th>From</Th>
                <Th>Device</Th>
                <Th>Path</Th>
                <Th>Outcome</Th>
              </tr>
            }
          >
            {sessions.map((session) => (
              <tr key={session.session_id} className={cn(session.lead_id && "bg-success/10")}>
                <Td className="whitespace-nowrap text-foreground/60">
                  <Link href={adminPath(`/analytics/session/${session.session_id}`)} title={formatDateTime(session.started_at)} className="hover:text-accent">
                    {formatRelative(session.started_at)}
                  </Link>
                </Td>
                <Td>
                  {session.referrer_host ?? "(direct)"}
                  {session.country ? <p className="text-xs text-foreground/50">{session.country}</p> : null}
                </Td>
                <Td>{humanise(session.device)}</Td>
                <Td className="font-jakarta text-xs">{session.paths.join(" → ")}</Td>
                <Td>
                  {session.lead_id ? (
                    <Link href={adminPath(`/inquiries/${session.lead_id}`)}>
                      <Pill value="sent" label="Enquired" />
                    </Link>
                  ) : session.paths.includes("/book") ? (
                    <Pill value="pending" label="Reached /book" />
                  ) : (
                    <span className="text-foreground/40">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
