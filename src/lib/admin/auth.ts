import { redirect } from "next/navigation";

import { createServerAuthClient } from "@/lib/admin/supabase-auth";

export interface AdminSession {
  email: string;
  userId: string;
}

/** The allow-list. Only these addresses may hold an admin session. */
export function getAllowedAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAllowedAdminEmails().has(email.trim().toLowerCase());
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
