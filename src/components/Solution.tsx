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

/**
 * Reveal clip geometry (user space, viewBox 0 0 110 44). Generous margins so
 * the clip never crops the displacement-filtered stroke; width tweens
 * 0 → HIGHLIGHT_CLIP_FULL_WIDTH for the left-to-right reveal.
 */
const HIGHLIGHT_CLIP_X = -6;
const HIGHLIGHT_CLIP_Y = -10;
const HIGHLIGHT_CLIP_HEIGHT = 64;
const HIGHLIGHT_CLIP_FULL_WIDTH = 122;

export function Solution() {
  const containerRef = useRef<HTMLElement>(null);
  const highlightWrapRef = useRef<HTMLSpanElement>(null);
  const highlightClipRectRef = useRef<SVGRectElement>(null);
  const connectorPathRef = useRef<SVGPathElement>(null);
  const highlightSafeId = useId().replace(/:/g, "");
  const highlightFilterId = `highlight-${highlightSafeId}`;
  const highlightClipId = `highlight-reveal-${highlightSafeId}`;

  useGSAP(
    () => {
      const clipRect = highlightClipRectRef.current;
      const wrap = highlightWrapRef.current;
      if (!clipRect || !wrap) return;

      // The filtered path renders once, fully drawn; the reveal only tweens
      // the clip rect so the turbulence/displacement filter is never
      // re-rastered per frame.
      gsap.set(clipRect, { attr: { width: 0 } });

      gsap.to(clipRect, {
        attr: { width: HIGHLIGHT_CLIP_FULL_WIDTH },
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
      gsap.fromTo(
        ".solution-step",
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

      const connector = connectorPathRef.current;
      if (connector) {
        const len = connector.getTotalLength();
        gsap.set(connector, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(connector, {
          strokeDashoffset: 0,
          duration: 1.8,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 65%",
            once: true,
          },
        });
      }
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
                  <clipPath id={highlightClipId}>
                    <rect
                      ref={highlightClipRectRef}
                      x={HIGHLIGHT_CLIP_X}
                      y={HIGHLIGHT_CLIP_Y}
                      width={0}
                      height={HIGHLIGHT_CLIP_HEIGHT}
                    />
                  </clipPath>
                </defs>
                <g clipPath={`url(#${highlightClipId})`}>
                  <path
                    d={BEAUTIFUL_HIGHLIGHT_PATH}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="nonScalingStroke"
                    filter={`url(#${highlightFilterId})`}
                  />
                </g>
              </svg>
            </span>
            .
          </>
        }
      />

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_minmax(0,24rem)] lg:gap-20 xl:grid-cols-[1fr_minmax(0,26rem)]">
        <div className="relative mx-auto w-full max-w-xl space-y-10 lg:mx-0 lg:max-w-none lg:space-y-14">
          <svg
            aria-hidden
            className="pointer-events-none absolute left-[3.5rem] top-[4rem] z-0 h-[calc(100%-8rem)] w-[1.5rem] text-accent lg:left-[4.25rem] lg:top-[4.75rem] lg:h-[calc(100%-9.5rem)]"
            viewBox="0 0 24 320"
            preserveAspectRatio="none"
          >
            <path
              ref={connectorPathRef}
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
              className="solution-step gsap-reveal relative z-10 grid grid-cols-[8rem_1fr] items-center gap-4 lg:grid-cols-[9.5rem_1fr] lg:gap-8"
            >
              <Image
                src={step.icon}
                alt={step.alt}
                width={640}
                height={640}
                className="h-auto w-full"
                sizes="(min-width: 1024px) 152px, 128px"
              />
              <div>
                <h3 className={cn(featureItemTitleClass, "mb-3 text-primary text-balance")}>
                  {step.title}
                </h3>
                <p className={cn(featureItemBodyClass, "max-w-[26rem]")}>
                  {step.desc}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="solution-step gsap-reveal relative hidden lg:block">
          <Image
            src="/images/about-perf1.jpg"
            alt="Luke performing solo cello beneath a garden pavilion as wedding guests look on"
            width={1086}
            height={1448}
            className="h-auto w-full rounded-none object-cover grayscale-[15%]"
            sizes="(min-width: 1280px) 416px, (min-width: 1024px) 384px, 100vw"
          />
        </div>
      </div>
    </SectionWrapper>
  );
}
