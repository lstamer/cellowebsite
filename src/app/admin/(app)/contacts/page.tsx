import Link from "next/link";
import { Suspense } from "react";

import { FilterBar } from "@/components/admin/FilterBar";
import { MergeForm } from "@/components/admin/MergeForm";
import { Empty, formatRelative, LinkButton, PageHeader, Pagination, Panel, Pill, Table, Td, Th } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";
import { listPeople } from "@/lib/admin/queries";

export const metadata = { title: "Contacts" };

type Search = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] ?? "" : value ?? "");

export default async function ContactsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const result = await listPeople({
    q: first(params.q),
    stage: first(params.stage),
    archived: first(params.archived) === "1",
    page: Number(first(params.page)) || 1,
  });

  function makeHref(page: number) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const single = first(value);
      if (single && key !== "page") search.set(key, single);
    }
    search.set("page", String(page));
    return `${adminPath("/contacts")}?${search.toString()}`;
  }

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Contacts"
        description="One row per human, whichever channel they arrived through. Stage, tags and notes live here; enquiries and WhatsApp threads hang off it."
        actions={
          <>
            <LinkButton href={adminPath("/contacts?archived=1")}>Archived</LinkButton>
            <LinkButton href={adminPath("/contacts/new")} variant="primary">Add contact</LinkButton>
          </>
        }
      />

      <Suspense>
        <FilterBar
          searchPlaceholder="Name, email or phone"
          filters={[
            { name: "stage", label: "Stage", options: ["new", "contacted", "quoted", "booked", "played", "lost"].map((value) => ({ value, label: value })) },
          ]}
        />
      </Suspense>

      {result.rows.length === 0 ? (
        <Empty>No contacts match.</Empty>
      ) : (
        <Table
          head={
            <tr>
              <Th>Name</Th>
              <Th>Reach</Th>
              <Th>Stage</Th>
              <Th>Tags</Th>
              <Th>Activity</Th>
              <Th>Last active</Th>
            </tr>
          }
        >
          {result.rows.map((person) => (
            <tr key={person.id} className="hover:bg-surface-dark">
              <Td>
                <Link href={adminPath(`/contacts/${person.id}`)} className="font-medium text-on-dark underline-offset-4 hover:underline">
                  {person.display_name ?? person.email ?? person.phone_e164 ?? "Unnamed"}
                </Link>
                {person.source ? <span className="block text-xs text-on-dark/50">{person.source.replace(/_/g, " ")}</span> : null}
              </Td>
              <Td>
                {person.email ? <span className="block">{person.email}</span> : null}
                {person.phone_e164 ? <span className="block text-on-dark/70">{person.phone_e164}</span> : null}
              </Td>
              <Td><Pill value={person.stage} /></Td>
              <Td>
                {person.tags.length === 0 ? <span className="text-on-dark/40">—</span> : person.tags.map((tag) => (
                  <span key={tag} className="mr-1 inline-block rounded-full border border-on-dark/20 px-[0.6em] py-[0.1em] font-jost text-xs text-on-dark/80">
                    {tag}
                  </span>
                ))}
              </Td>
              <Td className="whitespace-nowrap text-on-dark/70">
                {person.lead_count} form{person.lead_count === 1 ? "" : "s"} · {person.conversation_count} WhatsApp
              </Td>
              <Td className="whitespace-nowrap text-on-dark/60">{formatRelative(person.last_activity_at ?? person.updated_at)}</Td>
            </tr>
          ))}
        </Table>
      )}

      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} makeHref={makeHref} />

      <Panel title="Merge duplicates" className="mt-8">
        <p className="mb-4 font-sans text-sm text-on-dark/60">
          When the same person exists twice (say, an email-only form entry and a WhatsApp number), keep one and fold the other in. Enquiries, threads, tags and notes move across; the dropped row is deleted.
        </p>
        <MergeForm />
      </Panel>
    </>
  );
}
