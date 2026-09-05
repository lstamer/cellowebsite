import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { signOutAction } from "@/app/admin/(auth)/login/actions";
import { getAdminBasePath, requireAdmin } from "@/lib/admin/auth";
import { countOpenErrors } from "@/lib/admin/queries";

export default async function AdminAppLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  const base = await getAdminBasePath();
  const openErrors = await countOpenErrors().catch(() => 0);

  return (
    <AdminShell base={base} email={session.email} openErrors={openErrors} signOutAction={signOutAction}>
      {children}
    </AdminShell>
  );
}
