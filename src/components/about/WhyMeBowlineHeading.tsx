"use client";

import { useId, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-client";
import { cn } from "@/lib/utils";

const AUDIENCE_WORDS = ["couples", "brides", "event planners", "people"] as const;
const SIZER_WORD = AUDIENCE_WORDS.reduce<string>(
  (longest, word) => (word.length > longest.length ? word : longest),
  ""
);

const WORD_HOLD_SECONDS = 2.4;
const REVEAL_WIDTH = 104;

interface WhyMeBowlineHeadingProps {
  className?: string;
}

export function WhyMeBowlineHeading({ className }: WhyMeBowlineHeadingProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const bowClipRef = useRef<SVGRectElement>(null);
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const bowClipId = `bow-reveal-${safeId}`;

  useGSAP(
    () => {
      const root = rootRef.current;
      const bowClip = bowClipRef.current;
      if (!root || !bowClip) return;

      const wordNodes = gsap.utils.toArray<HTMLElement>("[data-audience-word]", root);
      const allCharacters = gsap.utils.toArray<HTMLElement>("[data-audience-character]", root);
      const allStrikeLines = gsap.utils.toArray<HTMLElement>(
        "[data-strikethrough-line]",
        root
      );
      const allStrikeWords = gsap.utils.toArray<HTMLElement>(
        "[data-strikethrough-word]",
        root
      );
      const media = gsap.matchMedia();

      const showFirstWord = () => {
        gsap.set(wordNodes, { autoAlpha: 0 });
        gsap.set(allCharacters, { autoAlpha: 1, y: 0 });
        gsap.set(allStrikeLines, { scaleX: 0 });
        gsap.set(allStrikeWords, { autoAlpha: 0 });
        gsap.set(wordNodes[0], { autoAlpha: 1 });
      };

      media.add("(prefers-reduced-motion: reduce)", () => {
        showFirstWord();
        gsap.set(bowClip, { attr: { width: REVEAL_WIDTH } });
      });

      media.add("(prefers-reduced-motion: no-preference)", () => {
        showFirstWord();
        gsap.set(bowClip, { attr: { width: 0 } });

        const bowTween = gsap.to(bowClip, {
          attr: { width: REVEAL_WIDTH },
          duration: 1.25,
          ease: "power3.out",
          scrollTrigger: {
            trigger: root,
            start: "top 78%",
            once: true,
          },
        });

        const wordTimeline = gsap.timeline({ repeat: -1, paused: true });

        wordNodes.forEach((currentWord, index) => {
          const nextWord = wordNodes[(index + 1) % wordNodes.length];
          const currentCharacters = gsap.utils.toArray<HTMLElement>(
            "[data-audience-character]",
            currentWord
          );
          const nextCharacters = gsap.utils.toArray<HTMLElement>(
            "[data-audience-character]",
            nextWord
          );
          const currentStrikeLine = root.querySelector<HTMLElement>(
            `[data-strikethrough-line="${index}"]`
          );
          const currentStrikeWord = root.querySelector<HTMLElement>(
            `[data-strikethrough-word="${index}"]`
          );
          if (!currentStrikeLine || !currentStrikeWord) return;

          wordTimeline
            .to({}, { duration: WORD_HOLD_SECONDS })
            .set(currentStrikeWord, { autoAlpha: 1 })
            .to(currentStrikeLine, {
              scaleX: 1,
              duration: 0.4,
              ease: "power3.out",
            })
            .to(currentCharacters, {
              autoAlpha: 0,
              y: "-0.08em",
              duration: 0.16,
              stagger: 0.012,
              ease: "power2.in",
            })
            .set(currentWord, { autoAlpha: 0 })
            .set(currentStrikeWord, { autoAlpha: 0 })
            .set(currentStrikeLine, { scaleX: 0 })
            .set(nextCharacters, { autoAlpha: 0, y: "0.08em" })
            .set(nextWord, { autoAlpha: 1 })
            .to(nextCharacters, {
              autoAlpha: 1,
              y: 0,
              duration: 0.08,
              stagger: 0.065,
              ease: "power2.out",
            })
            .set(currentCharacters, { autoAlpha: 1, y: 0 });
        });

        const visibilityTrigger = ScrollTrigger.create({
          trigger: root,
          start: "top 78%",
          end: "bottom top",
          onEnter: () => wordTimeline.play(),
          onEnterBack: () => wordTimeline.play(),
          onLeave: () => wordTimeline.pause(),
          onLeaveBack: () => wordTimeline.pause(),
        });

        return () => {
          visibilityTrigger.kill();
          wordTimeline.kill();
          bowTween.scrollTrigger?.kill();
          bowTween.kill();
        };
      });

      return () => media.revert();
    },
    { scope: rootRef }
  );

  return (
    <span
      ref={rootRef}
      className={cn(
        "block w-full text-[clamp(3rem,6vw,5.25rem)] leading-[0.9] tracking-[-0.025em]",
        className
      )}
    >
      <span className="sr-only">
        Why couples, brides, event planners, and people choose me
      </span>

      <span aria-hidden="true" className="grid w-full">
        <span className="flex flex-col items-start sm:flex-row sm:items-baseline sm:gap-4">
          <span>Why</span>

          <span className="relative inline-grid not-italic">
            <span className="invisible col-start-1 row-start-1 whitespace-nowrap font-serif italic">
              {SIZER_WORD}
            </span>

            {AUDIENCE_WORDS.map((word, wordIndex) => (
              <span
                key={word}
                data-audience-word
                className={cn(
                  "absolute left-0 top-0 whitespace-nowrap font-serif italic text-foreground",
                  wordIndex === 0 ? "visible" : "invisible"
                )}
              >
                {Array.from(word).map((character, characterIndex) => (
                  <span
                    key={`${word}-${characterIndex}`}
                    data-audience-character
                    className="inline-block will-change-transform"
                  >
                    {character === " " ? "\u00A0" : character}
                  </span>
                ))}
              </span>
            ))}

            <span className="pointer-events-none absolute inset-0" aria-hidden="true">
              {AUDIENCE_WORDS.map((word, wordIndex) => (
                <span
                  key={`${word}-strikethrough`}
                  data-strikethrough-word={wordIndex}
                  className="invisible absolute left-0 top-0 inline-block whitespace-nowrap font-serif italic"
                >
                  <span className="invisible">{word}</span>
                  <span
                    data-strikethrough-line={wordIndex}
                    className="absolute left-[-0.02em] right-[-0.02em] top-[0.52em] h-[2px] origin-left scale-x-0 bg-accent"
                  />
                </span>
              ))}
            </span>
          </span>
        </span>

        <span className="mt-2 justify-self-start sm:-mt-1 sm:justify-self-end">
          choose me
        </span>

        <svg
          className="mt-2 h-[0.42em] w-full overflow-visible text-accent"
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={bowClipId}>
              <rect ref={bowClipRef} x="-2" y="-10" width="0" height="32" />
            </clipPath>
          </defs>
          <g clipPath={`url(#${bowClipId})`}>
            <path
              d="M 1 9 C 24 2, 54 2, 99 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </svg>
      </span>
    </span>
  );
}
