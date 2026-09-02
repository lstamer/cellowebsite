"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import riderContent from "@/content/corporate-functions-tech-rider.json";

export function CorporateFunctionsTechRider() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".corp-rider-intro",
        { y: 36, autoAlpha: 0 },
        {
          scrollTrigger: { trigger: containerRef.current, start: "top 75%", once: true },
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div className="bg-[linear-gradient(to_bottom,var(--color-background)_0%,var(--color-background)_22%,var(--color-cream)_100%)]">
      <SectionWrapper
        id="tech-rider"
        ref={containerRef}
        maxWidth="max-w-none"
        className="w-[calc(100%-2rem)] rounded-card bg-surface-dark text-on-dark sm:w-[calc(100%-3rem)] xl:w-[min(100%-4rem,96rem)]"
      >
        <div className="corp-rider-intro gsap-reveal grid gap-8 lg:grid-cols-[0.86fr_1fr] lg:items-start">
          <SectionHeader
            label={riderContent.sectionLabel}
            heading={riderContent.heading}
            alignment="left"
            className="!mb-0"
            labelClassName="border-accent text-on-dark/70"
            headingClassName="text-on-dark"
          />
          <div className="max-w-2xl lg:justify-self-end">
            <p className="font-sans text-lg leading-relaxed text-on-dark/70 text-pretty md:text-xl">
              {riderContent.intro}
            </p>
            <Button
              href={riderContent.downloadHref}
              download
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              size="md"
              className="mt-6 w-full sm:w-auto"
            >
              {riderContent.downloadLabel}
            </Button>
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}
