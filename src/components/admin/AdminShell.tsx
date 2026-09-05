"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Button, Dialog, DialogTrigger, Modal, ModalOverlay } from "react-aria-components";

import { ADMIN_NAV, adminPath } from "@/lib/admin/paths";
import { cn } from "@/lib/utils";

const ICONS = {
  home: LayoutDashboard,
  inbox: Inbox,
  users: Users,
  alert: Bell,
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

function NavList({
  pathname,
  attentionCount,
  onNavigate,
}: {
  pathname: string;
  attentionCount: number;
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {ADMIN_NAV.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(pathname, item.href);
        const badge = item.icon === "alert" && attentionCount > 0 ? attentionCount : null;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-input px-3 font-sans text-sm transition-colors duration-300",
                active
                  ? "bg-cream text-primary"
                  : "text-on-dark/70 hover:bg-surface-dark hover:text-on-dark",
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
              <span className="flex-1">{item.label}</span>
              {badge !== null ? (
                <span className="rounded-full bg-accent px-[0.6em] py-[0.15em] font-jost text-xs font-semibold text-on-dark">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SignOutForm({ className }: { className?: string }) {
  return (
    <form action={adminPath("/auth/signout")} method="post" className={className}>
      <button
        type="submit"
        className="flex min-h-11 w-full items-center gap-3 rounded-input px-3 font-sans text-sm text-on-dark/70 transition-colors duration-300 hover:bg-surface-dark hover:text-on-dark"
      >
        <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        Sign out
      </button>
    </form>
  );
}

export function AdminShell({ email, attentionCount, children }: AdminShellProps) {
  const pathname = usePathname();
  // The mobile menu trigger is rendered client-side only: React Aria's
  // DialogTrigger wires aria-controls to a portal id that differs between the
  // server pass and the browser, which would otherwise log a hydration
  // mismatch on every admin page. The menu state stays internal to the
  // trigger; every link inside calls close().
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <div className="min-h-dvh bg-surface-darker text-on-dark">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-input focus:bg-cream focus:px-4 focus:py-2 focus:text-primary"
      >
        Skip to content
      </a>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex min-h-14 items-center justify-between border-b border-on-dark/10 bg-surface-darker px-4 lg:hidden">
        <Link href={adminPath()} className="font-serif text-xl italic">
          Stamer admin
        </Link>
        {mounted ? (
        <DialogTrigger>
          <Button
            aria-label="Open menu"
            className="flex h-11 w-11 items-center justify-center rounded-input text-on-dark data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-cream"
          >
            <Menu className="h-[20px] w-[20px]" strokeWidth={1.75} aria-hidden />
          </Button>
          <ModalOverlay className="fixed inset-0 z-50 h-svh bg-surface-darker" isDismissable>
            <Modal className="h-svh">
              <Dialog aria-label="Admin menu" className="flex h-svh flex-col p-4 outline-none">
                {({ close }) => (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-xl italic">Stamer admin</span>
                      <Button
                        aria-label="Close menu"
                        onPress={close}
                        className="flex h-11 w-11 items-center justify-center rounded-input text-on-dark data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-cream"
                      >
                        <X className="h-[20px] w-[20px]" strokeWidth={1.75} aria-hidden />
                      </Button>
                    </div>
                    <nav aria-label="Admin" className="mt-6 flex-1">
                      <NavList pathname={pathname} attentionCount={attentionCount} onNavigate={close} />
                    </nav>
                    <div className="border-t border-on-dark/10 pt-4">
                      <p className="truncate px-3 font-jost text-xs text-on-dark/50">{email}</p>
                      <SignOutForm className="mt-2" />
                    </div>
                  </>
                )}
              </Dialog>
            </Modal>
          </ModalOverlay>
        </DialogTrigger>
        ) : (
          <span aria-hidden className="h-11 w-11" />
        )}
      </header>

      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh flex-col border-r border-on-dark/10 bg-surface-darker px-4 py-6 lg:flex">
          <Link href={adminPath()} className="px-3">
            <span className="block font-jost text-[0.6875rem] uppercase tracking-[0.22em] text-on-dark/50">
              Stamer Cello
            </span>
            <span className="mt-1 block font-serif text-2xl italic leading-none">Admin</span>
          </Link>
          <nav aria-label="Admin" className="mt-8 flex-1">
            <NavList pathname={pathname} attentionCount={attentionCount} />
          </nav>
          <div className="border-t border-on-dark/10 pt-4">
            <p className="truncate px-3 font-jost text-xs text-on-dark/50" title={email}>
              {email}
            </p>
            <SignOutForm className="mt-2" />
          </div>
        </aside>

        <main id="admin-main" className="min-w-0 px-4 py-6 md:px-8 md:py-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
