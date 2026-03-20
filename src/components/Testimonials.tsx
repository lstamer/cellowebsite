"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Star } from "lucide-react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface TestimonialData {
  quote: string;
  name: string;
  descriptor: string;
  initials: string;
}

const testimonials: TestimonialData[] = [
  {
    quote:
      "The music transformed our ceremony into something out of a film. It was the exact atmosphere we dreamed of.",
    name: "Elena & James",
    descriptor: "Wedding Clients",
    initials: "EJ",
  },
  {
    quote:
      "Stamer\u2019s performance at our gala was captivating. Every guest was spellbound from the first note.",
    name: "Victoria Chen",
    descriptor: "Event Director",
    initials: "VC",
  },
  {
    quote:
      "He brought such warmth and elegance to my mother\u2019s memorial. The music said what words couldn\u2019t.",
    name: "David Osei",
    descriptor: "Private Client",
    initials: "DO",
  },
  {
    quote:
      "We\u2019ve booked Stamer for three consecutive years. His professionalism and artistry are unmatched.",
    name: "Sarah Mitchell",
    descriptor: "Corporate Planner",
    initials: "SM",
  },
  {
    quote:
      "The cello added a layer of sophistication to our product launch that no other instrument could have.",
    name: "Marcus Reed",
    descriptor: "Brand Director",
    initials: "MR",
  },
  {
    quote:
      "From the first consultation to the final bow, working with Stamer was effortless and extraordinary.",
    name: "Amara & Liam",
    descriptor: "Wedding Clients",
    initials: "AL",
  },
];

interface StatData {
  value: string;
  label: string;
  countUp: boolean;
  numericEnd: number;
  suffix: string;
}

const stats: StatData[] = [
  { value: "1200+", label: "Hours of playing", countUp: true, numericEnd: 1200, suffix: "+" },
  { value: "4x", label: "Competition winner", countUp: true, numericEnd: 4, suffix: "x" },
  { value: "ATCL", label: "Qualified", countUp: false, numericEnd: 0, suffix: "" },
  { value: "0", label: "Bad reviews\u2026 ever", countUp: false, numericEnd: 0, suffix: "" },
];

const mobilePositions = [
  { align: "self-start", offset: "ml-2", rotate: "-rotate-2", mt: "", z: "z-[2]", bg: "bg-primary/10" },
  { align: "self-end", offset: "mr-4", rotate: "rotate-3", mt: "-mt-8", z: "z-[3]", bg: "bg-accent/10" },
  { align: "self-start", offset: "ml-8", rotate: "rotate-1", mt: "-mt-5", z: "z-[1]", bg: "bg-primary/5" },
  { align: "self-end", offset: "mr-1", rotate: "-rotate-2", mt: "-mt-6", z: "z-[4]", bg: "bg-accent/15" },
  { align: "self-start", offset: "ml-4", rotate: "-rotate-1", mt: "-mt-4", z: "z-[2]", bg: "bg-primary/10" },
  { align: "self-end", offset: "mr-6", rotate: "rotate-2", mt: "-mt-5", z: "z-[5]", bg: "bg-accent/10" },
];

function StarRating({ className }: { className?: string }) {
  return (
    <div className={twMerge(clsx("flex gap-0.5", className))}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} fill="currentColor" className="w-3.5 h-3.5 text-accent" />
      ))}
    </div>
  );
}

// Longest quote — used as invisible spacer to set container height
const longestQuote = testimonials.reduce((a, b) =>
  a.quote.length > b.quote.length ? a : b
);

