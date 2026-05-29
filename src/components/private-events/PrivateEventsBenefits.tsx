"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Clock, Eye, Music2, Shirt } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";
import { cn } from "@/lib/utils";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";
import {
  applyTimelineRevealFallbacks,
  scrollRevealFromTo,
} from "@/lib/gsap-scroll-reveal";

interface Differentiator {
  title: string;
  description: string;
  icon: LucideIcon;
}

const differentiators: Differentiator[] = [
  {
    title: "Repertoire for your occasion",
    description:
      "Classical, film, pop, or a song that means something to the people in the room — I arrange and play to suit your crowd, not a fixed setlist.",
    icon: Music2,
  },
  {
    title: "Reading the room",
    description:
      "Live music shouldn't feel pre-programmed. I watch your guests, feel the atmosphere, and adjust the pacing and volume to exactly what the moment needs.",
    icon: Eye,
  },
  {
    title: "Quiet professionalism",
    description:
      "From arriving early to coordinating with your host or venue, everything is handled discreetly behind the scenes. You simply enjoy the evening.",
    icon: Shirt,
  },
  {
    title: "Zero added work",
    description:
      "Everything is handled autonomously on the night. You don't need to direct, manage, or worry about the music.",
    icon: Clock,
  },
];

interface EventTestimonial {
  quote: string;
  name: string;
  event: string;
}

