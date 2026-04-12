"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Image from "next/image";

export function WeddingHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [heroHeight, setHeroHeight] = useState<number | null>(null);

  useEffect(() => {
    setHeroHeight(window.innerHeight);
  }, []);

  useGSAP(
    () => {
      gsap.from(".hero-elem", {
        y: 40,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.08,
      });
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="sticky top-0 z-[1] relative min-h-[70svh] w-full flex items-end pb-20 md:pb-28 px-section-x-sm md:px-section-x-md lg:px-section-x-lg overflow-clip bg-surface-dark"
      style={heroHeight ? { minHeight: heroHeight * 0.7 } : undefined}
    >
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/wedding.jpg"
          alt="Wedding cello performance"
          fill
          priority
          className="absolute inset-0 w-full h-full object-cover object-center grayscale-[15%]"
          sizes="100vw"
        />
        {/* Heavy Primary -> Black Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-primary/80 to-primary/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/90 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl">
        <h1 className="flex flex-col gap-2 mb-6">
          <span className="hero-elem block text-background font-display font-bold text-xl md:text-2xl lg:text-3xl tracking-tight uppercase">
            Weddings
          </span>
          <span className="hero-elem block text-background font-serif italic text-display leading-[0.85] pr-4">
            A ceremony with feeling
          </span>
        </h1>

        <p className="hero-elem max-w-2xl text-balance font-sans text-lg leading-relaxed text-background/80 md:text-xl">
          From the first guest arrival to the last quiet moment before dinner, live cello brings warmth, elegance, and a sense of occasion to your wedding day.
        </p>
      </div>
    </section>
  );
}
