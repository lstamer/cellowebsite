import Link from "next/link";

import { Badge, EmptyState, LinkButton, PageHeader, Table, Td, Th, formatDateTime, humanise, statusTone } from "@/components/admin/ui";
import { getAdminBasePath } from "@/lib/admin/auth";
import { listInquiries } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

const CHANNELS = [
  { value: "", label: "All channels" },
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; channel?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const base = await getAdminBasePath();
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const limit = 50;
  const channel = params.channel === "website" || params.channel === "whatsapp" || params.channel === "email" ? params.channel : undefined;
  const rows = await listInquiries({
    q: params.q?.trim() || undefined,
    channel,
    status: params.status?.trim() || undefined,
    limit,
    offset: (page - 1) * limit,
  });

  const query = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { q: params.q, channel: params.channel, status: params.status, page: undefined as string | undefined, ...overrides };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const qs = next.toString();
    return `${base}/inquiries${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Inquiries"
        description="Every enquiry ever received, across the booking form, the home-page form and WhatsApp."
      />

      <form method="get" action={`${base}/inquiries`} className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
        <label className="flex-1">
          <span className="mb-1.5 block font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Name, email, phone, venue or message"
            className="w-full rounded-xl border border-foreground/15 bg-background px-[0.9em] py-[0.6em] font-sans text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </label>
        {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
        {params.channel ? <input type="hidden" name="channel" value={params.channel} /> : null}
        <button
          type="submit"
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-[1.25em] py-[0.5em] font-sans text-sm font-medium text-on-dark hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {CHANNELS.map((option) => (
          <Link
            key={option.value}
            href={query({ channel: option.value || undefined })}
            className={cn(
              "rounded-full border px-[0.9em] py-[0.35em] font-sans text-sm transition-colors",
              (params.channel ?? "") === option.value
                ? "border-primary bg-primary text-on-dark"
                : "border-foreground/15 bg-background text-foreground/80 hover:border-foreground/40",
            )}
          >
            {option.label}
          </Link>
        ))}
        {params.status ? (
          <Link href={query({ status: undefined })} className="rounded-full border border-accent px-[0.9em] py-[0.35em] font-sans text-sm text-accent-ink">
            Status: {humanise(params.status)} ×
          </Link>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No enquiries match" body="Try a different search or clear the filters." action={<LinkButton href={`${base}/inquiries`}>Clear filters</LinkButton>} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>When</Th>
              <Th>Who</Th>
              <Th>Channel</Th>
              <Th>Event</Th>
              <Th>Where</Th>
              <Th>Status</Th>
              <Th>Alert</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.channel}-${row.id}`} className="hover:bg-cream/60">
                <Td className="whitespace-nowrap text-foreground/60">{formatDateTime(row.created_at)}</Td>
                <Td>
                  <Link href={`${base}/inquiries/${row.id}`} className="font-semibold text-foreground hover:text-accent">
                    {row.contact_name ?? "Unknown"}
                  </Link>
                  <p className="text-xs text-foreground/60">{row.email ?? row.phone ?? ""}</p>
                  {row.preview ? <p className="mt-1 line-clamp-1 max-w-xs text-xs text-foreground/55">{row.preview}</p> : null}
                </Td>
                <Td>
                  <Badge tone={row.channel === "whatsapp" ? "success" : row.channel === "email" ? "warning" : "info"}>{row.channel}</Badge>
                  {row.origin ? <p className="mt-1 text-xs text-foreground/55">{humanise(row.origin)}</p> : null}
                </Td>
                <Td>
                  {row.event_type ?? "—"}
                  {row.event_date_text ? <p className="text-xs text-foreground/60">{row.event_date_text}</p> : null}
                </Td>
                <Td className="max-w-[12rem] truncate">{row.location ?? "—"}</Td>
                <Td>
                  <Link href={query({ status: row.status })}>
                    <Badge tone={statusTone(row.status)}>{humanise(row.status)}</Badge>
                  </Link>
                </Td>
                <Td>{row.alert_status ? <Badge tone={statusTone(row.alert_status)}>{humanise(row.alert_status)}</Badge> : <span className="text-foreground/40">—</span>}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="font-sans text-xs text-foreground/55">Page {page}</span>
        <div className="flex gap-2">
          {page > 1 ? <LinkButton href={query({ page: String(page - 1) })}>Newer</LinkButton> : null}
          {rows.length === limit ? <LinkButton href={query({ page: String(page + 1) })}>Older</LinkButton> : null}
        </div>
      </div>
    </>
  );
}
