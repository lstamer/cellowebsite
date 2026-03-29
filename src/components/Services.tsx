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
  title: string;
  description: string;
  tagline: string;
  label: string;
  imageSrc: string;
  imageAlt: string;
}

const services: Service[] = [
  {
    title: "Weddings",
    label: "Ceremonies",
    description: "Elegance for your ceremony, cocktail hour, and reception.",
    tagline: "Your most beautiful moment, scored.",
    imageSrc: "/images/wedding.jpg",
    imageAlt: "Cello and floral details at a wedding celebration",
  },
  {
    title: "Private Events",
    label: "Gatherings",
    description:
      "Intimate, tailored live music for your guests and celebrations.",
    tagline: "Music that makes the room feel alive.",
    imageSrc: "/images/private_events.jpg",
    imageAlt: "Live cello music for an intimate private gathering",
  },
  {
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

      gsap.fromTo(
        ".service-card",
        { y: 40, opacity: 0 },
        {
          scrollTrigger: trigger,
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: { each: 0.15, from: "center" },
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
        label="Offerings"
        heading="Curated Soundscapes"
        alignment="left"
      />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {services.map((service, index) => (
          <div
            key={service.title}
            className={twMerge(
              clsx(
                "service-card group/card relative flex min-w-0 flex-col overflow-hidden rounded-card border border-primary/10 bg-background p-8 shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-primary/20 hover:shadow-card-hover",
                index === 1 && "lg:translate-y-8"
              )
            )}
          >
            <span className="mb-6 font-display text-xs font-bold uppercase tracking-widest text-foreground/50">
              {service.label}
            </span>

            <div className="relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-lg border border-primary/10">
              <Image
                src={service.imageSrc}
                alt={service.imageAlt}
                fill
                sizes="(max-width: 48rem) 100vw, 33vw"
                className="object-cover object-center grayscale-[15%] transition-transform duration-700 ease-out group-hover/card:scale-110"
              />
            </div>

            <h3 className="mb-3 font-display text-xl font-bold text-foreground md:text-2xl">
              {service.title}
            </h3>

            <p className="max-w-prose flex-grow font-sans leading-relaxed text-foreground/70">
              {service.description}
            </p>

            <p className="mt-6 font-serif text-sm italic text-foreground/60">
              {service.tagline}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
