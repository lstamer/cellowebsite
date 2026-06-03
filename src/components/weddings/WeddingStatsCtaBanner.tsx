"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { scrollRevealFromTo } from "@/lib/gsap-scroll-reveal";

export function WeddingStatsCtaBanner() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const cta = containerRef.current?.querySelector<HTMLElement>(".wedding-banner-cta");
      if (!cta) return;

      scrollRevealFromTo(
        cta,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cta,
            start: "top 85%",
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper
      ref={containerRef}
      id="weddings-availability"
      maxWidth="max-w-6xl"
      className={cn("pt-12 md:pt-16")}
    >
      <div className="rounded-3xl bg-surface-dark px-8 py-12 text-on-dark md:px-12 md:py-14">
        <div className="wedding-banner-cta gsap-reveal grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="mb-3 font-jakarta text-[0.75rem] font-bold uppercase tracking-[0.24em] text-on-dark/60">
              Date in mind?
            </p>
            <p className="max-w-2xl font-serif text-balance text-3xl italic leading-[1.05] text-on-dark md:text-5xl">
              Let&apos;s see if I&apos;m available for your wedding.
            </p>
          </div>
          <div className="flex justify-start lg:justify-end">
            <Button href="/book" variant="ghost" size="lg">
              Check availability
            </Button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
