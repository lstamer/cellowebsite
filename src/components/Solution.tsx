"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const steps = [
  {
    num: "01",
    title: "Connect",
    desc: "Reach out to discuss your event and vision. We'll explore the atmosphere you want to create.",
    imageSeed: "connect",
  },
  {
    num: "02",
    title: "Plan the Music",
    desc: "We plan the repertoire together so every piece matches the significance, pacing, and mood of your event.",
    imageSeed: "cello",
  },
  {
    num: "03",
    title: "Perform the Moment",
    desc: "Relax and enjoy a flawless performance. The music elevates your event, exactly as planned.",
    imageSeed: "performance",
  },
];

export function Solution() {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>(null);

  useGSAP(
    () => {
      const cards = cardsRef.current;
      if (!cards?.length) return;

      cards.forEach((card, i) => {
        if (i === 0) return; // Skip first card

        gsap.fromTo(
          cards[i - 1],
          { scale: 1, filter: "blur(0px)", opacity: 1 },
          {
            scale: 0.9,
            filter: "blur(10px)",
            opacity: 0.4,
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "top top",
              scrub: true,
            },
          }
        );
      });
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper ref={containerRef} className="bg-background relative" id="process" maxWidth="max-w-none">
      <SectionHeader label="The Plan" heading="Let's make something beautiful." />

      <div className="max-w-4xl mx-auto flex flex-col gap-12">
        {steps.map((step, i) => (
          <div
            key={i}
            ref={(el) => { if (cardsRef.current) cardsRef.current[i] = el; }}
            className="sticky top-32 w-full min-h-[50vh] bg-background/80 backdrop-blur-xl border border-primary/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_20px_40px_rgba(0,0,0,0.05)] rounded-card p-8 md:p-16 flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16 origin-top overflow-hidden"
          >
            {/* Number background */}
            <div className="absolute -top-10 -left-10 text-[12rem] font-mono font-bold text-primary/5 select-none pointer-events-none">
              {step.num}
            </div>

            <div className="flex-1 relative z-10 w-full">
              <span className="font-mono text-accent font-bold tracking-widest text-sm mb-4 block uppercase">
                Step {step.num}
              </span>
              <h3 className="font-serif italic text-4xl md:text-5xl text-foreground mb-6">
                {step.title}
              </h3>
              <p className="font-sans text-lg text-foreground/80 leading-relaxed max-w-md">
                {step.desc}
              </p>
            </div>

            {/* High-quality abstract imagery column */}
            <div className="flex-1 w-full relative flex items-center justify-center">
              <div className="w-full aspect-square md:w-64 md:h-64 relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/20">
                <Image
                  src={`https://picsum.photos/seed/${step.imageSeed}/800/800`}
                  alt={`Step ${step.num}: ${step.title}`}
                  fill
                  className="object-cover grayscale-[15%] hover:scale-105 transition-transform duration-700 ease-out"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
                {/* Noise overlay to add texture to the image */}
                <div 
                  className="absolute inset-0 mix-blend-overlay opacity-40 pointer-events-none" 
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
