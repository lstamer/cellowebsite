"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  Inbox,
  LogOut,
  Menu,
  Settings,
  Terminal,
  Users,
  X,
} from "lucide-react";

import { ADMIN_NAV, adminPath } from "@/lib/admin/paths";
import { cn } from "@/lib/utils";

const ICONS = {
  home: Activity,
  inbox: Inbox,
  users: Users,
  alert: Terminal,
  chart: BarChart3,
  heart: Activity,
  settings: Settings,
} as const;

interface AdminShellProps {
  email: string;
  attentionCount: number;
  children: React.ReactNode;
}

function isActive(pathname: string, href: string): boolean {
  if (href === adminPath()) return pathname === href || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand({ size = "lg" }: { size?: "lg" | "md" }) {
  return (
    <>
      <span className={cn("font-display font-semibold text-on-dark", size === "lg" ? "text-xl" : "text-lg")}>Stamer</span>
      <span className="ml-2 font-jost text-xs font-semibold uppercase tracking-[0.18em] text-accent">Admin</span>
    </>
  );
}

export function AdminShell({ email, attentionCount, children }: AdminShellProps) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {ADMIN_NAV.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(pathname, item.href);
        const count = item.icon === "alert" ? attentionCount : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-[0.9em] py-[0.6em] font-sans text-sm transition-colors",
              active ? "bg-on-dark/10 text-on-dark" : "text-on-dark/70 hover:bg-on-dark/5 hover:text-on-dark",
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            <span className="flex-1">{item.label}</span>
            {count > 0 ? (
              <span className="rounded-full bg-accent px-[0.6em] py-[0.1em] font-jost text-xs font-semibold text-on-dark">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const signOut = (
    <form action={adminPath("/auth/signout")} method="post">
      <button
        type="submit"
        className="flex w-full items-center gap-2 rounded-xl px-[0.9em] py-[0.6em] font-sans text-sm text-on-dark/70 transition-colors hover:bg-on-dark/5 hover:text-on-dark"
      >
        <LogOut className="h-[16px] w-[16px]" strokeWidth={1.75} aria-hidden />
        Sign out
      </button>
    </form>
  );

  return (
    <div className="flex min-h-dvh bg-cream text-foreground">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-on-dark"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-surface-dark px-4 py-6 lg:flex">
        <Link href={adminPath()} className="mb-8 block px-2">
          <Brand />
        </Link>
        {nav}
        <div className="mt-auto border-t border-on-dark/10 pt-4">
          <p className="truncate px-2 font-sans text-xs text-on-dark/60" title={email}>
            {email}
          </p>
          <div className="mt-2">{signOut}</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-on-dark/10 bg-surface-dark px-4 py-3 lg:hidden">
          <Link href={adminPath()}>
            <Brand size="md" />
          </Link>
          {/* A native button: React Aria's Button emits ids that differ between
              the server pass and the client and logs a hydration mismatch on
              every page. A plain toggle needs nothing extra. */}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-on-dark hover:bg-on-dark/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            {open ? <X className="h-[20px] w-[20px]" aria-hidden /> : <Menu className="h-[20px] w-[20px]" aria-hidden />}
          </button>
        </header>
        {open ? (
          <div className="border-b border-on-dark/10 bg-surface-dark px-4 py-4 lg:hidden">
            {nav}
            <div className="mt-3 border-t border-on-dark/10 pt-3">{signOut}</div>
          </div>
        ) : null}
        <main id="admin-main" className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
