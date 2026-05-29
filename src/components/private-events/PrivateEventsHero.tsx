"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/Button";

export function PrivateEventsHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".hero-elem",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",
          stagger: 0.08,
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-clip bg-surface-dark text-on-dark"
    >
      <div className="relative z-10 flex w-full flex-col px-section-x-sm pt-32 pb-16 md:px-section-x-md md:pt-36 md:pb-20 lg:max-w-[min(52%,56rem)] lg:px-section-x-lg">
        <h1 className="mb-6 flex w-full flex-col gap-2">
          <span className="hero-elem block font-jakarta text-2xl font-bold uppercase tracking-tight text-on-dark md:text-3xl lg:text-4xl">
            Cello for
          </span>
          <span className="hero-elem block font-serif text-display italic leading-[0.85] text-on-dark lg:whitespace-nowrap">
            Private Events
          </span>
        </h1>

        <p className="hero-elem mb-8 max-w-2xl text-balance font-sans text-lg leading-relaxed text-on-dark/80 md:text-xl">
          A milestone birthday, an anniversary dinner, a garden party at home —
          live cello sets the tone of the room and gives the evening a sense of
          occasion your guests feel the moment they arrive.
        </p>

        <div className="hero-elem flex flex-wrap gap-4">
          <Button href="/book" variant="primary" size="lg" className="w-full sm:w-auto">
            Check availability
          </Button>
        </div>
      </div>
    </section>
  );
}
