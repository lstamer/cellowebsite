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

  useGSAP(
    () => {
      gsap.from(".problem-block", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
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

      <div className="max-w-3xl mx-auto space-y-16">
        {problems.map((item, idx) => (
          <div
            key={idx}
            className="problem-block border-l-2 border-accent pl-8"
          >
            <h3 className="font-display font-bold text-xl md:text-2xl text-foreground mb-3">
              {item.heading}
            </h3>
            <p className="font-sans text-lg text-foreground/60 leading-relaxed">
              {item.line}
            </p>
          </div>
        ))}

        {/* Pivot */}
        <div className="problem-pivot pt-8">
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
