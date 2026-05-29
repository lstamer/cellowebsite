"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { applyTimelineRevealFallbacks } from "@/lib/gsap-scroll-reveal";

export function WeddingImportance() {
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
        ".wedding-importance-image",
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
        <div className="wedding-importance-image group relative w-full max-w-xl lg:max-w-none">
          <div
            className="absolute inset-0 -z-10 bg-primary/5 transition-transform duration-700 ease-out group-hover:scale-105 translate-x-3 translate-y-3"
            aria-hidden
          />
          <div className="relative aspect-[4/5] overflow-hidden shadow-2xl">
            <Image
              src="/images/wedding.jpg"
              alt="Bride and groom at their wedding celebration"
              fill
              loading="lazy"
              className="object-cover object-center grayscale-[15%] transition-transform duration-1000 ease-out group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>

        <div className="importance-text max-w-xl lg:justify-self-end">
          <SectionHeader
            label="The Impact"
            heading="The right song changes the room."
            alignment="left"
            className="mb-8 md:mb-10"
          />
          <div className="space-y-6 font-sans text-lg leading-relaxed text-foreground/75 md:text-xl">
            <p>
              It steadies the ceremony, gives guests something beautiful to arrive
              into, and makes each transition feel intentional.
            </p>
            <p className="font-medium text-foreground">
              You remember the vows. Your guests remember how the room felt.
            </p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
