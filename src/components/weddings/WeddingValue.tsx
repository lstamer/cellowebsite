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

const values = [
  {
    heading: "The pressure of planning",
    line: "You've made a hundred decisions to get here. You deserve a musician who takes the weight off, rather than adding to it.",
  },
  {
    heading: "Finding the right feel",
    line: "It's hard to know from a website who will feel right in the room. You want someone who can read the atmosphere and elevate it naturally.",
  },
  {
    heading: "Creating a lasting memory",
    line: "Couples often worry guests won't notice the details. Live music is one of the few things guests actually feel and remember.",
  },
];

export function WeddingValue() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".value-block",
        {
          y: 30,
          opacity: 0,
        },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 70%",
            once: true,
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
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
            start: "top 80%",
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
    <SectionWrapper id="value" ref={containerRef} className="bg-background pt-24 md:pt-32">
      <SectionHeader
        label="Why it matters"
        heading="Music that feels considered"
      />

      <div className="max-w-3xl mx-auto space-y-16">
        {values.map((item, idx) => (
          <div
            key={idx}
            className="value-block border-l-2 border-accent pl-8"
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
        <div className="value-pivot pt-8">
          <div className="pivot-line h-px w-16 bg-accent mb-10 origin-left" />
          <p className="font-serif italic text-3xl md:text-4xl text-primary leading-snug mb-6">
            It should feel effortless.
          </p>
          <p className="font-sans text-lg text-foreground/70 max-w-xl">
            Every detail is planned together with calm, clear communication, so the music fits like it was always part of the story.
          </p>
        </div>
      </div>
    </SectionWrapper>
  );
}
