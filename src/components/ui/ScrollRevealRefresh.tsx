"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap-client";

/**
 * Keeps GSAP ScrollTrigger reveal positions in sync while below-the-fold
 * content mounts, images load, and fonts swap after the initial layout.
 *
 * Each section computes its trigger `start` once, inside `useGSAP`, when it
 * mounts. Those mounts (and late-loading images / font swaps) grow the page
 * *after* the positions are cached, so `once: true` reveals end up with stale
 * start points and fire at the wrong scroll position — the reported symptom
 * where content only appears once you have already scrolled past it.
 *
 * A debounced `ScrollTrigger.refresh()` on every layout change recomputes all
 * positions against the settled layout. Mount once on any page that renders
 * deferred sections.
 */
export function ScrollRevealRefresh() {
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    // ScrollTrigger.refresh() jumps the window to the top and back, which
    // fires a document scroll event. React Aria closes its non-modal popovers
    // (Select, ComboBox, DatePicker) on scroll, so a refresh while one is open
    // would snap it shut under the user. Wait it out instead: the popover is
    // gone within a few hundred milliseconds and the refresh still lands.
    const hasOpenOverlay = () => document.querySelector("[data-trigger]") !== null;

    const refresh = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (hasOpenOverlay()) {
          refresh();
          return;
        }
        ScrollTrigger.refresh();
      }, 180);
    };

    // Deferred section mounts and image loads change the document height.
    const observer = new ResizeObserver(refresh);
    observer.observe(document.body);

    // Font swaps reflow text-heavy sections after first paint.
    void document.fonts?.ready.then(refresh);

    // Final safety pass once every lazy asset has loaded.
    window.addEventListener("load", refresh);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      window.removeEventListener("load", refresh);
    };
  }, []);

  return null;
}
