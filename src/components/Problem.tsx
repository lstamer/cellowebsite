"use client";
/**
 * This section ("Problem") is crafted specifically to directly address lingering objections and the most common sources of anxiety or disappointment for event planners, wedding couples, and discerning clients booking live music.
 * 
 * It is vital that the copy and problems presented here speak to:
 * - Common frustrations: generic playlists, inattentive musicians, music that fails to match the tone or importance of the event, or feeling like live music is an "afterthought" rather than a memorable highlight.
 * - The emotional stakes: clients want reassurance that their vision will be honored and elevated, and that the atmosphere won't just be "filler" but something curated and intentional.
 * - Implicit objections: Will my needs be heard? Will the music feel personal and fitting? Is booking live music adding stress, or true value?
 * 
 * The messaging here should therefore preemptively answer these hesitations—either directly or by showing that every performance is tailored, thoughtful, and handled with depth of care.
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
    heading: "The wrong playlist",
    line: "Background noise where a live moment should be.",
  },
  {
    heading: "The generic setlist",
    line: "A musician who showed up — but never asked what mattered to you.",
  },
  {
    heading: "The missed atmosphere",
    line: "Months of planning, and the one detail guests actually feel was left to chance.",
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
        label="Why it matters"
        heading="Special moments deserve special music"
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
            It doesn&apos;t have to be a guess.
          </p>
          <p className="font-sans text-lg text-foreground/70 max-w-xl">
            Every detail is planned together, so the music fits like it was
            always part of the story.
          </p>
          <span className="font-mono text-sm text-accent mt-4 block">
            — Stamer
          </span>
        </div>
      </div>
    </SectionWrapper>
  );
}
