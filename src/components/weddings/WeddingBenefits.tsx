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
      className="relative overflow-hidden bg-background"
    >
      <div
        className="pointer-events-none absolute -top-32 right-0 h-[min(28rem,70vw)] w-[min(28rem,70vw)] translate-x-1/4 rounded-full bg-primary/5"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[min(16rem,45vw)] w-[min(16rem,45vw)] -translate-x-1/4 translate-y-1/4 rounded-full bg-accent/5"
        aria-hidden
      />

      <div className="relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-0">
        <div className="benefit-intro lg:col-span-5">
          <SectionHeader
            label="The experience"
            heading="Why couples choose to work with me"
            alignment="left"
            className="!mb-0"
          />
          <p className="font-sans mt-8 max-w-md text-lg leading-relaxed text-foreground/70 text-pretty">
            Music is one part of a day full of moving pieces. Here is how I approach the wedding side so it feels steady, personal, and easy to trust.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:gap-7 md:grid-cols-2 md:gap-6 lg:col-span-7 lg:gap-7">
          {benefits.map((benefit, idx) => {
            const titleId = `benefit-title-${idx}`;
            return (
              <article
                key={titleId}
                tabIndex={0}
                aria-labelledby={titleId}
                className="benefit-card group relative rounded-card border border-primary/10 bg-background p-7 shadow-card ring-1 ring-primary/5 outline-none transition-all duration-300 md:p-9 hover:-translate-y-1 hover:border-primary/20 hover:shadow-card-hover focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 active:scale-[0.99]"
              >
                <h3
                  id={titleId}
                  className="font-display text-xl font-semibold tracking-tight text-primary mb-4"
                >
                  {benefit.title}
                </h3>
                <p className="font-sans max-w-prose text-base leading-relaxed text-foreground/70 text-pretty">
                  {benefit.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
}
