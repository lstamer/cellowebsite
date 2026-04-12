"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Package {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const packages: Package[] = [
  {
    name: "Essential",
    price: "R4,500",
    description: "Live music for the most emotional moments of the ceremony.",
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
    description: "Ceremony and cocktail hour — the complete daytime atmosphere.",
    features: [
      "Everything in Essential",
      "Cocktail hour (up to 2 hours)",
      "Ceremony flows into cocktails",
      "Wider repertoire mix",
    ],
  },
  {
    name: "Full Experience",
    price: "R10,000",
    description: "Music woven throughout the day, from arrival to the final toast.",
    features: [
      "Everything in All-Rounder",
      "Wedding breakfast music",
      "Extended repertoire curation",
      "Priority planning support",
    ],
  },
];

export function WeddingPricing() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Center card enters first
      gsap.fromTo(
        ".pricing-center",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".pricing-grid",
            start: "top 80%",
            once: true,
          },
        }
      );

      // Side cards follow
      gsap.fromTo(
        ".pricing-side",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.15,
          delay: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".pricing-grid",
            start: "top 80%",
            once: true,
          },
        }
      );

      // CTA below pricing
      gsap.fromTo(
        ".pricing-cta",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".pricing-cta",
            start: "top 90%",
            once: true,
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="pricing" ref={containerRef} className="bg-background">
      <SectionHeader
        label="Investment"
        heading="Three options, one goal"
        alignment="left"
      />

      {/* Asymmetric 3-6-3 grid on desktop, stack on mobile */}
      <div className="pricing-grid mt-16 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-0 max-w-6xl mx-auto items-stretch">
        {packages.map((pkg, idx) => {
          const isFeatured = pkg.popular;
          const isLeft = idx === 0;
          const isRight = idx === 2;

          return (
            <div
              key={idx}
              className={cn(
                "flex flex-col",
                isFeatured
                  ? "pricing-center lg:col-span-6 lg:z-10"
                  : cn(
                      "pricing-side",
                      isLeft ? "lg:col-span-3" : "lg:col-span-3"
                    )
              )}
            >
              <div
                className={cn(
                  "flex flex-col flex-1 transition-shadow duration-300",
                  isFeatured
                    ? "bg-primary text-background rounded-card p-8 md:p-10 lg:p-12 shadow-2xl lg:-mx-0"
                    : cn(
                        "bg-background border border-primary/10 p-7 md:p-9 shadow-sm hover:shadow-card-hover hover:border-primary/20",
                        isLeft ? "lg:rounded-l-card lg:rounded-r-none lg:border-r-0" : "lg:rounded-r-card lg:rounded-l-none lg:border-l-0"
                      )
                )}
              >
                {isFeatured && (
                  <p className="font-mono text-[0.6rem] tracking-[0.25em] uppercase text-background/50 mb-6">
                    Most couples choose this
                  </p>
                )}

                <div className="mb-7">
                  <h3
                    className={cn(
                      "font-display font-bold text-2xl mb-1",
                      isFeatured ? "text-background" : "text-foreground"
                    )}
                  >
                    {pkg.name}
                  </h3>
                  <p
                    className={cn(
                      "font-serif italic text-3xl mb-4",
                      isFeatured ? "text-background/90" : "text-primary"
                    )}
                  >
                    {pkg.price}
                  </p>
                  <p
                    className={cn(
                      "font-sans text-sm leading-relaxed",
                      isFeatured ? "text-background/70" : "text-foreground/60"
                    )}
                  >
                    {pkg.description}
                  </p>
                </div>

                <ul className="flex-1 space-y-3.5 mb-9">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check
                        className={cn(
                          "w-4 h-4 shrink-0 mt-0.5",
                          isFeatured ? "text-accent" : "text-accent"
                        )}
                      />
                      <span
                        className={cn(
                          "font-sans text-sm",
                          isFeatured ? "text-background/80" : "text-foreground/70"
                        )}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  href={`/book?package=${pkg.name.toLowerCase().replace(" ", "-")}`}
                  variant={isFeatured ? "secondary" : "white"}
                  size="md"
                  className="w-full whitespace-nowrap"
                >
                  {isFeatured ? "Select this package" : "Select"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note + CTA */}
      <div className="pricing-cta text-center mt-14">
        <p className="font-sans text-sm text-foreground/50 max-w-md mx-auto mb-8">
          Not sure? Most couples start with the All-Rounder and adjust from there.
          Custom quotes available for unique requirements.
        </p>
        <Button href="/book" variant="primary" size="lg">
          Check your date
        </Button>
      </div>
    </SectionWrapper>
  );
}
