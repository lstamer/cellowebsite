"use client";

import type { ReactNode } from "react";
import { useId, useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";


/** Distinct hand-drawn stroke shapes (normalized viewBox 0 0 100 12). */
const UNDERLINE_PATHS: Record<1 | 2 | 3, string> = {
  1: "M 1 7.5 C 14 4, 30 10.5, 48 6.5 S 78 4.5, 99 7.5",
  2: "M 0.5 8 C 18 11, 36 3.5, 54 8.5 S 82 4, 99.5 6.5",
  3: "M 0 7.5 Q 11 5, 22 8.5 Q 34 5.5, 46 7.5 Q 58 10, 70 6 Q 82 4.5, 94 8 Q 97 9, 100 7",
};

/**
 * Reveal clip geometry (user space, viewBox 0 0 100 12). Generous vertical
 * range so the clip never crops the displacement-filtered stroke; width
 * tweens 0 → CLIP_FULL_WIDTH for the left-to-right draw.
 */
const CLIP_X = -2;
const CLIP_Y = -20;
const CLIP_HEIGHT = 52;
const CLIP_FULL_WIDTH = 104;

export type HandDrawnUnderlineVariant = 1 | 2 | 3;

interface HandDrawnUnderlineProps {
  children: ReactNode;
  /** Pick a shape; use different values across sections for variety. */
  variant?: HandDrawnUnderlineVariant;
  className?: string;
  /** Stroke color for the underline (`currentColor`). Defaults to `text-foreground/40`. */
  underlineClassName?: string;
  /** Color of the emphasized words. Set to `text-on-dark` on dark surfaces. */
  textClassName?: string;
}

export function HandDrawnUnderline({
  children,
  variant = 1,
  className,
  underlineClassName,
  textClassName,
}: HandDrawnUnderlineProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const clipRectRef = useRef<SVGRectElement>(null);
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const filterId = `graphite-${safeId}`;
  const clipId = `reveal-${safeId}`;

  useGSAP(
    () => {
      const clipRect = clipRectRef.current;
      const root = rootRef.current;
      if (!clipRect || !root) return;

      // The filtered path renders once, fully drawn; the reveal only tweens
      // the clip rect so the turbulence/displacement filter is never
      // re-rastered per frame.
      gsap.set(clipRect, { attr: { width: 0 } });

      gsap.to(clipRect, {
        attr: { width: CLIP_FULL_WIDTH },
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
      <span className={cn("relative z-10", textClassName ?? "text-primary")}>
        {children}
      </span>
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
          <clipPath id={clipId}>
            <rect
              ref={clipRectRef}
              x={CLIP_X}
              y={CLIP_Y}
              width={0}
              height={CLIP_HEIGHT}
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <path
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
        </g>
      </svg>
    </span>
  );
}
