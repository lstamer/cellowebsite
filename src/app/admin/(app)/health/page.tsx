import { HealthRecheckForm } from "@/app/admin/(app)/health/HealthForms";
import { Badge, Card, EmptyState, PageHeader, StatCard, formatDateTime, humanise, relativeTime } from "@/components/admin/ui";
import { listHealthSummary, listRecentHealthChecks } from "@/lib/admin/analytics-queries";
import { isAdminSchemaReady, listAdminEvents } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

const TARGET_LABELS: Record<string, string> = {
  site: "Public site (stamer.co.za)",
  supabase: "Supabase",
  telegram: "Telegram bot",
  zernio: "Zernio (WhatsApp)",
  ai_gateway: "AI Gateway",
  trigger: "Trigger.dev config",
  queues: "Work queues",
  api_health: "Internal health endpoint",
};

function pct(value: number | string | null): string {
  if (value === null) return "—";
  return `${Number(value).toFixed(1)}%`;
}

export default async function HealthPage() {
  const [ready, summary, incidents] = await Promise.all([isAdminSchemaReady(), listHealthSummary(), listAdminEvents({ source: "health", limit: 30 })]);
  const histories = await Promise.all(summary.map((row) => listRecentHealthChecks(row.target, 288)));
  const failing = summary.filter((row) => row.current_ok === false);
  const siteRow = summary.find((row) => row.target === "site");

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Site health"
        description="A probe runs every five minutes from Trigger.dev: it loads the public site, checks every integration through the deployed app, and looks for stuck work. State changes ping you on Telegram."
        actions={<HealthRecheckForm />}
      />

      {!ready ? (
        <div className="mb-6">
          <EmptyState title="Database migration pending" body="Run `npx supabase db push` to create health_checks, then deploy the Trigger.dev tasks so the probe starts recording." />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Status" value={summary.length === 0 ? "—" : failing.length === 0 ? "All good" : `${failing.length} failing`} tone={summary.length === 0 ? "default" : failing.length === 0 ? "success" : "danger"} />
        <StatCard label="Site uptime, 24h" value={pct(siteRow?.uptime_24h ?? null)} hint={siteRow?.uptime_7d !== undefined ? `${pct(siteRow.uptime_7d)} over 7 days` : undefined} />
        <StatCard label="Site latency" value={siteRow?.avg_latency_24h ? `${Math.round(Number(siteRow.avg_latency_24h))} ms` : "—"} hint="Average, 24h, from the probe" />
        <StatCard label="Last probe" value={siteRow?.checked_at ? relativeTime(siteRow.checked_at) : "never"} hint={siteRow?.checked_at ? formatDateTime(siteRow.checked_at) : "Deploy the Trigger.dev tasks"} />
      </div>

      <Card title="Targets" eyebrow="Current state and trailing uptime" className="mt-6" padded={false}>
        {summary.length === 0 ? (
          <p className="p-6 font-sans text-sm text-foreground/60">No probe results yet.</p>
        ) : (
          <ul className="divide-y divide-foreground/5">
            {summary.map((row, index) => {
              const history = histories[index];
              return (
                <li key={row.target} className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[14rem_1fr_10rem] md:items-center md:px-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("h-[10px] w-[10px] rounded-full", row.current_ok ? "bg-success" : "bg-error")} aria-hidden />
                      <p className="font-sans text-sm font-semibold text-foreground">{TARGET_LABELS[row.target] ?? humanise(row.target)}</p>
                    </div>
                    <p className="mt-1 font-sans text-xs text-foreground/55">
                      {row.current_ok ? "Healthy" : "Failing"}{row.current_latency_ms !== null ? ` · ${row.current_latency_ms} ms` : ""}{row.checked_at ? ` · ${relativeTime(row.checked_at)}` : ""}
                    </p>
                    {row.current_detail ? <p className="mt-1 break-words font-sans text-xs text-foreground/70">{row.current_detail}</p> : null}
                  </div>
                  <ol className="flex h-[24px] items-stretch gap-[1px] overflow-hidden rounded-md" aria-label={`${row.target} checks, oldest to newest`}>
                    {history.map((check, i) => (
                      <li key={`${check.created_at}-${i}`} className={cn("min-w-[2px] flex-1", check.ok ? "bg-success/70" : "bg-error")} title={`${formatDateTime(check.created_at)}: ${check.ok ? "ok" : "failed"}${check.latency_ms !== null ? `, ${check.latency_ms} ms` : ""}`} />
                    ))}
                  </ol>
                  <div className="flex gap-2 md:justify-end">
                    <Badge tone={Number(row.uptime_24h) >= 99.5 ? "success" : Number(row.uptime_24h) >= 95 ? "warning" : "danger"}>24h {pct(row.uptime_24h)}</Badge>
                    <Badge tone="neutral">7d {pct(row.uptime_7d)}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Incidents" eyebrow="State changes recorded by the probe" className="mt-6">
        {incidents.length === 0 ? (
          <p className="font-sans text-sm text-foreground/60">No incidents recorded.</p>
        ) : (
          <ul className="divide-y divide-foreground/5">
            {incidents.map((event) => (
              <li key={event.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <Badge tone={event.level === "error" ? "danger" : "success"} className="mr-2">{event.kind === "health_failed" ? "Down" : "Recovered"}</Badge>
                  <span className="font-sans text-sm text-foreground/90">{event.message}</span>
                </div>
                <span className="shrink-0 font-sans text-xs text-foreground/50">{formatDateTime(event.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
