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
 * Single ScrollTrigger refresh after the hero image settles layout.
 */
export function WeddingScrollRefresh() {
  useEffect(() => {
    let refreshed = false;

    const run = () => {
      if (refreshed) return;
      refreshed = true;
      refreshScrollReveals();
    };

    window.addEventListener(HERO_READY_EVENT, run, { once: true });

    return () => {
      window.removeEventListener(HERO_READY_EVENT, run);
    };
  }, []);

  return null;
}
