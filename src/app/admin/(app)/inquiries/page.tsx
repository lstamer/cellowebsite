import Link from "next/link";
import { Suspense } from "react";

import { FilterBar } from "@/components/admin/FilterBar";
import { Empty, formatRelative, PageHeader, Pagination, Pill, Table, Td, Th } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";
import { listInquiries, type Channel } from "@/lib/admin/queries";

export const metadata = { title: "Enquiries" };

const STATUS_OPTIONS = [
  "new",
  "drafting",
  "draft_ready",
  "approved",
  "dismissed",
  "expired",
  "pending_review",
  "sent",
  "send_uncertain",
].map((value) => ({ value, label: value.replace(/_/g, " ") }));

const STAGE_OPTIONS = ["new", "contacted", "quoted", "booked", "played", "lost"].map((value) => ({ value, label: value }));

type Search = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const channelParam = first(params.channel);
  const channel: Channel | "" = channelParam === "website" || channelParam === "whatsapp" ? channelParam : "";
  const filters = {
    channel,
    status: first(params.status),
    stage: first(params.stage),
    eventType: first(params.type),
    q: first(params.q),
    attention: first(params.attention) === "1",
    page: Number(first(params.page)) || 1,
  };
  const result = await listInquiries(filters);

  function makeHref(page: number) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const single = first(value);
      if (single && key !== "page") search.set(key, single);
    }
    search.set("page", String(page));
    return `${adminPath("/inquiries")}?${search.toString()}`;
  }

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Enquiries"
        description="Every website form and WhatsApp conversation, newest first. Filter by channel, status or stage, or search by name, email, phone or venue."
        actions={
          <Link
            href={adminPath(`/inquiries?attention=1`)}
            className="inline-flex min-h-11 items-center rounded-full border border-on-dark/25 px-[1.25em] py-[0.6em] font-sans text-sm text-on-dark hover:border-on-dark"
          >
            Only needs attention
          </Link>
        }
      />

      <Suspense>
        <FilterBar
          searchPlaceholder="Name, email, phone, venue…"
          filters={[
            { name: "channel", label: "Channel", options: [{ value: "website", label: "Website" }, { value: "whatsapp", label: "WhatsApp" }] },
            { name: "status", label: "Status", options: STATUS_OPTIONS },
            { name: "stage", label: "Stage", options: STAGE_OPTIONS },
          ]}
        />
      </Suspense>

      {result.rows.length === 0 ? (
        <Empty>No enquiries match these filters.</Empty>
      ) : (
        <Table
          head={
            <tr>
              <Th className="w-[34%]">Who</Th>
              <Th>Event</Th>
              <Th className="hidden xl:table-cell">Where</Th>
              <Th>Channel</Th>
              <Th>Status</Th>
              <Th>Stage</Th>
              <Th>Received</Th>
            </tr>
          }
        >
          {result.rows.map((row) => (
            <tr key={row.id} className="hover:bg-surface-dark">
              <Td>
                <Link href={adminPath(`/inquiries/${row.id}`)} className="font-medium text-on-dark underline-offset-4 hover:underline">
                  {row.name ?? "Unknown"}
                </Link>
                <span className="block text-xs text-on-dark/50">{row.email ?? row.phone ?? ""}</span>
                {row.summary ? <span className="mt-1 block max-w-xs truncate text-xs text-on-dark/60">{row.summary}</span> : null}
              </Td>
              <Td>
                {row.event_type ?? "—"}
                <span className="block text-xs text-on-dark/50">{row.event_date_text ?? ""}</span>
              </Td>
              <Td className="hidden max-w-[12rem] truncate xl:table-cell">{row.location ?? "—"}</Td>
              <Td><Pill value={row.channel} /></Td>
              <Td>
                <Pill value={row.status} />
                {row.needs_attention ? <Pill value="failed" label="attention" className="ml-1" /> : null}
              </Td>
              <Td>{row.stage ? <Pill value={row.stage} /> : <span className="text-on-dark/40">—</span>}</Td>
              <Td className="whitespace-nowrap text-on-dark/60">{formatRelative(row.created_at)}</Td>
            </tr>
          ))}
        </Table>
      )}

      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} makeHref={makeHref} />
    </>
  );
}
