"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function Testimonials() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".testimonial-card", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper ref={containerRef} className="text-center" maxWidth="max-w-5xl">
      <div className="testimonial-card flex flex-col items-center">
        <p className="font-serif italic text-3xl md:text-5xl text-primary leading-tight mb-10 text-balance">
          &ldquo;The music transformed our ceremony into something out of a movie. It was the exact atmosphere we dreamed of.&rdquo;
        </p>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-bold text-primary">
            E&J
          </div>
          <div className="text-left">
            <p className="font-display font-bold text-foreground">Elena & James</p>
            <p className="font-sans text-sm text-foreground/60">Wedding Ceremony</p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
