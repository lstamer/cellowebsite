"use client";

import { useRef } from "react";
import { Music, Sparkles, Building2 } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
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
  icon: React.ReactElement;
}

const services: Service[] = [
  {
    title: "Weddings",
    label: "Ceremonies",
    description: "Elegance for your ceremony, cocktail hour, and reception.",
    tagline: "Your most beautiful moment, scored.",
    icon: <Sparkles className="w-7 h-7" strokeWidth={1.5} />,
  },
  {
    title: "Private Events",
    label: "Gatherings",
    description:
      "Intimate, tailored live music for your guests and celebrations.",
    tagline: "Music that makes the room feel alive.",
    icon: <Music className="w-7 h-7" strokeWidth={1.5} />,
  },
  {
    title: "Corporate Functions",
    label: "Professional",
    description: "A refined and professional atmosphere for your brand.",
    tagline: "Distinction your guests will remember.",
    icon: <Building2 className="w-7 h-7" strokeWidth={1.5} />,
  },
];

export function Services() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".service-card",
        { y: 40, opacity: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.15,
          ease: "power3.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="services" ref={containerRef}>
      <SectionHeader
        label="Offerings"
        heading="Curated Soundscapes"
        alignment="left"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div
            key={index}
            className="service-card group relative min-w-0 bg-background border border-primary/10 rounded-card p-8 shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-card-hover hover:border-accent/30 overflow-hidden flex flex-col"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-primary/30 transition-colors duration-500 group-hover:bg-accent" />

            <span className="font-mono text-[0.6875rem] tracking-widest uppercase text-primary/50 mb-6">
              {service.label}
            </span>

            <div className="text-accent mb-6 transition-transform duration-500 origin-left group-hover:scale-110">
              {service.icon}
            </div>

            <h3 className="font-display font-bold text-xl md:text-2xl mb-3 text-foreground">
              {service.title}
            </h3>

            <p className="font-sans text-foreground/70 leading-relaxed flex-grow">
              {service.description}
            </p>

            <p className="font-serif italic text-foreground/40 text-sm mt-6">
              {service.tagline}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
