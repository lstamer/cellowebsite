"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function WeddingHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Staggered entrance for text elements
      gsap.from(".hero-elem", {
        y: 40,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.1,
      });

      // Subtle parallax on image while scrolling past hero
      if (imageRef.current) {
        gsap.to(imageRef.current, {
          y: -60,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="sticky top-0 z-[1] w-full min-h-[85dvh] bg-surface-dark overflow-clip"
    >
      {/* ─── MOBILE: Full-bleed image background ─── */}
      <div className="lg:hidden absolute inset-0 w-full min-h-[100lvh]">
        <Image
          src="/images/wedding.jpg"
          alt="Wedding cello performance"
          fill
          priority
          className="object-cover object-center grayscale-[15%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-primary/80 to-primary/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/90 to-transparent" />
      </div>

      {/* ─── DESKTOP: Split-screen grid ─── */}
      <div className="hidden lg:grid lg:grid-cols-12 w-full h-full min-h-[85dvh]">
        {/* Left — text panel */}
        <div className="lg:col-span-5 relative z-10 flex flex-col justify-end pb-24 pl-section-x-lg pr-12 bg-surface-dark">
          {/* Subtle grain texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />

          <div className="hero-elem">
            <p className="font-mono text-[0.65rem] tracking-[0.25em] uppercase text-accent/80 mb-6">
              Wedding Cellist
            </p>
          </div>

          <h1 className="flex flex-col gap-3 mb-8">
            <span className="hero-elem block text-background font-serif italic leading-[0.9] text-[clamp(3rem,5vw,4.5rem)] text-balance">
              Your guests will remember how it felt.
            </span>
          </h1>

          <p className="hero-elem font-sans text-lg leading-relaxed text-background/70 max-w-sm mb-10 text-pretty">
            Not the flowers, not the table settings. The moment the music started and everything went quiet.
          </p>

          <div className="hero-elem">
            <Button href="/book" variant="primary" size="lg">
              Check your date
            </Button>
          </div>
        </div>

        {/* Right — image panel */}
        <div className="lg:col-span-7 relative overflow-hidden">
          <div ref={imageRef} className="absolute inset-0 w-full h-[120%] -top-[10%]">
            <Image
              src="/images/wedding.jpg"
              alt="Wedding cello performance"
              fill
              priority
              className="object-cover object-center grayscale-[15%]"
              sizes="60vw"
            />
            {/* Edge gradient to blend into left panel */}
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-surface-dark/20" />
          </div>
        </div>
      </div>

      {/* ─── MOBILE: Content over the background ─── */}
      <div className="lg:hidden relative z-10 flex flex-col justify-end min-h-[85dvh] pb-20 px-section-x-sm">
        <p className="hero-elem font-mono text-[0.65rem] tracking-[0.25em] uppercase text-accent/80 mb-5">
          Wedding Cellist
        </p>
        <h1 className="mb-7">
          <span className="hero-elem block text-background font-serif italic text-[clamp(2.8rem,10vw,4rem)] leading-[0.9] text-balance">
            Your guests will remember how it felt.
          </span>
        </h1>
        <p className="hero-elem font-sans text-lg leading-relaxed text-background/70 max-w-sm mb-9 text-pretty">
          Not the flowers, not the table settings. The moment the music started and everything went quiet.
        </p>
        <div className="hero-elem">
          <Button href="/book" variant="primary" size="lg">
            Check your date
          </Button>
        </div>
      </div>
    </div>
  );
}
