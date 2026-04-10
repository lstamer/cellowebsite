"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const benefits = [
  {
    title: "Tailored to your day",
    description: "From aisle music to signing pieces, everything is chosen to fit your taste and timing.",
  },
  {
    title: "Calm, clear planning",
    description: "You won’t be left guessing what happens when. I help make the music side feel simple.",
  },
  {
    title: "Experienced with live flow",
    description: "Ceremonies move in real time. Experience matters when adapting naturally to the cues and pacing of the moment.",
  },
  {
    title: "Professional presentation",
    description: "The music sounds beautiful, and the presentation looks appropriate and elegant in any setting.",
  },
];

export function WeddingBenefits() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".benefit-card",
        {
          y: 40,
          opacity: 0,
        },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
            once: true,
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="benefits" ref={containerRef} className="bg-background py-24 md:py-32">
      <SectionHeader
        label="The experience"
        heading="Why couples choose to work with me"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mt-16">
        {benefits.map((benefit, idx) => (
          <div
            key={idx}
            className="benefit-card group relative bg-background border border-primary/10 rounded-card p-8 md:p-10 shadow-card transition-[box-shadow,border-color] duration-300 hover:border-primary/20 hover:shadow-card-hover"
          >
            <h3 className="font-display font-bold text-xl text-primary mb-4">
              {benefit.title}
            </h3>
            <p className="font-sans text-base leading-relaxed text-foreground/70">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
