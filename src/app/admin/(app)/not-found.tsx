import { LinkButton, PageHeader } from "@/components/admin/ui";
import { adminPath } from "@/lib/admin/paths";

export default function AdminNotFound() {
  return (
    <>
      <PageHeader eyebrow="404" title="Nothing here" description="That record does not exist or was merged into another one." />
      <LinkButton href={adminPath()} variant="primary">Back to the dashboard</LinkButton>
    </>
  );
}
