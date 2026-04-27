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

const questions = [
  "What happens if the bride is late? Does the music just... loop?",
  "How do I time the processional music so it starts at the right moment and lasts exactly as long as the walk?",
  "How do I match the music to the venue's vibe without it feeling off?",
  "Do I need different music for the ceremony, cocktail hour, AND reception entrance or is that overkill?",
  "Is my playlist too cliche? Will the guests like it?",
  "What's the backup plan if there's technical issues mid-ceremony?",
  "Who's going to manage all of this on the day?",
];

export function WeddingValue() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".question-item",
        {
          y: 20,
          opacity: 0,
        },
        {
          scrollTrigger: {
            trigger: ".questions-list",
            start: "top 80%",
            once: true,
          },
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
        }
      );

      gsap.fromTo(
        ".value-pivot",
        {
          y: 20,
          opacity: 0,
        },
        {
          scrollTrigger: {
            trigger: ".value-pivot",
            start: "top 85%",
            once: true,
          },
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
        }
      );

      gsap.fromTo(
        ".pivot-line",
        {
          scaleX: 0,
        },
        {
          scrollTrigger: {
            trigger: ".value-pivot",
            start: "top 85%",
            once: true,
          },
          scaleX: 1,
          duration: 0.8,
          ease: "power2.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="value" ref={containerRef} className="bg-background pt-24 md:pt-32 pb-8 md:pb-12">
      <SectionHeader
        label="The Reality"
        heading="Big day? Too many decisions?"
        labelPlacement="beside"
      />

      <div className="max-w-4xl mx-auto">
        <ul className="questions-list space-y-5 md:space-y-6 mb-16 md:mb-24">
          {questions.map((q, idx) => (
            <li
              key={idx}
              className="question-item font-display text-xl md:text-2xl lg:text-3xl text-foreground/40  text-left lg:text-center max-w-3xl mx-auto transition-colors duration-500 hover:text-foreground/80 leading-snug cursor-default"
            >
              &ldquo;{q}&rdquo;
            </li>
          ))}
        </ul>

        {/* Pivot: lg:block so heading + body share one left edge (column flex + items-center centers each item to a different width) */}
        <div className="value-pivot pt-8 md:pt-12 flex w-full flex-col items-center text-center lg:block lg:text-left">
          <div className="pivot-line mb-12 h-px w-24 origin-center bg-accent/50 md:mb-16 md:w-32 lg:mx-0 lg:origin-left" />
          <div className="mx-auto w-full max-w-3xl lg:mx-0">
            <p className="mb-8 max-w-3xl font-serif text-4xl italic leading-[1.1] text-primary text-balance md:text-5xl lg:mx-0 lg:max-w-none lg:text-6xl">
              It shouldn&apos;t be guesswork or stressful.
            </p>
            <p className="max-w-2xl font-sans text-lg leading-relaxed text-foreground/70 text-pretty md:text-xl lg:mx-0">
              Every detail is planned together with calm, clear communication, so the music fits like it was always part of the story.
            </p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
