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
import { Button } from "@/components/ui/Button";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const problems = [
  {
    heading: "Plan without the pressure",
    line: "Organising event logistics can be a massive headache - leave the specifics to someone who knows the ins and outs already.",
  },
  {
    heading: "Wow the guests",
    line: "When the atmosphere is right, it creates memories that last for years. Guests remember the mood more than anything else.",
  },
  {
    heading: "Reliable availability",
    line: "If the musician cancels or is late, it can ruin the experience. Once a date is confirmed, it becomes my top priority. No cancellations or last minute surprises.",
  },
];

export function Problem() {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const cards = cardsRef.current.filter(Boolean);
      if (cards.length) {
        gsap.fromTo(
          cards,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.14,
            ease: "power3.out",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 70%",
              once: true,
            },
          }
        );
      }

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
        <div className="flex flex-col gap-6 md:gap-8">
          {problems.map((item, idx) => (
            <div
              key={idx}
              ref={(el) => {
                cardsRef.current[idx] = el;
              }}
              className="w-full bg-background border border-primary/15 border-l-[3px] border-l-accent rounded-card p-8 md:p-10 shadow-card"
            >
              <h3 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
                {item.heading}
              </h3>
              <p className="font-sans text-base md:text-lg text-foreground/80 leading-relaxed max-w-2xl">
                {item.line}
              </p>
            </div>
          ))}
        </div>

        {/* Pivot to CTA */}
        <div className="problem-pivot pt-16 flex flex-col gap-6">
          <div className="pivot-line h-px w-16 bg-accent origin-left" />
          <p className="font-serif italic text-3xl md:text-4xl text-primary leading-snug">
            Make sure your guests remember it.
          </p>
          <div>
            <Button href="/book" variant="primary" size="md" className="font-display">
              Check my availability
            </Button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
