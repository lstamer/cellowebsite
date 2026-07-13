"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function PrivateEventsHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".hero-elem",
        { y: 40, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
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
          src="/images/celebrations-hero.jpg"
          alt="Candlelit tables set for a milestone birthday celebration with balloons"
          fill
          priority
          className="object-cover object-[55%_42%] grayscale-[15%]"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-surface-dark/90 via-surface-dark/60 to-surface-dark/20"
          aria-hidden
        />
      </div>

      <div className="relative z-10 flex w-full flex-col px-section-x-sm pt-32 pb-16 md:px-section-x-md md:pt-36 md:pb-20 lg:max-w-[min(52%,56rem)] lg:px-section-x-lg">
        <h1 className="mb-6 flex w-full flex-col gap-2">
          <span className="hero-elem block font-jost text-sm font-bold uppercase tracking-widest text-on-dark md:text-base">
            Cello for
          </span>
          <span className="hero-elem block font-serif text-display italic leading-[0.85] text-on-dark lg:whitespace-nowrap">
            Celebrations
          </span>
        </h1>

        <p className="hero-elem mb-8 max-w-2xl text-balance font-sans text-lg leading-relaxed text-on-dark/80 md:text-xl">
          A milestone birthday, an anniversary dinner, a garden party at home —
          I bring live cello that your guests feel the second they walk in, and
          talk about long after they&apos;ve gone home.
        </p>

        <div className="hero-elem flex flex-wrap gap-4">
          <Button href="/book?type=private-event" variant="primary" size="lg" className="w-full sm:w-auto">
            Check my date
          </Button>
        </div>
        <p className="hero-elem mt-4 max-w-2xl font-sans text-sm leading-relaxed text-on-dark/80">
          I&apos;ll confirm on WhatsApp, usually same day.
        </p>
      </div>
    </section>
  );
}
