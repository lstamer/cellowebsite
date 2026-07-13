"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TYPEWRITER_WORDS = [
  "couples",
  "brides",
  "event planners",
  "people",
] as const;

/** Widest word — an invisible sizer reserves its width so typing never rewraps the heading. */
const SIZER_WORD = TYPEWRITER_WORDS.reduce<string>(
  (longest, word) => (word.length > longest.length ? word : longest),
  ""
);

const TYPE_MS = 72;
const DELETE_MS = 38;
const TIMING_JITTER_MS = 20;
const HOLD_MS = 2700;

const randomCharacterDelay = (baseMs: number) =>
  Math.round(baseMs - TIMING_JITTER_MS + Math.random() * TIMING_JITTER_MS * 2);

interface WhyMeTypewriterHeadingProps {
  className?: string;
}

export function WhyMeTypewriterHeading({ className }: WhyMeTypewriterHeadingProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [displayWord, setDisplayWord] = useState<string>(TYPEWRITER_WORDS[0]);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [inView, setInView] = useState(false);

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

  // Pause the typing loop while the heading is off-screen so no timers run.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (!entry.isIntersecting) {
        // Reset while off-screen so the loop restarts cleanly from a whole word.
        setDisplayWord(TYPEWRITER_WORDS[0]);
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion || !inView) return;

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
          await wait(randomCharacterDelay(TYPE_MS));
        }

        await wait(HOLD_MS);

        for (let i = word.length - 1; i >= 0; i -= 1) {
          if (cancelled) return;
          setDisplayWord(word.slice(0, i));
          await wait(randomCharacterDelay(DELETE_MS));
        }

        wordIndex = (wordIndex + 1) % TYPEWRITER_WORDS.length;
      }
    };

    void runCycle();

    return () => {
      cancelled = true;
    };
  }, [reduceMotion, inView]);

  return (
    <span ref={rootRef} className={cn("inline", className)}>
      {/* Static full sentence for assistive tech; the typing animation below is decorative. */}
      <span className="sr-only">Why couples choose me</span>
      <span aria-hidden="true">
        Why{" "}
        <span className="relative inline-block whitespace-nowrap align-baseline text-accent not-italic">
          {/* Invisible sizer: reserves the widest word (plus caret) so typing never rewraps the h2. */}
          <span className="invisible">
            {SIZER_WORD}
            <span className="ml-[0.04em] inline-block w-[2px]" />
          </span>
          <span className="absolute inset-y-0 left-0 whitespace-nowrap">
            {displayWord}
            {!reduceMotion ? (
              <span className="ml-[0.04em] inline-block h-[0.82em] w-[2px] translate-y-[0.07em] animate-caret-blink bg-accent align-baseline" />
            ) : null}
          </span>
        </span>{" "}
        choose me
      </span>
    </span>
  );
}
