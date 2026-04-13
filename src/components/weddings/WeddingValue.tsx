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
      />

      <div className="max-w-4xl mx-auto">
        <ul className="questions-list space-y-5 md:space-y-6 mb-16 md:mb-24">
          {questions.map((q, idx) => (
            <li
              key={idx}
              className="question-item font-serif italic text-2xl md:text-3xl text-foreground/70 leading-snug"
            >
              &ldquo;{q}&rdquo;
            </li>
          ))}
        </ul>

        {/* Pivot */}
        <div className="value-pivot pt-8 md:pt-12 border-t border-foreground/10">
          <div className="pivot-line h-px w-16 bg-accent mb-10 origin-left" />
          <p className="font-serif italic text-3xl md:text-4xl text-primary leading-snug mb-6">
            It shouldn&apos;t be guesswork or stressful.
          </p>
          <p className="font-sans text-lg text-foreground/70 max-w-xl leading-relaxed">
            I work with you to plan every musical detail, handling the logistics and timings so you can simply arrive and enjoy the moment.
          </p>
        </div>
      </div>
    </SectionWrapper>
  );
}
