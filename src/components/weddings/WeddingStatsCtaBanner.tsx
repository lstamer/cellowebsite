"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function WeddingStatsCtaBanner() {
  const outerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".desktop-stat", {
        scrollTrigger: {
          trigger: ".desktop-stats-grid",
          start: "top 85%",
          once: true,
        },
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
      });
    },
    { scope: outerRef }
  );

  return (
    <SectionWrapper ref={outerRef} className="bg-surface-dark py-16 md:py-24 text-background max-w-none">
      <div className="max-w-6xl mx-auto px-4 md:px-12 lg:px-16 grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-8 text-center desktop-stats-grid">
        <div className="desktop-stat">
          <p className="font-display font-bold text-4xl xl:text-5xl text-background mb-3">80+</p>
          <p className="font-sans text-sm text-background/60 leading-tight block mx-auto max-w-[150px]">
            Weddings & events played
          </p>
        </div>
        <div className="desktop-stat">
          <p className="font-display font-bold text-4xl xl:text-5xl text-background mb-3">ATCL</p>
          <p className="font-sans text-sm text-background/60 leading-tight block mx-auto max-w-[150px]">
            Qualified
          </p>
        </div>
        <div className="desktop-stat">
          <p className="font-display font-bold text-4xl xl:text-5xl text-background mb-3">0</p>
          <p className="font-sans text-sm text-background/60 leading-tight block mx-auto max-w-[150px]">
            Negative reviews... ever
          </p>
        </div>
        <div className="desktop-stat">
          <p className="font-display font-bold text-4xl xl:text-5xl text-background mb-3">12+</p>
          <p className="font-sans text-sm text-background/60 leading-tight block mx-auto max-w-[150px]">
            Years of experience
          </p>
        </div>
      </div>
    </SectionWrapper>
  );
}
