"use client";
/**
 * This section should make the practical case for live cello:
 * it sets the tone quickly, makes the event feel considered,
 * and avoids the generic feel that recorded or poorly planned music creates.
 */

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { ClipboardList, Waves, ShieldCheck } from "lucide-react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";


interface Problem {
  heading: string;
  line: string;
  icon: LucideIcon;
}

const problems: Problem[] = [
  {
    heading: "Plan without the pressure",
    line: "Organising event logistics can be a massive headache - leave the specifics to someone who knows the ins and outs already.",
    icon: ClipboardList,
  },
  {
    heading: "Set the atmosphere",
    line: "The cello sets the tone for the whole event — versatile enough to glide between classical, modern, and cinematic moods. It lifts the room, draws people in, and gives guests something they actually remember.",
    icon: Waves,
  },
  {
    heading: "Reliable availability",
    line: "If the musician cancels or is late, it can ruin the experience. Once a date is confirmed, it becomes my top priority. No cancellations or last minute surprises.",
    icon: ShieldCheck,
  },
];

export function Problem() {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const cards = cardsRef.current.filter(Boolean);
      if (cards.length) {
        gsap.fromTo(
          cards,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.14,
            ease: "power3.out",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 70%",
              once: true,
            },
          }
        );
      }

      gsap.fromTo(
        ".problem-pivot",
        { y: 20, opacity: 0 },
        {
          scrollTrigger: {
            trigger: ".problem-pivot",
            start: "top 80%",
            once: true,
          },
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
        }
      );

      gsap.from(".pivot-line", {
        scrollTrigger: {
          trigger: ".problem-pivot",
          start: "top 85%",
          once: true,
        },
        scaleX: 0,
        duration: 0.8,
        ease: "power2.out",
      });
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="why" ref={containerRef}>
      <SectionHeader
        label="Music, made easy"
        heading={
          <>
            Special events deserve{" "}
            <HandDrawnUnderline variant={2} underlineClassName="text-accent">
              special music
            </HandDrawnUnderline>
          </>
        }
      />

      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-6 md:gap-8">
          {problems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                ref={(el) => {
                  cardsRef.current[idx] = el;
                }}
                className="w-full gsap-reveal bg-white border border-primary/15 border-l-[3px] border-l-foreground rounded-card p-8 md:p-10 shadow-card"
              >
                <div className="mb-4 flex items-center gap-5">
                  <div
                    className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-none bg-foreground text-on-dark"
                    aria-hidden
                  >
                    <Icon className="h-[20px] w-[20px]" strokeWidth={1.75} />
                  </div>
                  <h3 className={featureItemTitleClass}>
                    {item.heading}
                  </h3>
                </div>
                <p className={cn(featureItemBodyClass, "max-w-2xl")}>
                  {item.line}
                </p>
              </div>
            );
          })}
        </div>

        {/* Pivot to CTA */}
        <div className="problem-pivot gsap-reveal pt-16 flex flex-col gap-6">
          <div className="pivot-line h-px w-16 bg-accent origin-left" />
          <p className="font-serif italic text-3xl md:text-4xl text-primary leading-snug">
            Have an event in mind?
          </p>
          <div>
            <Button href="/book" variant="primary" size="md" className="font-display">
              Check my availability
            </Button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
