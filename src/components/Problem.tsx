"use client";
/**
 * This section should make the practical case for live cello:
 * it sets the tone quickly, makes the event feel considered,
 * and avoids the generic feel that recorded or poorly planned music creates.
 */

import { useRef } from "react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { ClipboardList, ShieldCheck } from "lucide-react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";


type ProblemIcon = ComponentType<LucideProps>;

interface Problem {
  heading: string;
  line: string;
  icon: ProblemIcon;
}

/** A broad cello body, narrow neck and separate bow, legible at icon size. */
function CelloIcon({ className, strokeWidth = 1.5, ...props }: LucideProps) {
  return (
    <svg
      {...props}
      aria-hidden="true"
      className={cn(className, "h-[26px] w-[26px]")}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 7.5c-2.5-1-4 .6-3.4 2.4.3.8 1 1.5 1.8 2.1-.3 1-1.4 1.6-2.2 2.7C3.5 18.2 6.8 21 11 21s7.5-2.8 4.8-6.3c-.8-1.1-1.9-1.7-2.2-2.7.8-.6 1.5-1.3 1.8-2.1.6-1.8-.9-3.4-3.4-2.4V3.5h-2Z" />
      <path d="M10 3.5V2h2M11 8v10M9.5 15.5h3M11 21v2" />
      <path d="m20 3-2 18" />
    </svg>
  );
}

const problems: Problem[] = [
  {
    heading: "One less thing to plan",
    line: "You're already making a hundred decisions. Hand me the music and I'll handle the timing, the setlist, the soundcheck: all of it. You won't have to think about it on the day.",
    icon: ClipboardList,
  },
  {
    heading: "The cello effect",
    line: "It's the closest instrument to the human voice: it can whisper, it can roar, it can break your heart in four notes. It moves between classical, modern, and cinematic without missing a beat, and it gives the room something people genuinely remember.",
    icon: CelloIcon,
  },
  {
    heading: "I actually care",
    line: "A no-show or a late musician can sink the whole thing. Once your date is confirmed, it's my priority: no cancellations, no last-minute surprises. You can stop worrying about it.",
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

      gsap.fromTo(
        ".pivot-line",
        { scaleX: 0 },
        {
          scrollTrigger: {
            trigger: ".problem-pivot",
            start: "top 85%",
            once: true,
          },
          scaleX: 1,
          duration: 0.8,
          ease: "power2.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="why" ref={containerRef} surface="dark" className="text-on-dark">
      <SectionHeader
        label="Music, made easy"
        labelClassName="text-on-dark/70"
        headingClassName="text-on-dark"
        heading={
          <>
            Special events deserve{" "}
            <HandDrawnUnderline
              variant={2}
              underlineClassName="text-accent"
              textClassName="text-on-dark"
            >
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
                className="w-full gsap-reveal rounded-card bg-cream p-8 md:p-10 shadow-card"
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
          <p className="font-serif italic text-3xl md:text-4xl text-on-dark leading-snug">
            Got a date in mind?
          </p>
          <div>
            <Button href="/book" variant="white" size="md" className="font-display">
              Check my date
            </Button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