const eventTestimonials: EventTestimonial[] = [
  {
    quote:
      "We had Luke play through dinner for my husband's 50th. The room went quiet for the right songs and warmed up for the rest — it set the whole tone of the night.",
    name: "Rachel M.",
    event: "Milestone Birthday · Stellenbosch",
  },
  {
    quote:
      "Several guests told me afterwards it was the most beautiful detail of the evening. He read the room better than I could have planned it.",
    name: "Daniel & Priya",
    event: "Anniversary Dinner",
  },
  {
    quote:
      "From the moment he arrived to the last note, we didn't have to think about the music once — which is exactly what you want when you're hosting.",
    name: "Hannah T.",
    event: "Engagement Party · Cape Town",
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
  { value: "12+", label: "Years of experience", countUp: true, numericEnd: 12, suffix: "+" },
  { value: "ATCL", label: "Qualified", countUp: false, numericEnd: 0, suffix: "" },
  { value: "0", label: "Negative reviews... ever", countUp: false, numericEnd: 0, suffix: "" },
  { value: "6,500", label: "Hours of playtime", countUp: true, numericEnd: 6500, suffix: "" },
];

function BenefitBlock({
  diff,
  idx,
}: {
  diff: Differentiator;
  idx: number;
}) {
  const titleId = `benefit-title-${idx}`;
  const Icon = diff.icon;

  return (
    <li className="benefit-card outline-none">
      <article tabIndex={0} aria-labelledby={titleId} className="flex gap-5 text-left">
        <div
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-none bg-foreground text-on-dark"
          aria-hidden
        >
          <Icon className="h-[20px] w-[20px]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            id={titleId}
            className={featureItemTitleClass}
          >
            {diff.title}
          </h3>
          <p className={cn(featureItemBodyClass, "mt-2")}>
            {diff.description}
          </p>
        </div>
      </article>
    </li>
  );
}

export function PrivateEventsBenefits() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scroll = {
        trigger: containerRef.current,
        start: "top 75%",
        once: true,
      };

      const tl = gsap.timeline({ scrollTrigger: scroll });

      tl.fromTo(
        ".benefit-intro",
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );

      tl.fromTo(
        ".testimonial-card",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: { each: 0.14, from: "start" },
          ease: "power3.out",
        },
        "-=0.5"
      );

      tl.fromTo(
        ".benefit-card",
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: { each: 0.08, from: "start" },
          ease: "power3.out",
        },
        "-=0.6"
      );

      applyTimelineRevealFallbacks(tl);

      const statsGrid = containerRef.current?.querySelector<HTMLElement>(
        ".event-banner-stats-grid"
      );
      if (statsGrid) {
        scrollRevealFromTo(
          ".event-banner-stat",
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: statsGrid,
              start: "top 85%",
            },
          }
        );

        statsGrid.querySelectorAll<HTMLSpanElement>(".stat-counter").forEach((el) => {
          const endStr = el.dataset.end || "0";
          const end = parseInt(endStr.replace(/,/g, ""), 10);
          const suffix = el.dataset.suffix || "";

          if (end > 0) {
            const proxy = { val: 0 };
            gsap.to(proxy, {
              val: end,
              duration: 2,
              ease: "power1.out",
              scrollTrigger: {
                trigger: statsGrid,
                start: "top 85%",
                once: true,
              },
              onStart() {
                el.textContent = `0${suffix}`;
              },
              onUpdate() {
                const displayVal = Math.round(proxy.val);
                el.textContent =
                  (displayVal >= 1000 ? displayVal.toLocaleString() : displayVal) + suffix;
              },
            });
          }
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <section
      id="benefits"
      ref={containerRef}
      className="relative overflow-x-hidden bg-background py-section-y md:py-section-y-md"
    >
      {/* ── Two-column: max-w-7xl centers the left, right column breaks out to viewport edge ── */}
      {/* The negative margin-right on the right column = -(viewport - 1280px) / 2 at large screens */}
      <div className="relative z-[1] mx-auto flex max-w-7xl flex-col lg:flex-row lg:items-start px-section-x-sm md:px-section-x-md lg:pl-section-x-lg lg:pr-0">

        {/* LEFT COLUMN: sits inside the centered container — aligns with rest of site */}
        <div className="w-full lg:max-w-[520px] lg:shrink-0 lg:pr-12 flex flex-col gap-10">
          <div className="benefit-intro flex flex-col items-start text-left">
            <SectionHeader
              label="The Difference"
              heading={
                <>
                  Why hosts{" "}
                  <HandDrawnUnderline variant={3} underlineClassName="text-accent">
                    choose me
                  </HandDrawnUnderline>
                </>
              }
              alignment="left"
              className="!mb-0"
            />
            <p className="font-sans mt-6 max-w-xl text-lg leading-relaxed text-foreground/70 text-pretty">
              Music is one part of an evening you&apos;re already juggling. I make
              sure it&apos;s the part you never have to worry about.
            </p>
          </div>

          <ul role="list" className="m-0 flex list-none flex-col gap-8 p-0">
            {differentiators.map((diff, idx) => (
              <BenefitBlock key={`benefit-${idx}`} diff={diff} idx={idx} />
            ))}
          </ul>
        </div>

        {/* RIGHT COLUMN: negative margin-right extends it to the viewport right edge */}
        <div className={cn(
          "mt-12 lg:mt-0 flex-1 lg:sticky lg:top-24 lg:self-start flex flex-col gap-4",
          "lg:[margin-right:calc((80rem_-_100vw)_/_2)]"
        )}>
          {eventTestimonials.map((t, i) => (
            <div
              key={i}
              className={cn(
                "testimonial-card rounded-l-card rounded-tr-none rounded-br-none bg-foreground shadow-card p-6 lg:p-8",
                i === 1 && "lg:ml-10",
                i === 2 && "lg:ml-20"
              )}
            >
              <span
                className="font-serif text-4xl leading-none text-accent select-none block -mb-1"
                aria-hidden
              >
                &ldquo;
              </span>
              <p className="font-sans text-base lg:text-lg leading-relaxed text-on-dark/90 text-pretty">
                {t.quote}
              </p>
              <div className="mt-5 border-t border-on-dark/15 pt-4">
                <p className="font-display text-sm font-semibold tracking-wide text-on-dark uppercase">
                  {t.name}
                </p>
                <p className="font-sans mt-0.5 text-xs text-on-dark/50">
                  {t.event}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats: own centered container matching site grid ── */}
      <div className="relative z-[1] mt-24 border-t border-primary/10 pt-12 md:pt-16 mx-auto max-w-7xl px-section-x-sm md:px-section-x-md lg:px-section-x-lg">
        <div className="event-banner-stats-grid grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="event-banner-stat px-4 text-center">
              <p className="font-display mb-2 text-3xl font-bold text-primary xl:text-4xl">
                {s.countUp ? (
                  <span className="stat-counter" data-end={s.numericEnd} data-suffix={s.suffix}>
                    {s.value}
                  </span>
                ) : (
                  s.value
                )}
              </p>
              <p className="font-sans mx-auto block max-w-[150px] text-sm leading-tight text-foreground/70">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
