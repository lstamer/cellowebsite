"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function CorporateFunctionsImportance() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".corp-importance-image",
        { y: 40, autoAlpha: 0 },
        {
          scrollTrigger: { trigger: containerRef.current, start: "top 75%", once: true },
          y: 0,
          autoAlpha: 1,
          duration: 1,
          ease: "power3.out",
        }
      );

      gsap.fromTo(
        ".corp-importance-text",
        { y: 20, autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current?.querySelector(".corp-importance-text"),
            start: "top 80%",
            once: true,
          },
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="importance" ref={containerRef} className="bg-background">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <div className="corp-importance-image gsap-reveal group relative w-full max-w-xl lg:max-w-none">
          <div
            className="absolute inset-0 -z-10 bg-cream transition-transform duration-700 ease-out group-hover:scale-105 translate-x-3 translate-y-3"
            aria-hidden
          />
          <div
            className="relative aspect-[4/5] overflow-hidden bg-surface-dark shadow-2xl"
          >
            <Image
              src="/images/corporate-functions1"
              alt="Cellist performing during a refined corporate function"
              fill
              className="object-cover object-center grayscale-[15%]"
              sizes="(min-width: 1024px) 48vw, 100vw"
            />
          </div>
        </div>

        <div className="corp-importance-text gsap-reveal max-w-xl lg:justify-self-end">
          <SectionHeader
            label="My promise"
            heading="When the room feels effortless, the credit is yours."
            alignment="left"
            className="mb-8 md:mb-10"
          />
          <div className="space-y-6">
            <p className="font-sans text-lg leading-relaxed text-foreground/75 text-pretty md:text-xl">
              A function is judged in the small moments — the arrival, the lull
              before speeches, the gap between scheduled items where the energy
              usually drops. I hold those moments quietly, so the evening feels
              calm, deliberate, and properly run.
            </p>
            <div
              className="h-px min-h-px w-[92%] shrink-0 border-t border-primary/15"
              aria-hidden
            />
            <p className="font-serif text-3xl italic leading-[1.08] text-primary text-balance md:text-4xl">
              Your guests remember how the evening felt. Your team remembers that
              it was easy.
            </p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
