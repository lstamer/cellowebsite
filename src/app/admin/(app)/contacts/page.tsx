import Link from "next/link";

import { Badge, EmptyState, LinkButton, PageHeader, Table, Td, Th, humanise, relativeTime, statusTone } from "@/components/admin/ui";
import { getAdminBasePath } from "@/lib/admin/auth";
import { listPeople } from "@/lib/admin/queries";
import { cn } from "@/lib/utils";

const STAGES = ["", "new", "contacted", "quoted", "booked", "played", "lost"];

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stage?: string; archived?: string }>;
}) {
  const params = await searchParams;
  const base = await getAdminBasePath();
  const people = await listPeople({
    q: params.q?.trim() || undefined,
    stage: params.stage || undefined,
    includeArchived: params.archived === "1",
    limit: 200,
  });

  const link = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { q: params.q, stage: params.stage, archived: params.archived, ...overrides };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const qs = next.toString();
    return `${base}/contacts${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        eyebrow="CRM"
        title="Contacts"
        description="One row per person, whether they came through the website, WhatsApp, or were added by hand."
        actions={<LinkButton href={`${base}/contacts/new`} variant="primary">Add contact</LinkButton>}
      />

      <form method="get" action={`${base}/contacts`} className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
        <label className="flex-1">
          <span className="mb-1.5 block font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Name, email or phone"
            className="w-full rounded-xl border border-foreground/15 bg-background px-[0.9em] py-[0.6em] font-sans text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </label>
        {params.stage ? <input type="hidden" name="stage" value={params.stage} /> : null}
        <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-[1.25em] py-[0.5em] font-sans text-sm font-medium text-on-dark hover:bg-primary/90">
          Search
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {STAGES.map((stage) => (
          <Link
            key={stage || "all"}
            href={link({ stage: stage || undefined })}
            className={cn(
              "rounded-full border px-[0.9em] py-[0.35em] font-sans text-sm transition-colors",
              (params.stage ?? "") === stage ? "border-primary bg-primary text-on-dark" : "border-foreground/15 bg-background text-foreground/80 hover:border-foreground/40",
            )}
          >
            {stage ? humanise(stage) : "All stages"}
          </Link>
        ))}
        <Link href={link({ archived: params.archived === "1" ? undefined : "1" })} className="rounded-full border border-foreground/15 px-[0.9em] py-[0.35em] font-sans text-sm text-foreground/70">
          {params.archived === "1" ? "Hide archived" : "Show archived"}
        </Link>
      </div>

      {people.length === 0 ? (
        <EmptyState title="No contacts match" body="Try another search, or add the person by hand." action={<LinkButton href={`${base}/contacts/new`}>Add contact</LinkButton>} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Reach</Th>
              <Th>Stage</Th>
              <Th>Tags</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id} className="hover:bg-cream/60">
                <Td>
                  <Link href={`${base}/contacts/${person.id}`} className="font-semibold text-foreground hover:text-accent">
                    {person.display_name ?? person.email ?? person.phone_e164 ?? "Unnamed"}
                  </Link>
                  {person.archived_at ? <Badge tone="neutral" className="ml-2">Archived</Badge> : null}
                </Td>
                <Td className="text-foreground/70">
                  {person.phone_e164 ? <p>{person.phone_e164}</p> : null}
                  {person.email ? <p className="text-xs">{person.email}</p> : null}
                </Td>
                <Td>
                  <Badge tone={statusTone(person.stage)}>{humanise(person.stage)}</Badge>
                </Td>
                <Td className="text-xs text-foreground/60">{person.tags.join(", ") || "—"}</Td>
                <Td className="whitespace-nowrap text-foreground/60">{relativeTime(person.updated_at)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
