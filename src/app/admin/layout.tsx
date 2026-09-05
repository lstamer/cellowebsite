import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Stamer Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The admin route group. The signed-in shell lives in (app)/layout.tsx; the
 * login and auth callback routes render without it. Nothing from the
 * marketing site (navbar, footer, floating CTAs) renders here: the root
 * layout's fixed elements check the path and hide themselves.
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div data-admin className="min-h-dvh bg-cream">{children}</div>;
}
