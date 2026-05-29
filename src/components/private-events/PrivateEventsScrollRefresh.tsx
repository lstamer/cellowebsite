"use client";

import { useEffect } from "react";
import { refreshScrollReveals } from "@/lib/gsap-scroll-reveal";

/**
 * Refreshes ScrollTrigger positions after layout settles (fonts, solid hero).
 * No hero image here, so there is no image-ready event to wait on — we simply
 * recalc on load and after a short delay once layout/fonts have settled.
 */
export function PrivateEventsScrollRefresh() {
  useEffect(() => {
    const run = () => refreshScrollReveals();

    run();

    window.addEventListener("load", run);

    const t = window.setTimeout(run, 400);

    return () => {
      window.removeEventListener("load", run);
      window.clearTimeout(t);
    };
  }, []);

  return null;
}
