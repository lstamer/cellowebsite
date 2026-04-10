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
import clsx from "clsx";

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
      // Scroll-driven typography reveal for headings
      gsap.utils.toArray(".problem-heading").forEach((heading: any) => {
        gsap.to(heading, {
          scrollTrigger: {
            trigger: heading,
            start: "top 85%",
            end: "top 45%",
            scrub: true,
          },
          opacity: 1,
          color: "var(--color-foreground)",
          ease: "none",
        });
      });

      // Subtle staggered fade for the descriptions
      gsap.utils.toArray(".problem-line").forEach((line: any) => {
        gsap.fromTo(line, 
          { opacity: 0, y: 20 },
          {
            scrollTrigger: {
              trigger: line,
              start: "top 80%",
            },
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
          }
        );
      });

      gsap.from(".problem-pivot", {
        scrollTrigger: {
          trigger: ".problem-pivot",
          start: "top 80%",
        },
        y: 40,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
      });

      gsap.from(".pivot-line", {
        scrollTrigger: {
          trigger: ".problem-pivot",
          start: "top 85%",
        },
        scaleX: 0,
        duration: 1,
        ease: "power3.out",
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

      <div className="max-w-4xl mx-auto space-y-24 md:space-y-32 py-12 md:py-24">
        {problems.map((item, idx) => (
          <div
            key={idx}
            className={clsx(
              "problem-block max-w-lg",
              idx === 0 && "md:mr-auto",
              idx === 1 && "md:ml-auto",
              idx === 2 && "md:ml-24"
            )}
          >
            {/* The heading starts slightly transparent and with a lighter color/outline effect */}
            <h3 className="problem-heading font-serif italic text-4xl md:text-5xl lg:text-6xl text-primary mb-6 opacity-30" style={{ WebkitTextStroke: "1px var(--color-foreground)", color: "transparent" }}>
              {item.heading}
            </h3>
            <p className="problem-line font-sans text-xl md:text-2xl text-foreground/60 leading-relaxed">
              {item.line}
            </p>
          </div>
        ))}

        {/* Pivot */}
        <div className="problem-pivot pt-16 md:pt-24 md:ml-auto max-w-2xl">
          <div className="pivot-line h-px w-24 bg-accent mb-12 origin-left" />
          <p className="font-serif italic text-4xl md:text-5xl lg:text-6xl text-primary leading-snug mb-8 text-balance">
            It doesn&apos;t have to be a guess.
          </p>
          <p className="font-sans text-xl md:text-2xl text-foreground/70 max-w-xl leading-relaxed">
            Every detail is planned together, so the music fits like it was
            always part of the story.
          </p>
          <span className="font-mono text-sm tracking-widest uppercase text-accent mt-8 block">
            — Stamer
          </span>
        </div>
      </div>
    </SectionWrapper>
  );
}
