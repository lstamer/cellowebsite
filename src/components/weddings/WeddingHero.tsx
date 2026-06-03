"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { dispatchWeddingHeroReady } from "@/components/weddings/WeddingScrollRefresh";

export function WeddingHero() {
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
      className="relative w-full overflow-clip text-on-dark"
    >
      <div className="absolute inset-0">
        <Image
          src="/images/wedding%20photo.jpg"
          alt="Floral arrangement on a wooden wedding arch outdoors"
          fill
          priority
          onLoad={dispatchWeddingHeroReady}
          className="object-cover object-[72%_45%]"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-surface-dark/90 via-surface-dark/60 to-surface-dark/20"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex w-full flex-col px-section-x-sm pt-32 pb-16 md:px-section-x-md md:pt-36 md:pb-20 lg:max-w-[min(52%,56rem)] lg:px-section-x-lg">
        <h1 className="mb-6 flex w-full flex-col gap-2">
          <span className="hero-elem block font-jakarta text-2xl font-bold uppercase tracking-tight text-on-dark md:text-3xl lg:text-4xl">
            Cello for
          </span>
          <span className="hero-elem block font-serif text-display italic leading-[0.85] text-on-dark lg:whitespace-nowrap">
            Weddings
          </span>
        </h1>

        <p className="hero-elem mb-8 max-w-2xl text-balance font-sans text-lg leading-relaxed text-on-dark/80 md:text-xl">
          From guest arrival to the last quiet moment before dinner, live cello
          gives the day warmth, poise, and a sense of occasion.
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
