"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { getAnalyticsSessionId, trackSiteEvent } from "@/lib/analytics-client";

/**
 * First-party, cookieless page-view beacon. One POST per route change to
 * /api/t with the path, referrer and a random per-tab session id kept in
 * sessionStorage. No cookies, no IP storage, no fingerprinting: the id dies
 * with the tab and cannot be tied back to a person unless they submit a form,
 * in which case the lead row stores it so the CRM can show their path.
 */
export function Beacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (window.navigator.webdriver) return; // Puppeteer / automation runs.

    const sessionId = getAnalyticsSessionId();
    if (!sessionId) return;

    const search = new URLSearchParams(window.location.search);
    const body = JSON.stringify({
      t: "view",
      sid: sessionId,
      path: pathname,
      ref: document.referrer || null,
      utm_source: search.get("utm_source"),
      utm_medium: search.get("utm_medium"),
      utm_campaign: search.get("utm_campaign"),
      w: window.innerWidth,
    });

    try {
      if (!navigator.sendBeacon?.("/api/t", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/t", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
      }
    } catch {
      // Analytics never breaks the page.
    }

    if (pathname === "/book") {
      trackSiteEvent("book_view");
    }
  }, [pathname]);

  return null;
}
