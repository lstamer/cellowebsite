"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoBgRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".hero-elem", {
        y: 40,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
        stagger: 0.08,
      });

      const media = gsap.matchMedia();
      media.add("(min-width: 768px)", () => {
        gsap.to(videoBgRef.current, {
          yPercent: -18,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });
      return () => media.revert();
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100dvh] w-full flex items-end pb-24 md:pb-32 px-section-x-sm md:px-section-x-md lg:px-section-x-lg overflow-clip"
    >
      <div ref={videoBgRef} className="absolute inset-x-0 top-0 h-[120%] w-full">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/images/hero-poster.jpg"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[70%_center] md:object-center"
          onCanPlay={(event) => {
            void event.currentTarget.play().catch(() => undefined);
          }}
        >
          <source src="/celloheaderdesktop.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-primary/80 to-primary/30 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-dark/90 to-transparent" />
      </div>

      <div className="relative z-10 max-w-3xl">
        <h1 className="flex flex-col gap-2 mb-6">
          <span className="hero-elem block text-on-dark font-jost font-bold uppercase tracking-widest text-sm md:text-base">
            Special moments
          </span>
          <span className="hero-elem block text-on-dark font-serif italic text-display leading-[0.85] pr-4">
            Live cello
          </span>
        </h1>

        <p className="hero-elem mb-8 max-w-2xl text-balance font-sans text-lg leading-relaxed text-on-dark/80 md:text-xl">
          From the first guest through the door to the last note before
          dinner: live cello for the moments people actually remember.
        </p>

        <div className="hero-elem flex flex-wrap gap-4">
          <Button href="/book" variant="primary" size="lg">
            Check availability
          </Button>
          <Button
            href={buildWhatsAppHref({ source: "home-hero" })}
            variant="secondary"
            size="lg"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp me
          </Button>
        </div>
      </div>
    </section>
  );
}
