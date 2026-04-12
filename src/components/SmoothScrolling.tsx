"use client";

import { ReactLenis, useLenis, type LenisRef } from "lenis/react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // Prevents ScrollTrigger from refreshing on mobile browser chrome show/hide
  ScrollTrigger.config({ ignoreMobileResize: true });
}

// Must live inside ReactLenis to access useLenis context
function LenisGSAPBridge() {
  useLenis(() => {
    ScrollTrigger.update();
  });
  return null;
}

export default function SmoothScrolling({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    // Drive Lenis from GSAP's ticker so both systems share one RAF loop.
    // Uses optional chaining — safe if lenis initializes after this effect.
    // IMPORTANT: no early-return guard here; the ticker must always be added
    // or Lenis (autoRaf: false) will have no driver and scroll won't work.
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    // Only refresh ScrollTrigger when viewport WIDTH changes (real resize,
    // orientation change). Skip height-only changes caused by mobile browser
    // chrome (URL bar / bottom tab bar) animating in/out — ignoreMobileResize
    // handles those internally.
    let lastWidth = window.innerWidth;
    let resizeTimer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        lenisRef.current?.lenis?.resize();
        const newWidth = window.innerWidth;
        if (newWidth !== lastWidth) {
          lastWidth = newWidth;
          ScrollTrigger.refresh();
        }
      }, 250);
    }
    window.addEventListener("resize", onResize);

    return () => {
      gsap.ticker.remove(update);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{ autoRaf: false, autoResize: false }}
    >
      <LenisGSAPBridge />
      {children}
    </ReactLenis>
  );
}
