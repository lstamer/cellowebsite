"use client";

import Image from "next/image";
import { useId, useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";


const steps = [
  {
    title: "Tell me about it",
    desc: "Check I'm free for your date and tell me a bit about the event. I'll come back to you quickly — no forms-and-silence routine.",
    icon: "/images/process/icon2fr.png",
    alt: "Hand-drawn calendar icon",
  },
  {
    title: "We plan the music",
    desc: "We'll talk through what you want, the songs that matter, and the moments that need to land. I'll build the setlist around them.",
    icon: "/images/process/icon1fr.png",
    alt: "Hand-drawn conversation icon",
  },
  {
    title: "You enjoy your day",
    desc: "On the day, you don't lift a finger. I handle the music and the timing — you get to actually be there for it.",
    icon: "/images/process/icon3fr.png",
    alt: "Hand-drawn music icon",
  },
];

/** Imperfect oval around emphasis words (viewBox 0 0 110 44). */
const BEAUTIFUL_HIGHLIGHT_PATH =
  "M 8.5 24.2 C 12.5 7.8, 38.5 3.6, 57.5 5.2 C 81 7, 102.5 13.8, 104.8 22.6 C 106.5 31.2, 90.5 38.4, 54 39.2 C 19.5 40, 5.8 33.2, 8.5 24.2";

export function Solution() {
  const containerRef = useRef<HTMLElement>(null);
  const highlightWrapRef = useRef<HTMLSpanElement>(null);
  const highlightPathRef = useRef<SVGPathElement>(null);
  const highlightFilterId = useId().replace(/:/g, "");

  useGSAP(
    () => {
      const path = highlightPathRef.current;
      const wrap = highlightWrapRef.current;
      if (!path || !wrap) return;

      const len = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: len,
        strokeDashoffset: len,
        opacity: 1,
      });

      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 1.35,
        ease: "power3.out",
        scrollTrigger: {
          trigger: wrap,
          start: "top 82%",
          once: true,
        },
      });
    },
    { scope: highlightWrapRef }
  );

  useGSAP(
    () => {
      const animateBlocks = (selector: string) => {
        gsap.fromTo(
          selector,
          { y: 30, opacity: 0 },
          {
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 70%",
              once: true,
            },
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.14,
            ease: "power3.out",
          }
        );
      };

      const media = gsap.matchMedia();

      media.add("(min-width: 768px)", () => animateBlocks(".solution-desktop-block"));
      media.add("(max-width: 767px)", () => animateBlocks(".solution-mobile-block"));

      return () => media.revert();
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper ref={containerRef} className="relative" id="process" maxWidth="max-w-none">
      <SectionHeader
        label="How it works"
        heading={
          <>
            Let&apos;s make something{" "}
            <span ref={highlightWrapRef} className="relative inline-block px-[0.2em]">
              beautiful
              <svg
                aria-hidden
                className="pointer-events-none absolute inset-[-0.28em_-0.32em] h-[calc(100%+0.56em)] w-[calc(100%+0.64em)] text-accent"
                viewBox="0 0 110 44"
                preserveAspectRatio="none"
              >
                <defs>
                  <filter
                    id={highlightFilterId}
                    x="-20%"
                    y="-30%"
                    width="140%"
                    height="160%"
                    colorInterpolationFilters="sRGB"
                  >
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.9 0.06"
                      numOctaves="2"
                      seed="23"
                      result="grain"
                    />
                    <feDisplacementMap
                      in="SourceGraphic"
                      in2="grain"
                      scale="0.45"
                      xChannelSelector="R"
                      yChannelSelector="G"
                    />
                  </filter>
                </defs>
                <path
                  ref={highlightPathRef}
                  d={BEAUTIFUL_HIGHLIGHT_PATH}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="nonScalingStroke"
                  filter={`url(#${highlightFilterId})`}
                />
              </svg>
            </span>
            .
          </>
        }
      />

      <div className="mx-auto max-w-6xl">
        <div className="relative mb-14 hidden grid-cols-3 items-center md:grid">
          <svg
            aria-hidden
            className="pointer-events-none absolute left-[25%] top-1/2 z-0 h-[3.5rem] w-[18%] -translate-y-1/2 text-accent"
            viewBox="0 0 120 24"
            preserveAspectRatio="none"
          >
            <path
              d="M 2 13 C 21 8, 42 15, 60 12 C 78 9, 97 15, 118 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            aria-hidden
            className="pointer-events-none absolute left-[57%] top-1/2 z-0 h-[3.5rem] w-[18%] -translate-y-1/2 text-accent"
            viewBox="0 0 120 24"
            preserveAspectRatio="none"
          >
            <path
              d="M 2 12 C 20 16, 40 9, 60 12 C 80 15, 99 8, 118 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {steps.map((step) => (
            <div key={step.title} className="solution-desktop-block gsap-reveal relative z-10 flex justify-center">
              <Image
                src={step.icon}
                alt={step.alt}
                width={640}
                height={640}
                className="h-auto w-[12.375rem] lg:w-[14.125rem]"
                sizes="(min-width: 1024px) 226px, 198px"
              />
            </div>
          ))}
        </div>

        <div className="hidden grid-cols-3 md:grid">
          {steps.map((step) => (
            <article
              key={step.title}
              className="solution-desktop-block gsap-reveal border-primary/10 px-8 text-center md:border-l md:first:border-l-0 lg:px-12"
            >
              <h3
                className={cn(
                  featureItemTitleClass,
                  "mx-auto mb-6 max-w-[13rem] text-primary text-balance"
                )}
              >
                {step.title}
              </h3>
              <p className={cn(featureItemBodyClass, "mx-auto max-w-[15rem]")}>
                {step.desc}
              </p>
            </article>
          ))}
        </div>

        <div className="relative mx-auto max-w-xl space-y-10 md:hidden">
          <svg
            aria-hidden
            className="pointer-events-none absolute bottom-[4rem] left-[3.5rem] top-[4rem] z-0 w-[1.5rem] text-accent"
            viewBox="0 0 24 320"
            preserveAspectRatio="none"
          >
            <path
              d="M 12 4 C 10 48, 15 92, 12 136 C 9 178, 15 218, 12 260 C 10 286, 14 304, 12 316"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {steps.map((step) => (
            <article
              key={step.title}
              className="solution-mobile-block gsap-reveal relative z-10 grid grid-cols-[8rem_1fr] items-start gap-4"
            >
              <Image
                src={step.icon}
                alt={step.alt}
                width={640}
                height={640}
                className="h-auto w-full"
                sizes="128px"
              />
              <div>
                <h3 className={cn(featureItemTitleClass, "mb-3 text-primary text-balance")}>
                  {step.title}
                </h3>
                <p className={featureItemBodyClass}>
                  {step.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
