import Link from "next/link";

import { Empty, formatRelative, LinkButton, PageHeader, Pill, Table, Td, Th } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";
import { listBrainDocs } from "@/lib/admin/queries";

export const metadata = { title: "Business knowledge" };

export default async function BrainDocsPage() {
  const docs = await listBrainDocs();
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Brain docs"
        description="Every active document is placed in the drafting prompt as BUSINESS KNOWLEDGE, in sort order. Keep them factual and short."
        actions={<LinkButton href={adminPath("/settings/brain/new")} variant="primary">New document</LinkButton>}
      />
      {docs.length === 0 ? (
        <Empty>No documents yet.</Empty>
      ) : (
        <Table
          head={
            <tr>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th>Active</Th>
              <Th>Order</Th>
              <Th>Version</Th>
              <Th>Updated</Th>
            </tr>
          }
        >
          {docs.map((doc) => (
            <tr key={doc.id} className="hover:bg-cream/60">
              <Td>
                <Link href={adminPath(`/settings/brain/${doc.id}`)} className="font-medium text-foreground underline-offset-4 hover:underline">
                  {doc.title}
                </Link>
                <span className="block font-mono text-xs text-foreground/50">{doc.slug}</span>
              </Td>
              <Td>{doc.category}</Td>
              <Td><Pill value={doc.active ? "ok" : "skipped"} label={doc.active ? "active" : "off"} /></Td>
              <Td className="tabular-nums">{doc.sort_order}</Td>
              <Td className="tabular-nums">v{doc.version}</Td>
              <Td className="whitespace-nowrap text-foreground/60">{formatRelative(doc.updated_at)}{doc.updated_by ? ` · ${doc.updated_by}` : ""}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
