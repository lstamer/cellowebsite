"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

const TYPEWRITER_WORDS = [
  "couples",
  "brides",
  "event planners",
  "people",
] as const;

type TypewriterWord = (typeof TYPEWRITER_WORDS)[number];

/** Widest word — the mobile sizer reserves its width so typing never rewraps the heading. */
const SIZER_WORD = TYPEWRITER_WORDS.reduce<string>(
  (longest, word) => (word.length > longest.length ? word : longest),
  ""
);

const TYPE_MS = 72;
const DELETE_MS = 38;
const TIMING_JITTER_MS = 20;
const HOLD_MS = 2700;
const DESKTOP_QUERY = "(min-width: 768px)";

const randomCharacterDelay = (baseMs: number) =>
  Math.round(baseMs - TIMING_JITTER_MS + Math.random() * TIMING_JITTER_MS * 2);

interface WhyMeTypewriterHeadingProps {
  className?: string;
}

export function WhyMeTypewriterHeading({ className }: WhyMeTypewriterHeadingProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);
  const measureRefs = useRef<Partial<Record<TypewriterWord, HTMLSpanElement | null>>>({});
  const [displayWord, setDisplayWord] = useState<string>(TYPEWRITER_WORDS[0]);
  const [targetWord, setTargetWord] = useState<TypewriterWord>(TYPEWRITER_WORDS[0]);
  const targetWordRef = useRef<TypewriterWord>(TYPEWRITER_WORDS[0]);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreference = () => {
      const prefersReduced = motionQuery.matches;
      setReduceMotion(prefersReduced);
      if (prefersReduced) {
        setDisplayWord(TYPEWRITER_WORDS[0]);
        setTargetWord(TYPEWRITER_WORDS[0]);
      }
    };

    applyMotionPreference();
    motionQuery.addEventListener("change", applyMotionPreference);
    return () => motionQuery.removeEventListener("change", applyMotionPreference);
  }, []);

  useEffect(() => {
    targetWordRef.current = targetWord;
  }, [targetWord]);

  // Pause the typing loop while the heading is off-screen so no timers run.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (!entry.isIntersecting) {
        // Reset while off-screen so the loop restarts cleanly from a whole word.
        setDisplayWord(TYPEWRITER_WORDS[0]);
        setTargetWord(TYPEWRITER_WORDS[0]);
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
        setTargetWord(word);

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

  // Desktop: lock the h2's wrap height at the widest-word state, then let the sizer
  // hug the current word so "choose me" never trails a reserved-width hole.
  // Mobile (<768px) keeps the static widest-word reservation — behavior unchanged.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(DESKTOP_QUERY, () => {
        const sizer = sizerRef.current;
        const heading = rootRef.current?.closest("h2");
        if (!sizer || !heading) return;

        const lockHeadingHeight = () => {
          // Measure with the sizer at its natural (widest-word) width so the
          // reserved height matches the tallest wrap state the cycle can reach.
          gsap.set(sizer, { clearProps: "width" });
          gsap.set(heading, { clearProps: "minHeight" });
          gsap.set(heading, { minHeight: heading.offsetHeight });

          const wordEl = measureRefs.current[targetWordRef.current];
          if (wordEl) {
            gsap.set(sizer, { width: wordEl.offsetWidth });
          }
        };

        lockHeadingHeight();
        // Re-measure once webfonts land — Cormorant metrics differ from the fallback.
        void document.fonts.ready.then(() => lockHeadingHeight());

        return () => {
          gsap.set(sizer, { clearProps: "width" });
          gsap.set(heading, { clearProps: "minHeight" });
        };
      });

      return () => mm.revert();
    },
    { scope: rootRef }
  );

  // Tween the sizer toward each new word as it starts typing (desktop only).
  useGSAP(
    () => {
      if (!window.matchMedia(DESKTOP_QUERY).matches) return;

      const sizer = sizerRef.current;
      const wordEl = measureRefs.current[targetWord];
      if (!sizer || !wordEl) return;

      if (reduceMotion) {
        gsap.set(sizer, { width: wordEl.offsetWidth });
        return;
      }

      gsap.to(sizer, {
        width: wordEl.offsetWidth,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
    },
    { scope: rootRef, dependencies: [targetWord, reduceMotion] }
  );

  return (
    <span ref={rootRef} className={cn("inline", className)}>
      {/* Static full sentence for assistive tech; the typing animation below is decorative. */}
      <span className="sr-only">Why couples choose me</span>
      <span aria-hidden="true">
        Why{" "}
        <span className="relative inline-block whitespace-nowrap align-baseline text-accent not-italic">
          {/* Sizer: reserves the widest word on mobile; GSAP tweens its width to hug the current word on md+. */}
          <span ref={sizerRef} className="invisible inline-block overflow-hidden align-baseline">
            <span className="inline-block whitespace-nowrap">
              {SIZER_WORD}
              <span className="ml-[0.04em] inline-block w-[2px]" />
            </span>
          </span>
          {/* Invisible measurers so each word's exact width (incl. caret) can be read per swap. */}
          {TYPEWRITER_WORDS.map((word) => (
            <span
              key={word}
              ref={(el) => {
                measureRefs.current[word] = el;
              }}
              className="invisible absolute left-0 top-0 whitespace-nowrap"
            >
              {word}
              <span className="ml-[0.04em] inline-block w-[2px]" />
            </span>
          ))}
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
