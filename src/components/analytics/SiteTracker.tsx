"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { trackPageView } from "@/lib/analytics-client";

/**
 * Records one page view per client-side navigation on the marketing site.
 * Renders nothing. Admin paths are excluded so Luke's own use is never
 * counted as traffic.
 */
export function SiteTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (last.current === pathname) return;
    last.current = pathname;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
