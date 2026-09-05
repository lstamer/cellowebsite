import Link from "next/link";

import { Badge, EmptyState, LinkButton, PageHeader, Table, Td, Th, relativeTime } from "@/components/admin/ui";
import { getAdminBasePath } from "@/lib/admin/auth";
import { listBrainDocs } from "@/lib/admin/queries";

export default async function BrainDocsPage() {
  const base = await getAdminBasePath();
  const docs = await listBrainDocs();

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Brain docs"
        description="Every active document is placed in the drafting prompt as BUSINESS KNOWLEDGE, in sort order. Keep them factual and short."
        actions={<LinkButton href={`${base}/settings/brain/new`} variant="primary">New document</LinkButton>}
      />
      {docs.length === 0 ? (
        <EmptyState title="No brain docs yet" body="Add the first document: who Luke is, what he offers, and the pricing and availability policies." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Title</Th>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th>Version</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => (
              <tr key={doc.id} className="hover:bg-cream/60">
                <Td className="text-foreground/60">{doc.sort_order}</Td>
                <Td>
                  <Link href={`${base}/settings/brain/${doc.slug}`} className="font-semibold text-foreground hover:text-accent">{doc.title}</Link>
                  <p className="mt-1 line-clamp-1 max-w-md text-xs text-foreground/55">{doc.content}</p>
                </Td>
                <Td><Badge tone="neutral">{doc.category}</Badge></Td>
                <Td><Badge tone={doc.active ? "success" : "neutral"}>{doc.active ? "Active" : "Inactive"}</Badge></Td>
                <Td className="text-foreground/60">v{doc.version}</Td>
                <Td className="whitespace-nowrap text-foreground/60">{relativeTime(doc.updated_at)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
