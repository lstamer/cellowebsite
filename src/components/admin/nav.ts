export interface AdminNavItem {
  href: string;
  label: string;
  icon: "inbox" | "users" | "terminal" | "activity" | "chart" | "settings" | "home" | "mail" | "message";
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/", label: "Dashboard", icon: "home" },
  { href: "/inquiries", label: "Inquiries", icon: "inbox" },
  { href: "/contacts", label: "Contacts", icon: "users" },
  { href: "/console", label: "Console", icon: "terminal" },
  { href: "/analytics", label: "Analytics", icon: "chart" },
  { href: "/health", label: "Health", icon: "activity" },
  { href: "/settings", label: "Settings", icon: "settings" },
];
