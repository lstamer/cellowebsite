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
        title="Business knowledge"
        description="Every active document goes into every draft, so keep it small and factual. The AI may only state what is written here; anything else it must defer to Luke."
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
            <tr key={doc.id} className="hover:bg-surface-dark">
              <Td>
                <Link href={adminPath(`/settings/brain/${doc.id}`)} className="font-medium text-on-dark underline-offset-4 hover:underline">
                  {doc.title}
                </Link>
                <span className="block font-mono text-xs text-on-dark/50">{doc.slug}</span>
              </Td>
              <Td>{doc.category}</Td>
              <Td><Pill value={doc.active ? "ok" : "skipped"} label={doc.active ? "active" : "off"} /></Td>
              <Td className="tabular-nums">{doc.sort_order}</Td>
              <Td className="tabular-nums">v{doc.version}</Td>
              <Td className="whitespace-nowrap text-on-dark/60">{formatRelative(doc.updated_at)}{doc.updated_by ? ` · ${doc.updated_by}` : ""}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
