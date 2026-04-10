"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Service {
  id: string;
  title: string;
  description: string;
  tagline: string;
  label: string;
  imageSrc: string;
  imageAlt: string;
}

const services: Service[] = [
  {
    id: "weddings",
    title: "Weddings",
    label: "Ceremonies",
    description: "Elegance for your ceremony, cocktail hour, and reception.",
    tagline: "Your most beautiful moment, scored.",
    imageSrc: "/images/wedding.jpg",
    imageAlt: "Cello and floral details at a wedding celebration",
  },
  {
    id: "private-events",
    title: "Private Events",
    label: "Gatherings",
    description:
      "Intimate, tailored live music for your guests and celebrations.",
    tagline: "Music that makes the room feel alive.",
    imageSrc: "/images/private_events.jpg",
    imageAlt: "Live cello music for an intimate private gathering",
  },
  {
    id: "corporate-events",
    title: "Corporate Functions",
    label: "Professional",
    description: "A refined and professional atmosphere for your brand.",
    tagline: "Distinction your guests will remember.",
    imageSrc: "/images/corproatefnuctino.jpg",
    imageAlt: "Professional venue suited to corporate events and brand experiences",
  },
];

export function Services() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const trigger = {
        trigger: containerRef.current,
        start: "top 80%",
      };

      gsap.fromTo(
        ".services-intro",
        { y: 32, opacity: 0 },
        {
          scrollTrigger: trigger,
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
        }
      );

      // Staggered entry for the asymmetric rows
      gsap.utils.toArray(".service-row").forEach((row: any) => {
        gsap.fromTo(
          row,
          { y: 60, opacity: 0 },
          {
            scrollTrigger: {
              trigger: row,
              start: "top 85%",
            },
            y: 0,
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
          }
        );
      });

      gsap.fromTo(
        ".services-after-cards",
        { y: 24, opacity: 0 },
        {
          scrollTrigger: {
            trigger: ".services-after-cards",
            start: "top 90%",
          },
          y: 0,
          opacity: 1,
          duration: 0.85,
          ease: "power3.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="services" ref={containerRef}>
      <SectionHeader
        className="services-intro"
        label="Services"
        heading="Planning something big?"
        alignment="left"
      />

      {/* 2-Column Zig-Zag Editorial Layout */}
      <div className="flex flex-col gap-24 md:gap-32 mt-16 md:mt-24">
        {services.map((service, index) => {
          const isEven = index % 2 === 0;
          return (
            <div
              key={service.title}
              id={service.id}
              className={twMerge(
                clsx(
                  "service-row group relative flex flex-col md:flex-row items-center gap-10 md:gap-20 lg:gap-28",
                  !isEven && "md:flex-row-reverse",
                  service.id === "weddings" && "cursor-pointer"
                )
              )}
              onClick={() => {
                if (service.id === "weddings") {
                  window.location.href = "/services/weddings";
                }
              }}
            >
              {/* Image Column */}
              <div className="w-full md:w-3/5 relative">
                {/* Offset decoration to break symmetry */}
                <div className={clsx(
                  "absolute inset-0 bg-primary/5 -z-10 transition-transform duration-700 ease-out group-hover:scale-105",
                  isEven ? "translate-x-4 translate-y-4" : "-translate-x-4 translate-y-4"
                )} />
                <div className="aspect-[4/5] md:aspect-[3/4] relative overflow-hidden shadow-2xl">
                  <Image
                    src={service.imageSrc}
                    alt={service.imageAlt}
                    fill
                    sizes="(max-width: 48rem) 100vw, 60vw"
                    className="object-cover object-center grayscale-[15%] transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  {/* Noise overlay for texture */}
                  <div 
                    className="absolute inset-0 mix-blend-overlay opacity-30 pointer-events-none" 
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
                  />
                </div>
              </div>

              {/* Text Column */}
              <div className={clsx(
                "w-full md:w-2/5 flex flex-col justify-center",
                isEven ? "md:pr-8" : "md:pl-8"
              )}>
                <span className="mb-5 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary/60">
                  {service.label}
                </span>

                <h3 className="mb-6 font-serif italic text-4xl md:text-5xl lg:text-6xl text-foreground transition-colors duration-500 group-hover:text-primary">
                  {service.title}
                </h3>

                <p className="mb-8 max-w-md font-sans text-lg leading-relaxed text-foreground/75">
                  {service.description}
                </p>

                <p className="font-mono text-sm tracking-wider uppercase text-primary border-l-2 border-accent pl-4 py-1">
                  {service.tagline}
                </p>
                
                {service.id === "weddings" && (
                  <div className="mt-10 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-accent group-hover:text-primary transition-colors">
                    <span>View details</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="services-after-cards mx-auto mt-24 md:mt-32 max-w-2xl text-center">
        <p className="font-serif italic text-2xl md:text-3xl leading-snug text-foreground text-balance">
          Not sure which option fits your event? I can help you choose—or combine
          approaches so the music feels exactly right for your guests and your
          moment.
        </p>
      </div>
    </SectionWrapper>
  );
}
