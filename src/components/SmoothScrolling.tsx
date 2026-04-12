"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export default function SmoothScrolling({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<any>(null);

  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;

    // Bridge: feed Lenis's smoothed scroll position into ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Prevent GSAP from re-smoothing Lenis's already-smoothed values
    gsap.ticker.lagSmoothing(0);

    function update(time: number) {
      lenis.raf(time * 1000);
    }
    gsap.ticker.add(update);

    // Debounced resize: replaces Lenis autoResize to avoid feedback loops
    // during mobile browser chrome animation (URL bar show/hide)
    let resizeTimer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        lenis.resize();
        ScrollTrigger.refresh();
      }, 250);
    }
    window.addEventListener("resize", onResize);

    return () => {
      gsap.ticker.remove(update);
      lenis.off("scroll", ScrollTrigger.update);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <ReactLenis root ref={lenisRef} autoRaf={false} options={{ autoResize: false }}>
      {children}
    </ReactLenis>
  );
}
