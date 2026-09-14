import Link from "next/link";

import { ToggleExampleForm } from "@/app/admin/(app)/settings/SettingsForms";
import { Badge, EmptyState, LinkButton, PageHeader, Table, Td, Th, humanise, relativeTime } from "@/components/admin/ui";
import { getAdminBasePath } from "@/lib/admin/auth";
import { listReplyExamples } from "@/lib/admin/queries";

export default async function ReplyExamplesPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const params = await searchParams;
  const base = await getAdminBasePath();
  const examples = await listReplyExamples({ includeInactive: params.all === "1" });

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Reply examples"
        description="Retrieved by overlapping intents at draft time. Corrections are captured automatically when you reject a draft and type what should have been sent; add voice examples by hand here."
        actions={
          <>
            <LinkButton href={`${base}/settings/examples?all=${params.all === "1" ? "0" : "1"}`}>{params.all === "1" ? "Active only" : "Include inactive"}</LinkButton>
            <LinkButton href={`${base}/settings/examples/new`} variant="primary">Add example</LinkButton>
          </>
        }
      />
      {examples.length === 0 ? (
        <EmptyState title="No examples yet" body="The drafter works from the brain docs alone until examples exist." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Customer said</Th>
              <Th>Luke&apos;s reply</Th>
              <Th>Kind</Th>
              <Th>Intents</Th>
              <Th>Added</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {examples.map((example) => (
              <tr key={example.id} className={example.active ? "hover:bg-cream/60" : "opacity-60 hover:bg-cream/60"}>
                <Td>
                  <Link href={`${base}/settings/examples/${example.id}`} className="line-clamp-3 max-w-xs font-sans text-sm text-foreground hover:text-accent">{example.customer_message}</Link>
                </Td>
                <Td><p className="line-clamp-3 max-w-sm text-foreground/80">{example.reply}</p></Td>
                <Td><Badge tone={example.kind === "override" ? "warning" : "neutral"}>{humanise(example.kind)}</Badge></Td>
                <Td className="text-xs text-foreground/60">{example.intents.join(", ") || "—"}</Td>
                <Td className="whitespace-nowrap text-foreground/60">{relativeTime(example.created_at)}</Td>
                <Td><ToggleExampleForm example={example} /></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
