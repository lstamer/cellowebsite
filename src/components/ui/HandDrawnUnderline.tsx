"use client";

import type { ReactNode } from "react";
import { useId, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Distinct hand-drawn stroke shapes (normalized viewBox 0 0 100 12). */
const UNDERLINE_PATHS: Record<1 | 2 | 3, string> = {
  1: "M 1 7.5 C 14 4, 30 10.5, 48 6.5 S 78 4.5, 99 7.5",
  2: "M 0.5 8 C 18 11, 36 3.5, 54 8.5 S 82 4, 99.5 6.5",
  3: "M 0 7.5 Q 11 5, 22 8.5 Q 34 5.5, 46 7.5 Q 58 10, 70 6 Q 82 4.5, 94 8 Q 97 9, 100 7",
};

export type HandDrawnUnderlineVariant = 1 | 2 | 3;

interface HandDrawnUnderlineProps {
  children: ReactNode;
  /** Pick a shape; use different values across sections for variety. */
  variant?: HandDrawnUnderlineVariant;
  className?: string;
  /** Stroke color for the underline (`currentColor`). Defaults to `text-foreground/40`. */
  underlineClassName?: string;
}

export function HandDrawnUnderline({
  children,
  variant = 1,
  className,
  underlineClassName,
}: HandDrawnUnderlineProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const reactId = useId();
  const filterId = `graphite-${reactId.replace(/:/g, "")}`;

  useGSAP(
    () => {
      const path = pathRef.current;
      const root = rootRef.current;
      if (!path || !root) return;

      const len = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: len,
        strokeDashoffset: len,
        opacity: 1,
      });

      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 1.25,
        ease: "power3.out",
        scrollTrigger: {
          trigger: root,
          start: "top 82%",
          once: true,
        },
      });
    },
    { scope: rootRef, dependencies: [variant] }
  );

  const d = UNDERLINE_PATHS[variant];

  return (
    <span ref={rootRef} className={cn("relative inline-block", className)}>
      <span className="relative z-10 text-primary">{children}</span>
      <svg
        className={cn(
          "pointer-events-none absolute -bottom-[0.1em] left-[-0.06em] right-[-0.06em] h-[0.3em] w-[calc(100%+0.12em)] overflow-visible",
          underlineClassName ?? "text-foreground/40"
        )}
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <filter
            id={filterId}
            x="-30%"
            y="-100%"
            width="160%"
            height="300%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85 0.05"
              numOctaves="2"
              seed="17"
              result="grain"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="grain"
              scale="0.55"
              xChannelSelector="R"
              yChannelSelector="G"
              result="roughened"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.12 0.9"
              numOctaves="3"
              seed="3"
              result="fineGrain"
            />
            <feDisplacementMap
              in="roughened"
              in2="fineGrain"
              scale="0.28"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <path
          ref={pathRef}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="nonScalingStroke"
          filter={`url(#${filterId})`}
          shapeRendering="geometricPrecision"
        />
      </svg>
    </span>
  );
}
