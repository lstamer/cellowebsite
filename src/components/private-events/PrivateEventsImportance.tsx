"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function PrivateEventsImportance() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".private-importance-image",
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
        ".importance-text",
        { y: 20, autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current?.querySelector(".importance-text"),
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
        <div className="private-importance-image gsap-reveal group relative w-full max-w-xl lg:max-w-none">
          <div
            className="absolute inset-0 -z-10 bg-primary/5 transition-transform duration-700 ease-out group-hover:scale-105 translate-x-3 translate-y-3"
            aria-hidden
          />
          {/* Solid colour placeholder — swap for event photography later */}
          <div
            className="relative aspect-[4/5] overflow-hidden bg-surface-dark shadow-2xl"
            aria-hidden
          />
        </div>

        <div className="importance-text gsap-reveal max-w-xl lg:justify-self-end">
          <SectionHeader
            label="My Promise"
            heading="The music should set the tone, not steal the night."
            alignment="left"
            className="mb-8 md:mb-10"
          />
          <div className="space-y-6">
            <p className="font-sans text-lg leading-relaxed text-foreground/75 text-pretty md:text-xl">
              A great evening has a rhythm to it. The right musician reads that
              rhythm and shapes the room around it — without you having to think
              about the music at all.
            </p>
            <div
              className="h-px min-h-px w-[92%] shrink-0 bg-primary/15"
              aria-hidden
            />
            <p className="font-serif text-3xl italic leading-[1.08] text-primary text-balance md:text-4xl">
              It should feel effortless, personal, and completely handled.
            </p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
