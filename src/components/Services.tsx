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

const services = [
  {
    title: "Weddings",
    description: "Elegance for your ceremony, cocktail hour, and reception.",
    icon: <Sparkles className="w-8 h-8" strokeWidth={1.5} />,
  },
  {
    title: "Private Events",
    description: "Intimate, tailored live music for your guests and celebrations.",
    icon: <Music className="w-8 h-8" strokeWidth={1.5} />,
  },
  {
    title: "Corporate Functions",
    description: "A refined and professional atmosphere for your brand.",
    icon: <Building2 className="w-8 h-8" strokeWidth={1.5} />,
  },
];

export function Services() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".service-card", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power2.out",
      });
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="services" ref={containerRef}>
      <SectionHeader label="Offerings" heading="Curated Soundscapes" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div
            key={index}
            className="service-card group relative bg-background border border-primary/10 rounded-card p-10 shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-card-hover hover:border-accent/30 overflow-hidden flex flex-col"
          >
            {/* Hover Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            
            <div className="text-accent mb-8 transform group-hover:scale-110 transition-transform duration-500 origin-left">
              {service.icon}
            </div>
            
            <h3 className="font-display font-bold text-2xl mb-4 text-foreground relative z-10">
              {service.title}
            </h3>
            
            <p className="font-sans text-foreground/70 leading-relaxed relative z-10 flex-grow">
              {service.description}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
