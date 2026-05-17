"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function WeddingImportance() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
          once: true,
        },
      });

      tl.fromTo(
        ".importance-img",
        {
          y: 40,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.2,
          ease: "power3.out",
        }
      );

      tl.fromTo(
        ".importance-text",
        {
          y: 20,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.6"
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="importance" ref={containerRef} className="bg-background py-16 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Images - Asymmetric Composition */}
        <div className="lg:col-span-7 relative h-[500px] md:h-[600px] w-full max-w-2xl mx-auto flex items-center justify-center">
          <div className="importance-img absolute left-0 top-1/2 -translate-y-1/2 w-[60%] h-[80%] rounded-card overflow-hidden shadow-card z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://picsum.photos/seed/weddingceremony/800/1000" alt="Wedding ceremony" className="w-full h-full object-cover grayscale-[15%]" />
          </div>
          <div className="importance-img absolute right-0 top-[10%] w-[55%] h-[75%] rounded-card overflow-hidden shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://picsum.photos/seed/weddingguests/800/1000" alt="Wedding guests" className="w-full h-full object-cover grayscale-[15%]" />
          </div>
        </div>

        {/* Text */}
        <div className="lg:col-span-5 importance-text flex flex-col justify-center">
          <p className="font-jost text-primary text-sm tracking-widest uppercase font-bold mb-4 border-l-2 border-accent pl-3">
            The Impact
          </p>
          <h2 className="font-serif italic text-4xl md:text-5xl text-foreground mb-8 leading-snug">
            Music amplifies everything else.
          </h2>
          <div className="space-y-6 font-sans text-lg text-foreground/70 leading-relaxed max-w-prose">
            <p>
              It makes the ceremony more emotional. It helps guest conversations flow easier. The food tastes better, and the atmosphere feels richer. It sets the exact tone for a day that will be cherished forever.
            </p>
            <p className="font-medium text-foreground">
              Imagine if you lost that feeling because the music was wrong.
            </p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
