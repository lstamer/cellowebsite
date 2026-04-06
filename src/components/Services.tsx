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

      gsap.fromTo(
        ".services-after-cards",
        { y: 24, opacity: 0 },
        {
          scrollTrigger: trigger,
          y: 0,
          opacity: 1,
          duration: 0.85,
          delay: 0.2,
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

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {services.map((service, index) => (
          <div
            key={service.title}
            id={service.id}
            className={twMerge(
              clsx(
                "service-card group/card relative flex min-h-[28rem] min-w-0 flex-col justify-end overflow-hidden rounded-card border border-primary/10 bg-background p-8 shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-primary/20 hover:shadow-card-hover",
                index === 1 && "lg:translate-y-8"
              )
            )}
          >
            <div className="absolute inset-0 z-0">
              <Image
                src={service.imageSrc}
                alt={service.imageAlt}
                fill
                sizes="(max-width: 48rem) 100vw, 33vw"
                className="object-cover object-center grayscale-[15%] transition-transform duration-700 ease-out group-hover/card:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500 group-hover/card:opacity-80" />
            </div>

            <div className="relative z-10 flex flex-col">
              <span className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-white/70">
                {service.label}
              </span>

              <h3 className="mb-3 font-display text-2xl font-bold text-white md:text-3xl">
                {service.title}
              </h3>

              <p className="max-w-prose font-sans leading-relaxed text-white/90">
                {service.description}
              </p>

              <p className="mt-6 font-serif text-sm italic text-white/70">
                {service.tagline}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="services-after-cards mx-auto mt-12 max-w-2xl text-center md:mt-16">
        <p className="font-sans text-base leading-relaxed text-foreground/70 md:text-lg">
          Not sure which option fits your event? I can help you choose—or combine
          approaches so the music feels exactly right for your guests and your
          moment.
        </p>
      </div>
    </SectionWrapper>
  );
}
