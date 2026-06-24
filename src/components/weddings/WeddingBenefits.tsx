"use client";

import { useRef } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Clock, Eye, Music2, Shirt } from "lucide-react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";
import { cn } from "@/lib/utils";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";

interface Differentiator {
  title: string;
  description: string;
  icon: LucideIcon;
}

const differentiators: Differentiator[] = [
  {
    title: "Your song, arranged",
    description:
      "I don't just play from a rigid setlist. If there's a song that means the world to you, I'll arrange it for cello and play it for your walk down the aisle — yours, not a stock version of it.",
    icon: Music2,
  },
  {
    title: "Reading the room",
    description:
      "Live music shouldn't feel pre-programmed. I watch the guests, feel the room, and adjust the pacing and volume to whatever the moment actually needs.",
    icon: Eye,
  },
  {
    title: "Quietly handled",
    description:
      "I arrive early, talk to your venue and coordinator directly, and keep everything running in the background. You just show up and be present.",
    icon: Shirt,
  },
  {
    title: "Nothing extra on your plate",
    description:
      "It all happens on its own on the day. You don't have to cue me, manage me, or give the music a second thought.",
    icon: Clock,
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
    <li className="benefit-card gsap-reveal outline-none">
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

export function WeddingBenefits() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".benefit-intro",
        { y: 36, autoAlpha: 0 },
        {
          scrollTrigger: { trigger: containerRef.current, start: "top 75%", once: true },
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );

      gsap.fromTo(
        ".benefit-card",
        { y: 32, autoAlpha: 0 },
        {
          scrollTrigger: { trigger: containerRef.current, start: "top 75%", once: true },
          y: 0,
          autoAlpha: 1,
          duration: 0.75,
          stagger: { each: 0.08, from: "start" },
          ease: "power3.out",
        }
      );

      gsap.fromTo(
        ".benefit-portrait",
        { y: 40, autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current?.querySelector(".benefit-portrait"),
            start: "top 80%",
            once: true,
          },
          y: 0,
          autoAlpha: 1,
          duration: 1,
          ease: "power3.out",
        }
      );

      const statsGrid = containerRef.current?.querySelector<HTMLElement>(
        ".wedding-banner-stats-grid"
      );
      if (statsGrid) {
        gsap.fromTo(
          ".wedding-banner-stat",
          { y: 20, autoAlpha: 0 },
          {
            scrollTrigger: { trigger: statsGrid, start: "top 85%", once: true },
            y: 0,
            autoAlpha: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.out",
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
          <div className="benefit-intro gsap-reveal flex flex-col items-start text-left">
            <SectionHeader
              label="The Difference"
              heading={
                <>
                  Why couples{" "}
                  <HandDrawnUnderline variant={3} underlineClassName="text-accent">
                    choose me
                  </HandDrawnUnderline>
                </>
              }
              alignment="left"
              className="!mb-0"
            />
            <p className="font-sans mt-6 max-w-xl text-lg leading-relaxed text-foreground/70 text-pretty">
              Your day has a hundred moving pieces. I make sure the music is the
              one part you never once have to worry about.
            </p>
          </div>

          <ul role="list" className="m-0 flex list-none flex-col gap-8 p-0">
            {differentiators.map((diff, idx) => (
              <BenefitBlock key={`benefit-${idx}`} diff={diff} idx={idx} />
            ))}
          </ul>
        </div>

        {/* RIGHT COLUMN: portrait of the cellist */}
        <div className="mt-12 lg:mt-0 flex flex-1 justify-center lg:sticky lg:top-24 lg:justify-start lg:self-start">
          <div className="benefit-portrait gsap-reveal group relative w-[88%] max-w-md lg:max-w-none">
            <div
              className="absolute inset-0 -z-10 translate-x-3 translate-y-3 bg-primary/5 transition-transform duration-700 ease-out group-hover:scale-105"
              aria-hidden
            />
            <div className="relative aspect-[4/5] overflow-hidden shadow-2xl">
              <Image
                src="/images/about-perf1.jpg"
                alt="Cellist performing live at a wedding ceremony"
                fill
                loading="lazy"
                className="object-cover object-center grayscale-[15%] transition-transform duration-1000 ease-out group-hover:scale-105"
                sizes="(max-width: 1024px) 88vw, 40vw"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats: own centered container matching site grid ── */}
      <div className="relative z-[1] mt-24 border-t border-primary/10 pt-12 md:pt-16 mx-auto max-w-7xl px-section-x-sm md:px-section-x-md lg:px-section-x-lg">
        <div className="wedding-banner-stats-grid grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="wedding-banner-stat gsap-reveal px-4 text-center">
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
