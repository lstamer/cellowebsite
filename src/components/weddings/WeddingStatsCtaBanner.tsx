"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function WeddingStatsCtaBanner() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const cta = containerRef.current?.querySelector<HTMLElement>(".wedding-banner-cta");
      if (cta) {
        gsap.fromTo(
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
              once: true,
            },
          }
        );
      }

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
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-surface-dark px-8 py-16 md:px-12 md:py-20">
        <div className="pointer-events-none absolute -top-1/2 -right-[10%] h-[200%] w-[60%] rounded-full bg-primary/10 opacity-50 blur-3xl" />

        <div className="relative z-10 flex flex-col">
          <div className="wedding-banner-cta mx-auto max-w-2xl text-center">
            <p className="font-serif mb-8 text-balance text-3xl italic text-background md:text-4xl">
              Ready to talk about the music for your day?
            </p>
            <Button href="/book" variant="primary" size="lg">
              Check availability
            </Button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
