/**
 * Admin links. The pages live under /admin/** in the app tree; on the admin
 * host the proxy rewrites /x onto /admin/x, and Next's <Link> to /admin/x also
 * works there. So every internal admin link simply uses the /admin prefix.
 */
export const ADMIN_BASE = "/admin";

export function adminPath(path = ""): string {
  if (!path || path === "/") return ADMIN_BASE;
  return `${ADMIN_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export const ADMIN_NAV: Array<{ href: string; label: string; icon: "home" | "inbox" | "users" | "alert" | "chart" | "heart" | "settings" }> = [
  { href: adminPath(), label: "Dashboard", icon: "home" },
  { href: adminPath("/inquiries"), label: "Inquiries", icon: "inbox" },
  { href: adminPath("/contacts"), label: "Contacts", icon: "users" },
  { href: adminPath("/console"), label: "Console", icon: "alert" },
  { href: adminPath("/analytics"), label: "Analytics", icon: "chart" },
  { href: adminPath("/health"), label: "Health", icon: "heart" },
  { href: adminPath("/settings"), label: "Settings", icon: "settings" },
];
