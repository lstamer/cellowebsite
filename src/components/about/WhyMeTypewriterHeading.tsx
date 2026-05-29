"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TYPEWRITER_WORDS = [
  "couples",
  "brides",
  "event planners",
  "people",
] as const;

const TYPE_MS = 72;
const DELETE_MS = 38;
const HOLD_MS = 2200;

interface WhyMeTypewriterHeadingProps {
  className?: string;
}

export function WhyMeTypewriterHeading({ className }: WhyMeTypewriterHeadingProps) {
  const [displayWord, setDisplayWord] = useState<string>(TYPEWRITER_WORDS[0]);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreference = () => {
      const prefersReduced = motionQuery.matches;
      setReduceMotion(prefersReduced);
      if (prefersReduced) {
        setDisplayWord(TYPEWRITER_WORDS[0]);
      }
    };

    applyMotionPreference();
    motionQuery.addEventListener("change", applyMotionPreference);
    return () => motionQuery.removeEventListener("change", applyMotionPreference);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    let cancelled = false;
    let wordIndex = 1;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), ms);
      });

    const runCycle = async () => {
      await wait(HOLD_MS);

      while (!cancelled) {
        const word = TYPEWRITER_WORDS[wordIndex];

        for (let i = 1; i <= word.length; i += 1) {
          if (cancelled) return;
          setDisplayWord(word.slice(0, i));
          await wait(TYPE_MS);
        }

        await wait(HOLD_MS);

        for (let i = word.length - 1; i >= 0; i -= 1) {
          if (cancelled) return;
          setDisplayWord(word.slice(0, i));
          await wait(DELETE_MS);
        }

        wordIndex = (wordIndex + 1) % TYPEWRITER_WORDS.length;
      }
    };

    void runCycle();

    return () => {
      cancelled = true;
    };
  }, [reduceMotion]);

  return (
    <span className={cn("inline", className)}>
      Why{" "}
      <span
        className="inline whitespace-nowrap text-accent not-italic"
        aria-live="polite"
        aria-atomic="true"
      >
        {displayWord}
        {!reduceMotion ? (
          <span
            className="ml-[0.06em] inline-block w-[2px] translate-y-[0.06em] bg-accent align-middle"
            aria-hidden
          />
        ) : null}
      </span>{" "}
      choose me
    </span>
  );
}
