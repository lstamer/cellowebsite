import { EmptyState, PageHeader } from "@/components/admin/ui";

export default function AdminNotFound() {
  return (
    <>
      <PageHeader eyebrow="Admin" title="Not found" />
      <EmptyState title="That record does not exist" body="It may have been merged, deleted, or the link is old." />
    </>
  );
}
