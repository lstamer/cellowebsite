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

interface WeddingPackage {
  name: string;
  slug: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const packages: WeddingPackage[] = [
  {
    name: "Essential",
    slug: "essential",
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
    slug: "all-rounder",
    price: "R7,000",
    popular: true,
    description: "The complete daytime atmosphere. Covers your ceremony and the drinks reception.",
    features: [
      "Everything in Essential",
      "Cocktail hour performance (up to 2 hrs)",
      "Timing planned so ceremony flows into cocktails",
      "Wider repertoire mix",
    ],
  },
  {
    name: "Full Experience",
    slug: "full-experience",
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
        ".pricing-card",
        { y: 48, opacity: 0 },
        {
          scrollTrigger: {
            trigger: ".pricing-grid",
            start: "top 80%",
            once: true,
          },
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.14,
          ease: "power3.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper
      id="pricing"
      ref={containerRef}
      maxWidth="max-w-none"
      className="bg-accent"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-10 md:gap-11">
        <SectionHeader
          label="Pricing"
          heading="Simple options, tailored to your day"
          className="mx-auto mb-0 max-w-4xl"
          labelClassName="mb-4 border-on-dark pl-3 font-jakarta text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-on-dark/70"
          headingClassName="text-balance text-on-dark text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[3.5rem] lg:text-[3.75rem]"
        />

        <div className="pricing-grid grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
          {packages.map((pkg) => (
            <article
              key={pkg.slug}
              className={twMerge(
                clsx(
                  "pricing-card flex h-full flex-col rounded-2xl border border-primary/10 bg-background px-9 py-10 text-foreground shadow-card transition-[box-shadow,border-color] duration-300 hover:border-primary/20 hover:shadow-card-hover",
                  pkg.popular && "relative border-primary"
                )
              )}
            >
              {pkg.popular && (
                  <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-primary px-4 py-1.5 font-jakarta text-[0.625rem] font-bold uppercase tracking-[0.18em] text-on-dark">
                  Most Chosen
                </span>
              )}

              <h3 className="mb-4 font-jakarta text-xl font-bold tracking-tight text-primary">{pkg.name}</h3>
              <p className="mb-4 font-serif text-[2.625rem] italic leading-none text-foreground">{pkg.price}</p>
              <p className="mb-8 min-h-[3rem] font-sans text-sm leading-relaxed text-foreground/70">{pkg.description}</p>

              <div className="mb-7 h-px shrink-0 bg-primary/10" aria-hidden />

              <ul className="flex flex-1 flex-col gap-4">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                    <span className="font-sans text-sm leading-relaxed text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <Button
                  href={`/book?package=${pkg.slug}`}
                  variant={pkg.popular ? "primary" : "white"}
                  size="sm"
                  className={twMerge(
                    "w-full justify-center py-[0.8125em] text-sm",
                    pkg.popular ? "font-bold" : "font-semibold"
                  )}
                >
                  Select {pkg.name}
                </Button>
              </div>
            </article>
          ))}
        </div>

        <p className="mx-auto max-w-xl text-center font-sans text-sm leading-relaxed text-on-dark/85 md:max-w-2xl">
          Most couples choose a package as a starting point, then we personalise the exact details together. Custom
          quotes available for unique requirements.
        </p>
      </div>
    </SectionWrapper>
  );
}
