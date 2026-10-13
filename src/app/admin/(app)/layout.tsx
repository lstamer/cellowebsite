import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";
import { getNeedsAttentionCount } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: { default: "Stamer admin", template: "%s · Stamer admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const attention = await getNeedsAttentionCount().catch(() => 0);

  return (
    <AdminShell email={session.email} attentionCount={attention}>
      {children}
    </AdminShell>
  );
}
