"use client";
/**
 * This section should make the practical case for live cello:
 * it sets the tone quickly, makes the event feel considered,
 * and avoids the generic feel that recorded or poorly planned music creates.
 */

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const problems = [
  {
    heading: "Plan without the pressure",
    line: "Organising event logistics can be a massive headache - leave the specifics to someone who knows the ins and outs already.",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full text-primary opacity-20">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="animate-[spin_10s_linear_infinite]" />
        <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="2" className="animate-[spin_15s_linear_infinite_reverse]" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
      </svg>
    ),
  },
  {
    heading: "Wow the guests",
    line: "When the atmosphere is right, it creates memories that last for years. Guests remember the mood more than anything else.",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full text-primary opacity-20">
        <path d="M10 50 Q 30 20, 50 50 T 90 50" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
        <line x1="10" y1="10" x2="10" y2="90" stroke="currentColor" strokeWidth="2" className="animate-[bounce_2s_infinite]" />
      </svg>
    ),
  },
  {
    heading: "Reliable availability",
    line: "If the musician cancels or is late, it can ruin the experience. Once a date is confirmed, it becomes my top priority. No cancellations or last minute surprises.",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full text-primary opacity-20">
        <circle cx="50" cy="50" r="10" fill="currentColor" className="animate-ping" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
      </svg>
    ),
  },
];

export function Problem() {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const cards = cardsRef.current;
      if (!cards?.length) return;

      cards.forEach((card, i) => {
        if (i === 0) return; // Skip first card

        gsap.fromTo(
          cards[i - 1],
          { scale: 1, opacity: 1 },
          {
            scale: 0.9,
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

      gsap.from(".problem-pivot", {
        scrollTrigger: {
          trigger: ".problem-pivot",
          start: "top 80%",
        },
        y: 20,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      gsap.from(".pivot-line", {
        scrollTrigger: {
          trigger: ".problem-pivot",
          start: "top 85%",
        },
        scaleX: 0,
        duration: 0.8,
        ease: "power2.out",
      });
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="why" ref={containerRef} className="bg-background">
      <SectionHeader
        label="Music, made easy"
        heading="Special events deserve special music"
      />

      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-12">
          {problems.map((item, idx) => (
            <div
              key={idx}
              ref={(el) => {
                cardsRef.current[idx] = el;
              }}
              className="sticky top-32 w-full h-[60dvh] md:h-[50dvh] bg-background border border-primary/20 rounded-card p-8 md:p-16 shadow-2xl flex flex-col md:flex-row items-center gap-8 md:gap-16 origin-top overflow-hidden"
            >
              <div className="flex-1 relative z-10">
                <h3 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-6">
                  {item.heading}
                </h3>
                <p className="font-sans text-lg text-foreground/80 leading-relaxed max-w-md">
                  {item.line}
                </p>
              </div>

              <div className="flex-1 w-full h-full relative flex items-center justify-center">
                <div className="w-48 h-48 md:w-64 md:h-64 relative">
                  {item.svg}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pivot */}
        <div className="problem-pivot pt-16">
          <div className="pivot-line h-px w-16 bg-accent mb-10 origin-left" />
          <p className="font-serif italic text-3xl md:text-4xl text-primary leading-snug mb-6">
            What will the guests remember? (should be CTA)
          </p>
          <p className="font-sans text-lg text-foreground/70 max-w-xl">
            With good music, the food tastes better, conversations flow, and the day becomes memorable.
          </p>
          <span className="font-mono text-sm text-accent mt-4 block">
            — Stamer
          </span>
        </div>
      </div>
    </SectionWrapper>
  );
}
