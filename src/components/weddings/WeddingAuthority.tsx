"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const testimonials = [
  {
    quote: "He learned our song with a day's notice and played it more beautifully than the original. I cried. My husband cried. Everyone cried.",
    name: "Sophie & Marcus",
  },
  {
    quote: "Everything was handled. We didn't think about the music once on the day \u2014 and that's the highest compliment.",
    name: "Imogen & Noah",
  },
  {
    quote: "The biggest thing my guests mentioned after the wedding was the music. Luke truly did a fantastic performance, and he showed genuine care for the event.",
    name: "Charlotte & Elias",
  },
];

export function WeddingAuthority() {
  const outerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const grid = outerRef.current?.querySelector<HTMLElement>(".testimonials-grid");
      if (!grid) return;

      gsap.fromTo(
        ".testimonial-card",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: grid,
            start: "top 80%",
            once: true,
          },
        }
      );
    },
    { scope: outerRef }
  );

  return (
    <SectionWrapper
      ref={outerRef}
      id="testimonials"
      maxWidth="max-w-6xl"
      className={cn("bg-background", "pb-12 md:pb-16")}
    >
      <div className="text-center mb-20 md:mb-28">
        <p className="font-jost text-sm tracking-widest font-bold uppercase text-primary/60 mb-4">
          Trusted by couples
        </p>
        <h2 className="font-serif italic text-4xl sm:text-5xl lg:text-6xl text-primary text-balance">
          Don&apos;t take our word for it. See what{" "}
          <HandDrawnUnderline variant={2}>customers</HandDrawnUnderline> are
          saying.
        </h2>
      </div>

      {/* Minimalist 3-column grid */}
      <div className="testimonials-grid grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        {testimonials.map((t, i) => (
          <article
            key={i}
            className="testimonial-card flex flex-col bg-transparent border border-primary/10 rounded-card p-8 lg:p-10 transition-colors duration-300 hover:border-primary/20 max-w-[38rem] mx-auto w-full"
          >
            <p className="font-serif italic text-2xl lg:text-3xl leading-snug text-foreground mb-10 flex-1 text-pretty">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-auto pt-2">
              <p className="font-jost font-bold text-xs tracking-widest uppercase text-primary/60">
                &mdash; {t.name}
              </p>
            </div>
          </article>
        ))}
      </div>
    </SectionWrapper>
  );
}
