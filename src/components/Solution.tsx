"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const steps = [
  {
    num: "01",
    title: "Connect",
    desc: "Reach out to discuss your event and vision. We'll explore the atmosphere you want to create.",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full text-primary opacity-20">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-[spin_10s_linear_infinite]" />
        <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="2" className="animate-[spin_15s_linear_infinite_reverse]" origin="center" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Plan the Music",
    desc: "We plan the repertoire together so every piece matches the significance, pacing, and mood of your event.",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full text-primary opacity-20">
        <path d="M10 50 Q 30 20, 50 50 T 90 50" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
        <line x1="10" y1="10" x2="10" y2="90" stroke="currentColor" strokeWidth="2" className="animate-[bounce_2s_infinite]" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Perform the Moment",
    desc: "Relax and enjoy a flawless performance. The music elevates your event, exactly as planned.",
    svg: (
      <svg viewBox="0 0 100 100" className="text-primary opacity-20">
        <circle cx="50" cy="50" r="10" fill="currentColor" className="animate-ping" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
      </svg>
    ),
  },
];

export function Solution() {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>(null);

  useGSAP(
    () => {
      const cards = cardsRef.current;
      if (!cards?.length) return;

      cards.forEach((card, i) => {
        if (i === 0) return; // Skip first card

        gsap.fromTo(
          cards[i - 1],
          { scale: 1, filter: "blur(0px)", opacity: 1 },
          {
            scale: 0.9,
            filter: "blur(10px)",
            opacity: 0.4,
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "top top",
              scrub: true,
            },
          }
        );
      });
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper ref={containerRef} className="bg-background relative" id="process" maxWidth="max-w-none">
      <SectionHeader label="The Plan" heading="Let's make something beautiful." />

      <div className="max-w-4xl mx-auto flex flex-col gap-12">
        {steps.map((step, i) => (
          <div
            key={i}
            ref={(el) => { if (cardsRef.current) cardsRef.current[i] = el; }}
            className="sticky top-32 w-full h-[60vh] md:h-[50vh] bg-background border border-primary/20 rounded-card p-8 md:p-16 shadow-2xl flex flex-col md:flex-row items-center gap-8 md:gap-16 origin-top overflow-hidden"
          >
            {/* Number background */}
            <div className="absolute -top-10 -left-10 text-[12rem] font-mono font-bold text-primary/5 select-none pointer-events-none">
              {step.num}
            </div>

            <div className="flex-1 relative z-10">
              <span className="font-mono text-accent font-medium mb-4 block">
                Step {step.num}
              </span>
              <h3 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-6">
                {step.title}
              </h3>
              <p className="font-sans text-lg text-foreground/80 leading-relaxed max-w-md">
                {step.desc}
              </p>
            </div>

            <div className="flex-1 w-full h-full relative flex items-center justify-center">
              <div className="w-48 h-48 md:w-64 md:h-64 relative">
                {step.svg}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
