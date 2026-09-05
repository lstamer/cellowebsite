import { Badge, Card, EmptyState, PageHeader, StatCard, Table, Td, Th, formatDateTime, humanise, relativeTime } from "@/components/admin/ui";
import { getAdminBasePath } from "@/lib/admin/auth";
import { getBookingFunnel, getVisitSummary, listDailyVisits, listRecentSessions, listTopPaths, listTopReferrers } from "@/lib/admin/analytics-queries";
import { isAdminSchemaReady } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

function percent(part: number, whole: number): string {
  if (whole === 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function AnalyticsPage() {
  const base = await getAdminBasePath();
  const [ready, summary, daily, paths, referrers, funnel, sessions] = await Promise.all([
    isAdminSchemaReady(),
    getVisitSummary(),
    listDailyVisits(30),
    listTopPaths(),
    listTopReferrers(),
    getBookingFunnel(30),
    listRecentSessions(40),
  ]);
  const maxViews = Math.max(1, ...daily.map((day) => day.views));
  const deviceTotal = Object.values(summary.devices).reduce((sum, n) => sum + n, 0) || 1;

  return (
    <>
      <PageHeader
        eyebrow="Traffic"
        title="Analytics"
        description="First-party, cookieless. Sessions are one browser tab; nothing follows a visitor between visits. Vercel Analytics keeps running alongside."
      />

      {!ready ? (
        <div className="mb-6">
          <EmptyState title="Database migration pending" body="Run `npx supabase db push` to create the analytics tables. The tracker on the site is already sending beacons; they are dropped until then." />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Sessions, 7 days" value={summary.sessions7d} tone="accent" hint={`${summary.views7d} page views`} />
        <StatCard label="Sessions, 30 days" value={summary.sessions30d} hint={`${summary.views30d} page views`} />
        <StatCard label="Booking page → submit" value={percent(funnel.submitted, funnel.bookViews)} hint={`${funnel.submitted} of ${funnel.bookViews} sessions, 30 days`} href={`${base}/inquiries?channel=website`} />
        <StatCard label="Reached step 2" value={percent(funnel.step2, funnel.bookViews)} hint={`${funnel.step2} sessions started the details step`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Page views by day" eyebrow="Last 30 days" className="xl:col-span-2">
          {daily.length === 0 ? (
            <p className="font-sans text-sm text-foreground/60">No visits recorded yet.</p>
          ) : (
            <ol className="flex h-[12rem] items-end gap-[2px]" aria-label="Page views per day">
              {daily.map((day) => (
                <li key={day.day} className="group relative flex h-full flex-1 flex-col justify-end" title={`${day.day}: ${day.views} views, ${day.sessions} sessions`}>
                  <progress
                    value={day.views}
                    max={maxViews}
                    aria-label={`${day.day}: ${day.views} views`}
                    className="h-full w-full appearance-none [writing-mode:vertical-lr] [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-cream [&::-webkit-progress-value]:bg-primary"
                  />
                </li>
              ))}
            </ol>
          )}
          {daily.length > 0 ? (
            <div className="mt-2 flex justify-between font-sans text-xs text-foreground/50">
              <span>{daily[0].day}</span>
              <span>{daily[daily.length - 1].day}</span>
            </div>
          ) : null}
        </Card>

        <Card title="Devices and countries" eyebrow="Sessions, 30 days">
          <ul className="space-y-2">
            {["mobile", "tablet", "desktop"].map((device) => {
              const count = summary.devices[device] ?? 0;
              return (
                <li key={device} className="flex items-center gap-3">
                  <span className="w-20 font-sans text-sm text-foreground/80">{humanise(device)}</span>
                  <progress value={count} max={deviceTotal} aria-label={`${device}: ${count}`} className="h-[8px] flex-1 appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-cream [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary" />
                  <span className="w-12 text-right font-sans text-sm font-semibold">{percent(count, deviceTotal)}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 border-t border-foreground/10 pt-4">
            <ul className="flex flex-wrap gap-2">
              {summary.countries.length === 0 ? <li className="font-sans text-sm text-foreground/60">No data yet.</li> : summary.countries.map((row) => (
                <li key={row.country}><Badge tone="neutral">{row.country} · {row.sessions}</Badge></li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Top pages" eyebrow="Views, 30 days" padded={false}>
          {paths.length === 0 ? <p className="p-6 font-sans text-sm text-foreground/60">No data yet.</p> : (
            <Table className="rounded-t-none border-0">
              <thead><tr><Th>Path</Th><Th className="text-right">Views</Th><Th className="text-right">Sessions</Th></tr></thead>
              <tbody>
                {paths.map((row) => (
                  <tr key={row.path}><Td className="font-jakarta text-xs">{row.path}</Td><Td className="text-right">{row.views}</Td><Td className="text-right">{row.sessions}</Td></tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <Card title="Referrers" eyebrow="Sessions, 30 days" padded={false}>
          {referrers.length === 0 ? <p className="p-6 font-sans text-sm text-foreground/60">No data yet.</p> : (
            <Table className="rounded-t-none border-0">
              <thead><tr><Th>Source</Th><Th className="text-right">Sessions</Th></tr></thead>
              <tbody>
                {referrers.map((row) => (
                  <tr key={row.referrer_host}><Td>{row.referrer_host}</Td><Td className="text-right">{row.sessions}</Td></tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <Card title="Recent sessions" eyebrow="Last 7 days, the path each visitor took" className="mt-6" padded={false}>
        {sessions.length === 0 ? <p className="p-6 font-sans text-sm text-foreground/60">No sessions yet.</p> : (
          <Table className="rounded-t-none border-0">
            <thead><tr><Th>Started</Th><Th>From</Th><Th>Device</Th><Th>Path</Th><Th>Outcome</Th></tr></thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.session_id} className={cn(session.converted && "bg-success/10")}>
                  <Td className="whitespace-nowrap text-foreground/60"><span title={formatDateTime(session.started_at)}>{relativeTime(session.started_at)}</span></Td>
                  <Td>{session.referrer_host ?? "(direct)"}{session.country ? <p className="text-xs text-foreground/50">{session.country}</p> : null}</Td>
                  <Td>{humanise(session.device)}</Td>
                  <Td className="font-jakarta text-xs">{session.paths.join(" → ")}</Td>
                  <Td>{session.converted ? <Badge tone="success">Enquired</Badge> : session.paths.includes("/book") ? <Badge tone="warning">Reached /book</Badge> : <span className="text-foreground/40">—</span>}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
