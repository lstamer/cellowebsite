"use client";

import { useEffect } from "react";
import { refreshScrollReveals } from "@/lib/gsap-scroll-reveal";

/**
 * Single ScrollTrigger refresh once fonts and layout have settled.
 */
export function PrivateEventsScrollRefresh() {
  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (!cancelled) refreshScrollReveals();
    };

    void document.fonts.ready.then(run);

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
