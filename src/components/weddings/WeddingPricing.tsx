"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const packages = [
  {
    name: "Essential",
    price: "R4,500",
    description: "Perfect for the ceremony. Live music for the most emotional moments of the day.",
    features: [
      "Guest arrival (30 mins)",
      "Processional & Recessional",
      "Signing of the register",
      "Bespoke song requests",
    ],
  },
  {
    name: "All-Rounder",
    price: "R7,000",
    popular: true,
    description: "The complete daytime atmosphere. Covers your ceremony and the drinks reception.",
    features: [
      "Everything in Essential",
      "Cocktail hour performance (up to 2 hours)",
      "Seamless transitions",
      "Wider repertoire mix",
    ],
  },
  {
    name: "Full Experience",
    price: "R10,000",
    description: "Music woven throughout the day. From the first arrival to the final toast.",
    features: [
      "Everything in All-Rounder",
      "Wedding breakfast background music",
      "Extended repertoire curation",
      "Priority planning support",
    ],
  },
];

export function WeddingPricing() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".pricing-cta",
        {
          y: 20,
          opacity: 0,
        },
        {
          scrollTrigger: {
            trigger: ".pricing-cta",
            start: "top 85%",
            once: true,
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );

      gsap.fromTo(
        ".pricing-card",
        {
          y: 40,
          opacity: 0,
        },
        {
          scrollTrigger: {
            trigger: ".pricing-grid",
            start: "top 80%",
            once: true,
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="pricing" ref={containerRef} className="bg-background py-24 md:py-32">
      {/* Immediate Check Availability CTA */}
      <div className="pricing-cta text-center mb-24 max-w-2xl mx-auto">
        <p className="font-serif italic text-3xl md:text-4xl text-foreground mb-6 text-balance">
          Ready to talk about the music for your day?
        </p>
        <Button href="/book" variant="primary" size="lg">
          Check availability
        </Button>
      </div>

      <SectionHeader
        label="Investment"
        heading="Simple options, tailored to your day"
      />

      <div className="pricing-grid grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mt-16">
        {packages.map((pkg, idx) => (
          <div
            key={idx}
            className={twMerge(
              clsx(
                "pricing-card relative flex flex-col bg-background border rounded-card p-8 md:p-10 transition-[box-shadow,border-color] duration-300 hover:shadow-card-hover",
                pkg.popular
                  ? "border-primary shadow-card"
                  : "border-primary/10 shadow-sm hover:border-primary/20"
              )
            )}
          >
            {pkg.popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-background font-display text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                Most Chosen
              </span>
            )}
            
            <div className="mb-8">
              <h3 className="font-display font-bold text-2xl text-foreground mb-2">
                {pkg.name}
              </h3>
              <p className="font-serif italic text-3xl text-primary mb-4">
                {pkg.price}
              </p>
              <p className="font-sans text-sm text-foreground/70 leading-relaxed">
                {pkg.description}
              </p>
            </div>

            <div className="flex-1">
              <ul className="space-y-4">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent shrink-0" />
                    <span className="font-sans text-sm text-foreground/80">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10">
              <Button 
                href={`/book?package=${pkg.name.toLowerCase()}`} 
                variant={pkg.popular ? "primary" : "white"} 
                size="md" 
                className="w-full"
              >
                Select this package
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-12">
        <p className="font-sans text-sm text-foreground/60 max-w-xl mx-auto">
          Most couples choose a package as a starting point, then we personalise the exact details together. Custom quotes available for unique requirements.
        </p>
      </div>
    </SectionWrapper>
  );
}