export function Testimonials() {
  const outerRef = useRef<HTMLDivElement>(null);
  const desktopPinRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // ── Mobile animations ──────────────────────────────────────────
      gsap.from(".mobile-heading", {
        scrollTrigger: {
          trigger: ".mobile-testimonials",
          start: "top 85%",
          once: true,
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      const mobileTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".mobile-cards",
          start: "top 80%",
          once: true,
        },
      });

      testimonials.forEach((_, i) => {
        mobileTl.fromTo(
          `.mq-${i}`,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
        );
        mobileTl.fromTo(
          `.mc-${i}`,
          { opacity: 0 },
          { opacity: 1, duration: 0.45, ease: "power2.out" },
          "-=0.2"
        );
        mobileTl.fromTo(
          `.md-${i}`,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
          "-=0.15"
        );
        if (i < testimonials.length - 1) {
          mobileTl.addLabel(`gap-${i}`, "+=0.12");
        }
      });

      gsap.from(".mobile-stat", {
        scrollTrigger: {
          trigger: ".mobile-stats",
          start: "top 90%",
          once: true,
        },
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
      });

      // ── Desktop: pinned editorial scroll ──────────────────────────
      if (!desktopPinRef.current || window.innerWidth < 1024) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: desktopPinRef.current,
          start: "top top",
          end: `+=${testimonials.length * 100}%`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      });

      // Progress bar fills across entire timeline
      tl.to(
        ".desktop-progress-fill",
        { scaleX: 1, duration: testimonials.length, ease: "none" },
        0
      );

      // Each testimonial segment = 1 unit of timeline
      testimonials.forEach((_, i) => {
        const seg = 1;
        const start = i * seg;
        const fadeIn = 0.28;
        const holdEnd = start + fadeIn + 0.42; // start of fade-out

        // Quote slides in
        tl.fromTo(
          `.dq-${i}`,
          { opacity: 0, y: 44 },
          { opacity: 1, y: 0, duration: fadeIn, ease: "power2.out" },
          start
        );

        // Attribution slides in slightly after
        tl.fromTo(
          `.da-${i}`,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: fadeIn * 0.75, ease: "power2.out" },
          start + 0.12
        );

        // Counter fades in
        tl.fromTo(
          `.dc-${i}`,
          { opacity: 0 },
          { opacity: 1, duration: 0.12 },
          start + 0.06
        );

        // Fade out everything except the last slide
        if (i < testimonials.length - 1) {
          tl.to(
            `.dq-${i}`,
            { opacity: 0, y: -32, duration: 0.26, ease: "power2.in" },
            holdEnd
          );
          tl.to(
            `.da-${i}`,
            { opacity: 0, duration: 0.22, ease: "power2.in" },
            holdEnd
          );
          tl.to(`.dc-${i}`, { opacity: 0, duration: 0.12 }, holdEnd);
        }
      });

      // ── Stat count-up (desktop) ────────────────────────────────────
      outerRef.current
        ?.querySelectorAll<HTMLSpanElement>(".stat-counter")
        .forEach((el) => {
          const end = parseInt(el.dataset.end || "0", 10);
          const suffix = el.dataset.suffix || "";
          if (end > 0) {
            const proxy = { val: 0 };
            gsap.to(proxy, {
              val: end,
              duration: 2,
              ease: "power1.out",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
              onUpdate() {
                el.textContent = Math.round(proxy.val) + suffix;
              },
            });
          }
        });
    },
    { scope: outerRef }
  );

  return (
    <div ref={outerRef} id="testimonials">
      {/* ===== MOBILE ===== */}
      <SectionWrapper className="mobile-testimonials block lg:hidden">
        <h2 className="mobile-heading font-serif italic text-3xl sm:text-4xl text-center text-foreground mb-10 text-balance">
          What they say about us
        </h2>

        <div className="mobile-cards flex flex-col px-2">
          {testimonials.map((t, i) => {
            const pos = mobilePositions[i];
            return (
              <div
                key={i}
                className={twMerge(
                  clsx(
                    "relative w-[72%] max-w-[17rem]",
                    pos.align,
                    pos.offset,
                    pos.mt,
                    pos.z,
                    pos.rotate
                  )
                )}
              >
                <div
                  className={twMerge(
                    clsx(
                      `mc-${i}`,
                      "absolute inset-0 rounded-2xl border border-foreground/10 shadow-card",
                      pos.bg
                    )
                  )}
                />
                <div className="relative p-4">
                  <div className={`mq-${i}`}>
                    <span className="font-serif text-4xl leading-none text-foreground/15 select-none block -mb-2">
                      &ldquo;
                    </span>
                    <p className="font-sans text-xs sm:text-sm leading-relaxed text-foreground/80">
                      {t.quote}
                    </p>
                  </div>
                  <div className={`md-${i} mt-3`}>
                    <StarRating className="mb-2" />
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <span className="font-display text-[0.6rem] font-bold text-primary">
                          {t.initials}
                        </span>
                      </div>
                      <div>
                        <p className="font-display font-bold text-xs text-foreground leading-tight">
                          {t.name}
                        </p>
                        <p className="font-sans text-[0.65rem] text-foreground/50">
                          {t.descriptor}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mobile-stats grid grid-cols-2 gap-4 mt-16">
          {stats.map((s, i) => (
            <div
              key={i}
              className="mobile-stat rounded-2xl border border-foreground/10 bg-primary/5 p-5 text-center"
            >
              <p className="font-display font-bold text-2xl text-primary">
                {s.value}
              </p>
              <p className="font-sans text-sm text-foreground/60 mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </SectionWrapper>

      {/* ===== DESKTOP: Editorial Pinned Scroll ===== */}
      <div className="hidden lg:block">
        {/* ── Pinned viewport ── */}
        <div
          ref={desktopPinRef}
          className="relative min-h-screen overflow-hidden bg-background flex items-center"
        >
          {/* Section label — top left */}
          <div className="absolute top-10 left-12 xl:left-20 flex items-center gap-3 z-10">
            <span className="font-mono text-[0.65rem] tracking-[0.35em] uppercase text-primary/50">
              Testimonials
            </span>
            <div className="w-6 h-px bg-primary/30" />
          </div>

          {/* Decorative opening quote — top right, enormous */}
          <div
            className="absolute top-0 right-0 font-serif text-[22rem] leading-none text-foreground/[0.04] select-none pointer-events-none overflow-hidden"
            aria-hidden="true"
          >
            &ldquo;
          </div>

          {/* Left edge — vertical rule + counter */}
          <div className="absolute left-12 xl:left-20 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-10">
            <div className="w-px h-16 bg-primary/25" />
            <div className="relative h-5 w-8">
              {testimonials.map((_, i) => (
                <span
                  key={i}
                  className={`dc-${i} absolute inset-0 font-mono text-[0.65rem] tracking-[0.2em] text-primary/50 opacity-0 text-center`}
                >
                  0{i + 1}
                </span>
              ))}
            </div>
            <div className="w-px h-16 bg-primary/10" />
          </div>

          {/* Quote area — centered, left-aligned text */}
          <div className="ml-28 xl:ml-40 pr-12 xl:pr-24 max-w-3xl w-full">
            {/* Relative container: spacer sets height, slides layer on top */}
            <div className="relative">
              {/* Invisible spacer — sets container height to longest quote */}
              <p
                className="font-serif italic text-[2.6rem] xl:text-[3rem] leading-[1.18] text-foreground invisible select-none pointer-events-none"
                aria-hidden="true"
              >
                &ldquo;{longestQuote.quote}&rdquo;
              </p>

              {/* Quote slides — absolutely stacked over spacer */}
              {testimonials.map((t, i) => (
                <p
                  key={i}
                  className={`dq-${i} absolute top-0 left-0 right-0 font-serif italic text-[2.6rem] xl:text-[3rem] leading-[1.18] text-foreground opacity-0`}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
              ))}
            </div>
          </div>

          {/* Attributions — bottom right, all stacked */}
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`da-${i} absolute bottom-16 right-12 xl:right-20 opacity-0 text-right z-10`}
            >
              <StarRating className="justify-end mb-2.5" />
              <p className="font-display font-semibold text-sm text-foreground leading-tight">
                {t.name}
              </p>
              <p className="font-mono text-[0.65rem] tracking-[0.25em] uppercase text-primary mt-0.5">
                {t.descriptor}
              </p>
            </div>
          ))}

          {/* Progress bar — bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground/10">
            <div className="desktop-progress-fill h-full bg-primary/40 origin-left scale-x-0" />
          </div>
        </div>

        {/* ── Stats bar (below pin) ── */}
        <div className="desktop-stats flex items-center justify-between py-8 px-12 xl:px-20 border-b border-foreground/10">
          {stats.map((s, i) => (
            <div
              key={i}
              className={twMerge(
                clsx(
                  "desktop-stat flex-1 text-center",
                  i < stats.length - 1 && "border-r border-foreground/10"
                )
              )}
            >
              <p className="font-display font-bold text-3xl text-primary">
                {s.countUp ? (
                  <span
                    className="stat-counter"
                    data-end={s.numericEnd}
                    data-suffix={s.suffix}
                  >
                    0{s.suffix}
                  </span>
                ) : (
                  s.value
                )}
              </p>
              <p className="font-sans text-sm text-foreground/60 mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
