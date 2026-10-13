import { bucketHalfHours, Empty, formatDateTime, formatRelative, PageHeader, Panel, Pill, Stat } from "@/components/admin/ui";
import { getHealthSamples, getHealthState, listHealthIncidents } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

export const metadata = { title: "Health" };

const CHECK_LABELS: Record<string, string> = {
  site: "stamer.co.za homepage",
  api_health: "/api/health round-trip",
  supabase: "Supabase",
  telegram: "Telegram bot",
  zernio: "Zernio (WhatsApp)",
  ai_gateway: "AI Gateway",
  lead_alerts: "Lead alerts delivered",
  approvals: "WhatsApp approvals",
  outbox: "Outbox",
  data_checks: "Data checks",
};

function UptimeBar({ samples }: { samples: Array<{ ok: boolean; created_at: string }> }) {
  if (samples.length === 0) return <span className="font-sans text-xs text-foreground/50">no samples</span>;
  const buckets = bucketHalfHours(samples);
  return (
    <span className="flex h-[16px] gap-[2px]" aria-hidden>
      {buckets.map((bucket, index) => (
        <span
          key={index}
          className={cn(
            "flex-1 rounded-[2px]",
            bucket === null ? "bg-cream" : bucket ? "bg-success" : "bg-accent",
          )}
        />
      ))}
    </span>
  );
}

export default async function HealthPage() {
  const [state, samples, incidents] = await Promise.all([getHealthState(), getHealthSamples(24), listHealthIncidents(30)]);
  const failing = state.filter((row) => !row.ok);
  const bySample = new Map<string, Array<{ ok: boolean; created_at: string; latency_ms: number | null }>>();
  for (const sample of samples) {
    const list = bySample.get(sample.check) ?? [];
    list.push(sample);
    bySample.set(sample.check, list);
  }
  const uptime = (check: string) => {
    const list = bySample.get(check) ?? [];
    if (list.length === 0) return null;
    return Math.round((list.filter((sample) => sample.ok).length / list.length) * 1000) / 10;
  };
  const latestProbe = state.reduce<string | null>((latest, row) => (!latest || row.last_checked_at > latest ? row.last_checked_at : latest), null);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Site health"
        description="A probe runs every five minutes from Trigger.dev: it loads the public site, checks every integration through the deployed app, and looks for stuck work. State changes ping you on Telegram."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Checks" value={state.length} hint={latestProbe ? `Last probe ${formatRelative(latestProbe)}` : "No probe has run yet"} />
        <Stat label="Failing" value={failing.length} tone={failing.length ? "bad" : "good"} hint={failing.map((row) => CHECK_LABELS[row.check] ?? row.check).join(", ") || "None"} />
        <Stat label="Site uptime · 24 h" value={uptime("site") === null ? "n/a" : `${uptime("site")}%`} tone="good" />
        <Stat label="Homepage TTFB" value={state.find((row) => row.check === "site")?.last_latency_ms != null ? `${state.find((row) => row.check === "site")?.last_latency_ms} ms` : "n/a"} />
      </div>

      <Panel title="Checks" className="mt-6">
        {state.length === 0 ? (
          <Empty>
            No health data yet. Deploy the `health-probe` task (trigger/admin.ts) and set HEALTH_PROBE_SECRET on Vercel and trigger.dev; results appear within five minutes.
          </Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-foreground/10">
            {state.map((row) => (
              <li key={row.check} className="grid grid-cols-1 gap-2 py-3 md:grid-cols-[14rem_minmax(0,1fr)_8rem] md:items-center md:gap-4">
                <div className="flex items-center gap-2">
                  <Pill value={row.ok ? "ok" : "failed"} label={row.ok ? "ok" : "failing"} />
                  <span className="font-sans text-sm text-foreground">{CHECK_LABELS[row.check] ?? row.check}</span>
                </div>
                <div>
                  <UptimeBar samples={bySample.get(row.check) ?? []} />
                  <p className="mt-1 font-sans text-xs text-foreground/50">
                    {row.ok ? "Up" : "Down"} since {formatDateTime(row.since)} · checked {formatRelative(row.last_checked_at)}
                    {row.last_latency_ms != null ? ` · ${row.last_latency_ms} ms` : ""}
                    {typeof row.last_detail.message === "string" && !row.ok ? ` · ${row.last_detail.message}` : ""}
                  </p>
                </div>
                <p className="font-sans text-sm tabular-nums text-foreground/70 md:text-right">
                  {uptime(row.check) === null ? "—" : `${uptime(row.check)}% · 24 h`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Incidents" className="mt-6">
        {incidents.length === 0 ? (
          <Empty>No state changes recorded.</Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-foreground/10 font-sans text-sm">
            {incidents.map((event) => (
              <li key={event.id} className="flex flex-wrap items-center gap-2 py-2">
                <Pill value={event.kind === "health_recovered" ? "ok" : "failed"} label={event.kind === "health_recovered" ? "recovered" : "failing"} />
                <span className="text-foreground/85">{event.message}</span>
                <span className="text-xs text-foreground/50">{formatDateTime(event.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
