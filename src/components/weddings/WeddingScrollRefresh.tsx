"use client";

import { useEffect } from "react";
import { refreshScrollReveals } from "@/lib/gsap-scroll-reveal";

const HERO_READY_EVENT = "weddings:hero-ready";

/** Dispatch after the hero image has loaded so ScrollTrigger can recalc sticky layout. */
export function dispatchWeddingHeroReady(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(HERO_READY_EVENT));
}

/**
 * Refreshes ScrollTrigger positions after layout settles (hero image, fonts, sticky hero).
 */
export function WeddingScrollRefresh() {
  useEffect(() => {
    const run = () => refreshScrollReveals();

    run();

    window.addEventListener("load", run);
    window.addEventListener(HERO_READY_EVENT, run);

    const t = window.setTimeout(run, 400);

    return () => {
      window.removeEventListener("load", run);
      window.removeEventListener(HERO_READY_EVENT, run);
      window.clearTimeout(t);
    };
  }, []);

  return null;
}
