"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";


interface WeddingPackage {
  name: string;
  slug: string;
  tier: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const packages: WeddingPackage[] = [
  {
    name: "Essential",
    slug: "essential",
    tier: "The ceremony",
    description: "Just the ceremony — live cello for the few minutes everyone remembers most.",
    features: [
      "Guest arrival (30 mins)",
      "Processional & Recessional",
      "Signing of the register",
      "Your own song requests",
    ],
  },
  {
    name: "All-Rounder",
    slug: "all-rounder",
    tier: "Ceremony + drinks",
    popular: true,
    description: "The whole daytime feel — your ceremony, then straight through the drinks reception.",
    features: [
      "Everything in Essential",
      "Drinks reception (up to 2 hrs)",
      "Timed so the ceremony flows into drinks",
      "A wider mix to play with",
    ],
  },
  {
    name: "Full Experience",
    slug: "full-experience",
    tier: "The whole day",
    description: "Cello running through the whole day — from the first arrival to the final toast.",
    features: [
      "Everything in All-Rounder",
      "Music through the wedding breakfast",
      "A repertoire built around your day",
      "First call on my planning time",
    ],
  },
];

export function WeddingPricing() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".pricing-card",
        { y: 48, autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: ".pricing-grid",
            start: "top 80%",
            once: true,
          },
          y: 0,
          autoAlpha: 1,
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
          label="Packages"
          heading="Three simple starting points"
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
                  "pricing-card gsap-reveal flex h-full flex-col rounded-card border border-primary/10 bg-background px-9 py-10 text-foreground shadow-card transition-[border-color] duration-300 hover:border-primary/20",
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
              <p className="mb-4 font-serif text-[1.5rem] italic leading-none text-foreground">{pkg.tier}</p>
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
                  href={`/book?type=wedding&package=${pkg.slug}`}
                  variant={pkg.popular ? "primary" : "white"}
                  size="sm"
                  className={twMerge(
                    "w-full justify-center py-[0.8125em] text-sm",
                    pkg.popular ? "font-bold" : "font-semibold"
                  )}
                >
                  Check my date
                </Button>
              </div>
            </article>
          ))}
        </div>

        <p className="mx-auto max-w-xl text-center font-sans text-sm leading-relaxed text-on-dark/80 md:max-w-2xl">
          Pick one as a starting point — every wedding is quoted to fit, once we
          know the shape of your day. Tell me what you&apos;re imagining and
          I&apos;ll send a price that matches it.
        </p>
      </div>
    </SectionWrapper>
  );
}
