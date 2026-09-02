"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-client";
import { cn } from "@/lib/utils";

const AUDIENCE_WORDS = ["couples", "brides", "event planners", "people"] as const;
const PHRASE_TAIL = " choose me";
const SIZER_WORD = AUDIENCE_WORDS.reduce<string>(
  (longest, word) => (word.length > longest.length ? word : longest),
  ""
);

const WORD_HOLD_SECONDS = 2.4;

interface WhyMeBowlineHeadingProps {
  className?: string;
}

export function WhyMeBowlineHeading({ className }: WhyMeBowlineHeadingProps) {
  const rootRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const wordNodes = gsap.utils.toArray<HTMLElement>("[data-audience-word]", root);
      const allCharacters = gsap.utils.toArray<HTMLElement>("[data-audience-character]", root);
      const allStrikeLines = gsap.utils.toArray<HTMLElement>(
        "[data-strikethrough-line]",
        root
      );
      const media = gsap.matchMedia();

      const showFirstWord = () => {
        gsap.set(wordNodes, { autoAlpha: 0 });
        gsap.set(allCharacters, { autoAlpha: 1, y: 0 });
        gsap.set(allStrikeLines, { scaleX: 0 });
        gsap.set(wordNodes[0], { autoAlpha: 1 });
      };

      media.add("(prefers-reduced-motion: reduce)", showFirstWord);

      media.add("(prefers-reduced-motion: no-preference)", () => {
        showFirstWord();

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
          if (!currentStrikeLine) return;

          wordTimeline
            .to({}, { duration: WORD_HOLD_SECONDS })
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
        "block w-full text-[clamp(2rem,4.6vw,3.75rem)] leading-[1.05] tracking-tight",
        className
      )}
    >
      <span className="sr-only">
        Why couples, brides, event planners, and people choose me
      </span>

      <span aria-hidden="true" className="inline-grid max-w-full">
        <span className="flex flex-wrap items-baseline gap-x-[0.25em]">
          <span>Why</span>

          <span className="relative inline-grid not-italic">
            <span className="invisible col-start-1 row-start-1 whitespace-nowrap font-serif italic">
              {SIZER_WORD}
              {PHRASE_TAIL}
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
                <span className="relative inline-block">
                  {Array.from(word).map((character, characterIndex) => (
                    <span
                      key={`${word}-${characterIndex}`}
                      data-audience-character
                      className="inline-block will-change-transform"
                    >
                      {character === " " ? " " : character}
                    </span>
                  ))}
                  <span
                    data-strikethrough-line={wordIndex}
                    className="pointer-events-none absolute left-[-0.02em] right-[-0.02em] top-[0.52em] h-[2px] origin-left scale-x-0 bg-accent"
                  />
                </span>
                {Array.from(PHRASE_TAIL).map((character, characterIndex) => (
                  <span
                    key={`${word}-tail-${characterIndex}`}
                    data-audience-character
                    className="inline-block will-change-transform"
                  >
                    {character === " " ? " " : character}
                  </span>
                ))}
              </span>
            ))}
          </span>
        </span>
      </span>
    </span>
  );
}
