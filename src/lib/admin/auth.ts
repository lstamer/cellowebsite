import { redirect } from "next/navigation";

import { isAllowedAdminEmail } from "@/lib/admin/allow-list";
import { createServerAuthClient } from "@/lib/admin/supabase-auth";

export { getAllowedAdminEmails, isAllowedAdminEmail } from "@/lib/admin/allow-list";

export interface AdminSession {
  email: string;
  userId: string;
}

/**
 * The current admin, verified against Supabase Auth (not just the cookie) and
 * against the allow-list. Null when signed out or not allowed.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAllowedAdminEmail(user.email)) {
    return null;
  }

  return { email: user.email.toLowerCase(), userId: user.id };
}

/** Defence in depth: every admin page calls this even though the proxy gates. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
