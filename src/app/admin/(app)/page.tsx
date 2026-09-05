import Link from "next/link";

import { Badge, Card, EmptyState, PageHeader, StatCard, Table, Td, Th, formatDateTime, humanise, relativeTime, statusTone } from "@/components/admin/ui";
import { getAdminBasePath } from "@/lib/admin/auth";
import { getDashboardStats, isAdminSchemaReady, listInquiries, listNeedsAttention } from "@/lib/admin/queries";

const ATTENTION_LINKS: Record<string, (base: string, id: string) => string> = {
  lead_alert_failed: (base, id) => `${base}/inquiries/${id}`,
  lead_draft_ready: (base, id) => `${base}/inquiries/${id}`,
  approval_pending: (base) => `${base}/console`,
  send_uncertain: (base) => `${base}/console`,
  outbox_failed: (base) => `${base}/console`,
  event_error: (base) => `${base}/console`,
};

export default async function DashboardPage() {
  const base = await getAdminBasePath();
  const ready = await isAdminSchemaReady();
  const [stats, attention, latest] = await Promise.all([
    getDashboardStats(),
    listNeedsAttention(8),
    listInquiries({ limit: 8 }),
  ]);

  const stageOrder = ["new", "contacted", "quoted", "booked", "played", "lost"];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Every enquiry from the website and WhatsApp, what needs you, and how the pipeline is moving."
      />

      {!ready ? (
        <div className="mb-6">
          <EmptyState
            title="Database migration pending"
            body="The admin tables have not been created yet. Run `npx supabase db push` from the repo, then reload. Existing enquiries still show below."
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Enquiries, 7 days" value={stats.inquiries7d} tone="accent" href={`${base}/inquiries`} />
        <StatCard label="Enquiries, 30 days" value={stats.inquiries30d} hint={`${stats.website30d} website, ${stats.whatsapp30d} WhatsApp`} href={`${base}/inquiries`} />
        <StatCard
          label="Needs attention"
          value={attention.length}
          tone={attention.length > 0 ? "danger" : "success"}
          hint={attention.length > 0 ? "Open the console" : "All clear"}
          href={`${base}/console`}
        />
        <StatCard
          label="Alert latency"
          value={stats.medianAlertSeconds === null ? "—" : `${Math.round(stats.medianAlertSeconds)}s`}
          hint="Median form to Telegram, 30 days"
          href={`${base}/health`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Needs attention" eyebrow="Now" className="xl:col-span-2">
          {attention.length === 0 ? (
            <p className="font-sans text-sm text-foreground/60">Nothing is waiting on you.</p>
          ) : (
            <ul className="divide-y divide-foreground/5">
              {attention.map((row) => {
                const href = (ATTENTION_LINKS[row.kind] ?? ATTENTION_LINKS.event_error)(base, row.ref_id);
                return (
                  <li key={`${row.kind}-${row.ref_id}`} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <Link href={href} className="font-sans text-sm font-semibold text-foreground hover:text-accent">
                        {row.title}
                      </Link>
                      {row.detail ? <p className="mt-0.5 truncate font-sans text-xs text-foreground/60">{row.detail}</p> : null}
                    </div>
                    <span className="shrink-0 font-sans text-xs text-foreground/50">{relativeTime(row.created_at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Pipeline" eyebrow="Contacts by stage">
          <ul className="space-y-2">
            {stageOrder.map((stage) => {
              const count = stats.byStage[stage] ?? 0;
              const total = Object.values(stats.byStage).reduce((sum, n) => sum + n, 0) || 1;
              return (
                <li key={stage} className="flex items-center gap-3">
                  <span className="w-24 font-sans text-sm text-foreground/80">{humanise(stage)}</span>
                  <progress
                    value={count}
                    max={total}
                    aria-label={`${humanise(stage)}: ${count}`}
                    className="h-[8px] flex-1 appearance-none overflow-hidden rounded-full bg-cream [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-cream [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary"
                  />
                  <span className="w-8 text-right font-sans text-sm font-semibold">{count}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 border-t border-foreground/10 pt-4">
            <p className="font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">Event types, 30 days</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {stats.byEventType.length === 0 ? (
                <li className="font-sans text-sm text-foreground/60">No enquiries yet.</li>
              ) : (
                stats.byEventType.map((item) => (
                  <li key={item.label}>
                    <Badge tone="neutral">
                      {item.label} · {item.count}
                    </Badge>
                  </li>
                ))
              )}
            </ul>
          </div>
        </Card>
      </div>

      <Card title="Latest enquiries" eyebrow="Recent" className="mt-6" padded={false}>
        {latest.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No enquiries yet" body="Website form submissions and WhatsApp messages will show here." />
          </div>
        ) : (
          <Table className="rounded-t-none border-x-0 border-b-0">
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Who</Th>
                <Th>Channel</Th>
                <Th>Event</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {latest.map((row) => (
                <tr key={`${row.channel}-${row.id}`} className="hover:bg-cream/60">
                  <Td className="whitespace-nowrap text-foreground/60">{formatDateTime(row.created_at)}</Td>
                  <Td>
                    <Link href={`${base}/inquiries/${row.id}`} className="font-semibold text-foreground hover:text-accent">
                      {row.contact_name ?? "Unknown"}
                    </Link>
                    <p className="text-xs text-foreground/60">{row.email ?? row.phone ?? ""}</p>
                  </Td>
                  <Td>
                    <Badge tone={row.channel === "whatsapp" ? "success" : "info"}>{row.channel}</Badge>
                  </Td>
                  <Td>
                    {row.event_type ?? "—"}
                    {row.event_date_text ? <p className="text-xs text-foreground/60">{row.event_date_text}</p> : null}
                  </Td>
                  <Td>
                    <Badge tone={statusTone(row.status)}>{humanise(row.status)}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
