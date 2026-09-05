"use client";

import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Beacon } from "@/components/ui/Beacon";
import { MobileStickyCTA } from "@/components/ui/MobileStickyCTA";
import { WhatsAppFab } from "@/components/ui/WhatsAppFab";

/**
 * The marketing site's floating chrome and analytics. Rendered from the root
 * layout, but the admin (served under /admin, or on the admin host which the
 * proxy rewrites onto /admin) must not carry any of it: no WhatsApp FAB, no
 * sticky booking bar, no visitor beacon on Luke's own clicks.
 */
export function SiteChrome() {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return null;
  }

  return (
    <>
      <WhatsAppFab />
      <MobileStickyCTA />
      <Beacon />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
