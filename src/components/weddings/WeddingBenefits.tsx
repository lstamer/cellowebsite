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

const differentiators = [
  {
    title: "Timing control",
    description: "Adapting seamlessly to the flow of the ceremony in real-time, whether someone walks too fast or is running late.",
  },
  {
    title: "Calm planning",
    description: "Clear communication, structured details, and no guesswork. We plan every moment together before the big day.",
  },
  {
    title: "Musical adaptability",
    description: "Bespoke cello arrangements crafted specifically for your key moments, matching the mood perfectly.",
  },
  {
    title: "Technical backup",
    description: "Professional, discreet amplification suited for any venue size, with contingencies built-in.",
  },
  {
    title: "Professional presentation",
    description: "An elegant, polished appearance that fits beautifully into any high-end setting or dress code.",
  },
  {
    title: "Zero added work",
    description: "Everything is handled autonomously on the day. You don't need to direct, manage, or worry about the music.",
  },
];

export function WeddingBenefits() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scroll = {
        trigger: containerRef.current,
        start: "top 75%",
        once: true,
      };

      const tl = gsap.timeline({ scrollTrigger: scroll });

      tl.fromTo(
        ".benefit-intro",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );

      tl.fromTo(
        ".benefit-card",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: { each: 0.12, from: "start" },
          ease: "power3.out",
        },
        "-=0.45"
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper
      id="benefits"
      ref={containerRef}
      className="relative bg-background pt-24 pb-32"
    >
      <div className="benefit-intro mb-16">
        <SectionHeader
          label="The Difference"
          heading="Why couples choose to work with me"
          alignment="left"
          className="!mb-0"
        />
        <p className="font-sans mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70 text-pretty">
          Live music should be one less thing to worry about. Here is how I ensure the performance feels reliable, professional, and effortless.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {differentiators.map((diff, idx) => {
          const titleId = `benefit-title-${idx}`;
          return (
            <article
              key={titleId}
              tabIndex={0}
              aria-labelledby={titleId}
              className="benefit-card flex flex-col pt-6 border-t border-primary/20 outline-none"
            >
              <h3
                id={titleId}
                className="font-display text-xl font-bold tracking-tight text-primary mb-3"
              >
                {diff.title}
              </h3>
              <p className="font-sans text-base leading-relaxed text-foreground/70 text-pretty max-w-[40ch]">
                {diff.description}
              </p>
            </article>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
