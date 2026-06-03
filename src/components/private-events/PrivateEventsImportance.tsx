"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { applyTimelineRevealFallbacks } from "@/lib/gsap-scroll-reveal";

export function PrivateEventsImportance() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
          once: true,
        },
      });

      tl.fromTo(
        ".private-importance-image",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
        }
      );

      tl.fromTo(
        ".importance-text",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.6"
      );

      applyTimelineRevealFallbacks(tl);
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
            label="The Impact"
            heading="The right music changes how the night feels."
            alignment="left"
            className="mb-8 md:mb-10"
          />
          <div className="space-y-6 font-sans text-lg leading-relaxed text-foreground/75 md:text-xl">
            <p>
              It greets guests as they arrive, carries the quieter moments, and
              lifts the room when the evening opens up — so the whole night feels
              considered rather than left to chance.
            </p>
            <p className="font-medium text-foreground">
              Guests rarely remember the playlist. They remember how the room
              felt.
            </p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
