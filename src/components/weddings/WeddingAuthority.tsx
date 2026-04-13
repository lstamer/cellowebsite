"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Star } from "lucide-react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const testimonials = [
  {
    quote: "He learned our song with a day's notice and played it more beautifully than the original. I cried. My husband cried. Everyone cried.",
    name: "Sophie & Marcus",
  },
  {
    quote: "Everything was handled. We didn't think about the music once on the day — and that's the highest compliment.",
    name: "Imogen & Noah",
  },
  {
    quote: "The biggest thing my guests mentioned after the wedding was the music. Luke truly did a fantastic performance, and he showed genuine care for the event.",
    name: "Charlotte & Elias",
  },
];

function StarRating({ className }: { className?: string }) {
  return (
    <div className={twMerge(clsx("flex gap-0.5", className))}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} fill="currentColor" className="w-5 h-5 text-accent" />
      ))}
    </div>
  );
}

export function WeddingAuthority() {
  const outerRef = useRef<HTMLDivElement>(null);

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
    <div ref={outerRef} id="testimonials" className="w-full py-24 md:py-32 bg-background">
      <SectionWrapper maxWidth="max-w-6xl">
        <div className="text-center mb-20 md:mb-28">
          <p className="font-display text-sm tracking-widest font-bold uppercase text-primary/60 mb-4">
            Trusted by couples
          </p>
          <h2 className="font-serif italic text-4xl sm:text-5xl lg:text-6xl text-primary text-balance">
            Don&apos;t take our word for it. See what{" "}
            <HandDrawnUnderline variant={2}>customers</HandDrawnUnderline> are
            saying.
          </h2>
        </div>

        <div className="testimonials-grid grid w-full grid-cols-1 gap-8 md:grid-cols-3 md:gap-8 lg:gap-10 items-stretch justify-items-stretch">
          {testimonials.map((t, i) => (
            <article
              key={i}
              className="testimonial-card group flex min-h-0 flex-col bg-background border border-primary/10 rounded-card p-8 md:p-10 shadow-card transition-[box-shadow,border-color] duration-300 hover:border-primary/20 hover:shadow-card-hover"
            >
              <StarRating className="mb-8 text-accent" />
              <p className="font-serif italic text-2xl md:text-3xl leading-snug text-foreground mb-10 flex-1 text-pretty">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="border-t border-primary/10 pt-5 mt-auto">
                <p className="font-display font-bold text-xs tracking-widest uppercase text-primary/70">
                  {t.name}
                </p>
              </div>
            </article>
          ))}
        </div>
      </SectionWrapper>
    </div>
  );
}
