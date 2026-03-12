"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const statements = [
  {
    problem: "When the music feels right, the moment becomes unforgettable.",
    solution: "That's why every performance is carefully tailored.",
  },
  {
    problem: "When the music feels right, the moment becomes unforgettable.",
    solution: "That's why every performance is carefully tailored.",
  },
  {
    problem: "The atmosphere should feel exactly right.",
    solution: "That's why the cello is the perfect voice.",
  },
];

export function Problem() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".statement-group", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
        },
        y: 30,
        opacity: 0,
        duration: 1,
        stagger: 0.3,
        ease: "power2.out",
      });
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper
      ref={containerRef}
      className="relative bg-surface-dark text-background overflow-hidden"
      maxWidth="max-w-none"
    >
      {/* Background Texture */}
      <div className="absolute inset-0 w-full h-full opacity-5 pointer-events-none mix-blend-overlay">
        <Image
          src="/images/heroImage.jpeg"
          alt="Texture"
          fill
          className="object-cover grayscale"
          sizes="100vw"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-24">
        {statements.map((item, idx) => (
          <div key={idx} className="statement-group flex flex-col gap-6 text-center">
            <p className="font-serif italic text-3xl md:text-5xl text-background/90 leading-tight">
              &ldquo;{item.problem}&rdquo;
            </p>
            <div className="w-12 h-px bg-accent mx-auto opacity-50" />
            <p className="font-display font-bold text-lg md:text-xl text-accent uppercase tracking-wide">
              {item.solution}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
