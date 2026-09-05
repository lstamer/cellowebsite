"use client";

import {
  Activity,
  BarChart3,
  Inbox,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Settings,
  Terminal,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button as AriaButton } from "react-aria-components";

import { ADMIN_NAV, type AdminNavItem } from "@/components/admin/nav";
import { cn } from "@/lib/utils";

const ICONS: Record<AdminNavItem["icon"], typeof Inbox> = {
  home: Activity,
  inbox: Inbox,
  users: Users,
  terminal: Terminal,
  activity: Activity,
  chart: BarChart3,
  settings: Settings,
  mail: Mail,
  message: MessageSquare,
};

export function AdminShell({
  base,
  email,
  openErrors,
  signOutAction,
  children,
}: {
  base: string;
  email: string;
  openErrors: number;
  signOutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const relative = base && pathname.startsWith(base) ? pathname.slice(base.length) || "/" : pathname;

  const isActive = (href: string) =>
    href === "/" ? relative === "/" : relative === href || relative.startsWith(`${href}/`);

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {ADMIN_NAV.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(item.href);
        const count = item.href === "/console" ? openErrors : 0;
        return (
          <Link
            key={item.href}
            href={`${base}${item.href === "/" ? "" : item.href}` || "/"}
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
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-dvh bg-cream text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col bg-surface-dark px-4 py-6 lg:flex">
        <Link href={base || "/"} className="mb-8 block px-2">
          <span className="font-display text-xl font-semibold text-on-dark">Stamer</span>
          <span className="ml-2 font-jost text-xs font-semibold uppercase tracking-[0.18em] text-accent">Admin</span>
        </Link>
        {nav}
        <div className="mt-auto border-t border-on-dark/10 pt-4">
          <p className="truncate px-2 font-sans text-xs text-on-dark/60">{email}</p>
          <form action={signOutAction} className="mt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl px-[0.9em] py-[0.6em] font-sans text-sm text-on-dark/70 transition-colors hover:bg-on-dark/5 hover:text-on-dark"
            >
              <LogOut className="h-[16px] w-[16px]" strokeWidth={1.75} aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-foreground/10 bg-surface-dark px-4 py-3 lg:hidden">
          <Link href={base || "/"}>
            <span className="font-display text-lg font-semibold text-on-dark">Stamer</span>
            <span className="ml-2 font-jost text-xs font-semibold uppercase tracking-[0.18em] text-accent">Admin</span>
          </Link>
          <AriaButton
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onPress={() => setOpen((value) => !value)}
            className="rounded-xl p-[0.5em] text-on-dark hover:bg-on-dark/10"
          >
            {open ? <X className="h-[20px] w-[20px]" aria-hidden /> : <Menu className="h-[20px] w-[20px]" aria-hidden />}
          </AriaButton>
        </header>
        {open ? (
          <div className="border-b border-foreground/10 bg-surface-dark px-4 py-4 lg:hidden">
            {nav}
            <form action={signOutAction} className="mt-3 border-t border-on-dark/10 pt-3">
              <button type="submit" className="flex items-center gap-2 rounded-xl px-[0.9em] py-[0.6em] font-sans text-sm text-on-dark/70">
                <LogOut className="h-[16px] w-[16px]" strokeWidth={1.75} aria-hidden />
                Sign out
              </button>
            </form>
          </div>
        ) : null}
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
