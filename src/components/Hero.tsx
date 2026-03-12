"use client";

import { useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

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
      className="relative h-[100dvh] w-full flex items-end pb-24 md:pb-32 px-section-x-sm md:px-section-x-md lg:px-section-x-lg overflow-hidden"
    >
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/heroImage.jpeg"
          alt="Live cello performance"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Heavy Primary -> Black Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-primary/80 to-primary/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/90 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl">
        <h1 className="flex flex-col gap-2 mb-6">
          <span className="hero-elem block text-background font-display font-bold text-2xl md:text-3xl lg:text-4xl tracking-tight uppercase">
            Music is the
          </span>
          <span className="hero-elem block text-background font-serif italic text-display leading-[0.85] pr-4">
            Memory.
          </span>
        </h1>
        
        <p className="hero-elem text-background/90 font-sans text-lg md:text-xl max-w-xl mb-10 text-balance leading-relaxed">
          Elevate your celebration. Feel confident the atmosphere is perfectly set for a truly unforgettable event.
        </p>
        
        <div className="hero-elem flex flex-wrap gap-4">
          <Button href="#contact" variant="primary" size="lg">
            Book a call
          </Button>
        </div>
      </div>
    </section>
  );
}
