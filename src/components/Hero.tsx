"use client";

import { useRef } from "react";
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
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
        >
          <source src="/celloheaderdesktop.mp4" type="video/mp4" />
        </video>
        {/* Heavy Primary -> Black Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-primary/80 to-primary/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/90 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl">
        <h1 className="flex flex-col gap-2 mb-6">
          <span className="hero-elem block text-background font-display font-bold text-2xl md:text-3xl lg:text-4xl tracking-tight uppercase">
            Special moments
            
          </span>
          <span className="hero-elem block text-background font-serif italic text-display leading-[0.85] pr-4">
           Live cello
          </span>
        </h1>

        <p className="hero-elem mb-8 max-w-2xl text-balance font-sans text-lg leading-relaxed text-background/80 md:text-xl">
          Elevate your celebration with live cello music that brings warmth,
          elegance, and calm confidence to the room from the first arrival to
          the final toast.
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
