"use client";

import "lenis/dist/lenis.css";

import { ReactLenis, type LenisRef } from "lenis/react";
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const LENIS_MIN_WIDTH_QUERY = "(min-width: 1024px)";

function subscribeLenisEnabled(onStoreChange: () => void) {
  const mq = window.matchMedia(LENIS_MIN_WIDTH_QUERY);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getLenisEnabledSnapshot() {
  return window.matchMedia(LENIS_MIN_WIDTH_QUERY).matches;
}

function getLenisEnabledServerSnapshot() {
  return false;
}

export default function SmoothScrolling({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisEnabled = useSyncExternalStore(
    subscribeLenisEnabled,
    getLenisEnabledSnapshot,
    getLenisEnabledServerSnapshot
  );

  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });
  }, []);

  useEffect(() => {
    if (!lenisEnabled) return;

    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }

    gsap.ticker.add(update);

    return () => {
      gsap.ticker.remove(update);
    };
  }, [lenisEnabled]);

  useLayoutEffect(() => {
    if (!lenisEnabled) return;

    let canceled = false;
    let unsubScroll: (() => void) | undefined;
    let attempts = 0;
    const maxAttempts = 90;

    const tryBind = () => {
      if (canceled) return;
      const lenis = lenisRef.current?.lenis;
      if (lenis) {
        gsap.ticker.lagSmoothing(0);
        unsubScroll = lenis.on("scroll", ScrollTrigger.update);
        ScrollTrigger.refresh();
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryBind);
      }
    };

    requestAnimationFrame(tryBind);

    return () => {
      canceled = true;
      unsubScroll?.();
      gsap.ticker.lagSmoothing(500, 33);
      ScrollTrigger.refresh();
    };
  }, [lenisEnabled]);

  if (!lenisEnabled) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root ref={lenisRef} autoRaf={false}>
      {children}
    </ReactLenis>
  );
}
