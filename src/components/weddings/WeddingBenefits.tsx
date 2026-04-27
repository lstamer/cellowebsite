"use client";

import { useRef } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2, Mic2, Music2, Shirt } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Differentiator {
  title: string;
  description: string;
  icon: LucideIcon;
}

const differentiators: Differentiator[] = [
  {
    title: "Bespoke arrangements",
    description:
      "I don't just play from a rigid setlist. If there's a specific song that means the world to you, I will arrange it and play it specifically for your walk down the aisle.",
    icon: Music2,
  },
  {
    title: "Reading the room",
    description:
      "Live music shouldn't feel pre-programmed. I watch the guests, feel the atmosphere, and intuitively adjust the pacing and volume to exactly what the moment needs.",
    icon: Mic2,
  },
  {
    title: "Seamless professionalism",
    description:
      "From arriving early to communicating directly with your venue and coordinator, everything is handled discreetly behind the scenes. You simply show up and enjoy the day.",
    icon: Shirt,
  },
  {
    title: "Zero added work",
    description:
      "Everything is handled autonomously on the day. You don't need to direct, manage, or worry about the music.",
    icon: CheckCircle2,
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
  { value: "12,000", label: "Hours of playtime", countUp: true, numericEnd: 12000, suffix: "" },
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
      <article tabIndex={0} aria-labelledby={titleId} className="flex gap-4 text-left">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-accent/15 text-primary"
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            id={titleId}
            className="font-display text-base font-bold tracking-tight text-primary md:text-lg"
          >
            {diff.title}
          </h3>
          <p className="font-sans mt-1.5 text-[0.95rem] leading-relaxed text-foreground/70 text-pretty">
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
        ".benefit-photo",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
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

      // Stats animation
      const statsGrid = containerRef.current?.querySelector<HTMLElement>(".wedding-banner-stats-grid");
      if (statsGrid) {
        gsap.fromTo(
          ".wedding-banner-stat",
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
              once: true,
            },
          }
        );
      }

      containerRef.current
        ?.querySelectorAll<HTMLSpanElement>(".stat-counter")
        .forEach((el) => {
          const endStr = el.dataset.end || "0";
          const end = parseInt(endStr.replace(/,/g, ""), 10);
          const suffix = el.dataset.suffix || "";

          if (end > 0) {
            const proxy = { val: 0 };
            gsap.to(proxy, {
              val: end,
              duration: 2,
              ease: "power1.out",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
              onUpdate() {
                const displayVal = Math.round(proxy.val);
                el.textContent =
                  (displayVal >= 1000 ? displayVal.toLocaleString() : displayVal) + suffix;
              },
            });
          }
        });

    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper
      id="benefits"
      ref={containerRef}
      className="relative overflow-hidden bg-background pt-24 pb-32"
    >
      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-[min(22rem,55vw)] w-[min(22rem,55vw)] rounded-full bg-primary/5"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-0 h-[min(18rem,45vw)] w-[min(18rem,45vw)] rounded-full bg-accent/10"
        aria-hidden
      />

      <div className="relative z-[1] mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-0 lg:items-start">
        {/* ── Left column: intro + benefits ── */}
        <div className="flex flex-col gap-10">
          {/* Intro */}
          <div className="benefit-intro flex flex-col items-start text-left">
            <div className="mb-6 h-px w-12 bg-accent/70" aria-hidden />
            <SectionHeader
              label="The Difference"
              heading="Why couples choose to work with me."
              alignment="left"
              className="!mb-0"
            />
            <p className="font-sans mt-6 max-w-xl text-lg leading-relaxed text-foreground/70 text-pretty">
              Music is one part of a day full of moving pieces. I make sure it's
              the part you never have to worry about.
            </p>
          </div>

          {/* Benefits list */}
          <ul role="list" className="m-0 flex list-none flex-col gap-8 p-0">
            {differentiators.map((diff, idx) => (
              <BenefitBlock key={`benefit-${idx}`} diff={diff} idx={idx} />
            ))}
          </ul>
        </div>

        {/* ── Right column: sticky photo ── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
        <div
          className={cn(
            "benefit-photo relative isolate w-full overflow-hidden rounded-card border border-primary/15 bg-background shadow-card",
            "aspect-[3/4] lg:aspect-auto lg:h-[min(80dvh,680px)]"
          )}
        >
          <Image
            src="/images/wedding-difference.png"
            alt="Bride and groom by the water as guests celebrate with balloons"
            fill
            className="object-cover object-center grayscale-[15%]"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority={false}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-primary/20 to-transparent"
            aria-hidden
          />
          <div className="pointer-events-auto absolute inset-x-0 bottom-5 flex justify-center px-4">
            <Button href="/book" variant="white" size="sm" className="shadow-md backdrop-blur-sm">
              Book a performance
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
        </div>
      </div>

      {/* Stats Container */}
      <div className="relative z-[1] mx-auto mt-24 max-w-6xl border-t border-primary/10 pt-12 md:pt-16">
        <div className="wedding-banner-stats-grid relative z-10 grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="wedding-banner-stat px-4 text-center">
              <p className="font-display mb-2 text-3xl font-bold text-primary xl:text-4xl">
                {s.countUp ? (
                  <span className="stat-counter" data-end={s.numericEnd} data-suffix={s.suffix}>
                    0{s.suffix}
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
    </SectionWrapper>
  );
}
