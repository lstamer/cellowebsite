"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";


interface Service {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  href?: string;
}

const services: Service[] = [
  {
    id: "weddings",
    title: "Weddings",
    description: "Live cello for the walk down the aisle, the cocktail hour, and the bit where everyone finally relaxes.",
    imageSrc: "/images/wedding-vineyard-editorial.png",
    imageAlt: "Wedding bouquet and ivory dress in a Cape Winelands vineyard",
    href: "/services/weddings",
  },
  {
    id: "private-events",
    title: "Private Events",
    description:
      "Birthdays, anniversaries, a dinner that matters — music that fits your room, not a stranger's playlist.",
    imageSrc: "/images/private-events-editorial.png",
    imageAlt: "Candlelit dinner table set for an intimate private gathering",
    href: "/services/private-events",
  },
  {
    id: "corporate-events",
    title: "Corporate Functions",
    description: "Live cello that sets the tone for your brand — and runs without you having to think about it.",
    imageSrc: "/images/corporate-events-editorial.png",
    imageAlt: "Guests gathering in a grand venue for a corporate function",
    href: "/services/corporate-functions",
  },
];

export function Services() {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      gsap.fromTo(
        ".services-intro",
        { y: 32, opacity: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            once: true,
          },
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
        }
      );

      const cards = cardsRef.current.filter(Boolean);
      if (cards.length) {
        gsap.fromTo(
          cards,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.14,
            ease: "power3.out",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 70%",
              once: true,
            },
            onComplete: () => {
              gsap.set(cards, { clearProps: "transform" });
            },
          }
        );
      }
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="services" ref={containerRef}>
      <SectionHeader
        className="services-intro"
        label="What I play for"
        heading="Planning something big?"
        alignment="left"
      />

      {/* 3-column card layout — image bleeds into the top rounded corners */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:mt-16 md:grid-cols-3 md:gap-8">
        {services.map((service, index) => (
          <div
            key={service.title}
            id={service.id}
            ref={(el) => {
              cardsRef.current[index] = el;
            }}
            className={cn(
              "group flex flex-col overflow-hidden bg-background border border-primary/15 rounded-card shadow-card transition-[box-shadow,border-color,color] duration-300 hover:-translate-y-1",
              service.href && "cursor-pointer"
            )}
            onClick={() => {
              if (service.href) {
                window.location.href = service.href;
              }
            }}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src={service.imageSrc}
                alt={service.imageAlt}
                fill
                sizes="(max-width: 48rem) 100vw, 33vw"
                className="object-cover object-center grayscale-[15%] transition-transform duration-1000 ease-out group-hover:scale-105"
              />
            </div>

            <div className="flex flex-1 flex-col p-5 md:p-6">
              <h3
                className={cn(
                  featureItemTitleClass,
                  "transition-colors duration-500 group-hover:text-primary"
                )}
              >
                {service.title}
              </h3>

              <p className={cn(featureItemBodyClass, "mt-3")}>
                {service.description}
              </p>

              {service.href && (
                <div className="mt-auto pt-8">
                  <Button
                    href={service.href}
                    variant="primary"
                    size="sm"
                    className="font-jost uppercase tracking-widest text-xs font-bold"
                  >
                    View details
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
