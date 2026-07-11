"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Cable, Clock, Music2, Sparkles } from "lucide-react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
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
    title: "One less vendor to chase",
    description:
      "I arrive early, set up on my own, keep you in the loop, and stick to the schedule we agreed. No chasing required.",
    icon: Clock,
  },
  {
    title: "A first impression that sets the tone",
    description:
      "Guests walk into a room that already feels hosted and considered — before a single speech has started.",
    icon: Sparkles,
  },
  {
    title: "Works with your run-of-show & AV",
    description:
      "I slot into PA, MC, DJ, and front-of-house cues, with discreet amplified options when the room is large.",
    icon: Cable,
  },
  {
    title: "Briefed and on-brand",
    description:
      "Repertoire, dress, energy, and timing are shaped to the audience and the impression you need to make.",
    icon: Music2,
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
      "I was blown away... the guests couldn't stop talking about the cello. I will recommend Luke any time to anyone.",
    name: "Violet Gordon",
    event: "Kirstenhof SAPS function",
  },
  {
    quote:
      "The room felt composed from the moment guests arrived. It gave the evening a level of polish we could not have created with a playlist.",
    name: "Corporate organiser",
    event: "Awards dinner · Cape Town",
  },
  {
    quote:
      "He worked around speeches, AV, and guest movement without needing hand-holding. That made a real difference on the night.",
    name: "Event coordinator",
    event: "Client reception",
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
  const titleId = `corp-benefit-title-${idx}`;
  const Icon = diff.icon;

  return (
    <li className="corp-benefit-card gsap-reveal outline-none">
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

export function CorporateFunctionsBenefits() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".corp-benefit-intro",
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
        ".corp-benefit-card",
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
        ".corp-testimonial-card",
        { y: 40, autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current?.querySelector(".corp-testimonial-card"),
            start: "top 80%",
            once: true,
          },
          y: 0,
          autoAlpha: 1,
          duration: 0.9,
          stagger: { each: 0.14, from: "start" },
          ease: "power3.out",
        }
      );

      const statsGrid = containerRef.current?.querySelector<HTMLElement>(
        ".corp-event-banner-stats-grid"
      );
      if (statsGrid) {
        gsap.fromTo(
          ".corp-event-banner-stat",
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
    <SectionWrapper
      id="benefits"
      ref={containerRef}
      maxWidth="max-w-none"
      className="relative overflow-x-hidden bg-background px-0 md:px-0 lg:px-0"
    >
      {/* ── Two-column: max-w-7xl centers the left, right column breaks out to viewport edge ── */}
      {/* The negative margin-right on the right column = -(viewport - 1280px) / 2 at large screens */}
      <div className="relative z-[1] mx-auto flex max-w-7xl flex-col lg:flex-row lg:items-start px-section-x-sm md:px-section-x-md lg:pl-section-x-lg lg:pr-0">

        {/* LEFT COLUMN: sits inside the centered container — aligns with rest of site */}
        <div className="w-full lg:max-w-[520px] lg:shrink-0 lg:pr-12 flex flex-col gap-10">
          <div className="corp-benefit-intro gsap-reveal flex flex-col items-start text-left">
            <SectionHeader
              label="The difference"
              heading={
                <>
                  Why coordinators{" "}
                  <HandDrawnUnderline variant={3} underlineClassName="text-accent">
                    rebook me
                  </HandDrawnUnderline>
                </>
              }
              alignment="left"
              className="!mb-0"
            />
            <p className="font-sans mt-6 max-w-xl text-lg leading-relaxed text-foreground/70 text-pretty">
              The playing has to sound beautiful — that part is a given. But it
              also has to behave like a proper supplier: clear, prepared, on
              time, and easy for your team to brief.
            </p>
          </div>

          <ul role="list" className="m-0 flex list-none flex-col gap-8 p-0">
            {differentiators.map((diff, idx) => (
              <BenefitBlock key={`corp-benefit-${idx}`} diff={diff} idx={idx} />
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
                "corp-testimonial-card gsap-reveal rounded-l-card rounded-tr-none rounded-br-none bg-cream shadow-card p-6 lg:p-8",
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
              <p className="font-sans text-base lg:text-lg leading-relaxed text-foreground/90 text-pretty">
                {t.quote}
              </p>
              <div className="mt-5 border-t border-foreground/15 pt-4">
                <p className="font-display text-sm font-semibold tracking-wide text-foreground uppercase">
                  {t.name}
                </p>
                <p className="font-sans mt-0.5 text-xs text-foreground/50">
                  {t.event}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats: own centered container matching site grid ── */}
      <div className="relative z-[1] mt-24 border-t border-primary/10 pt-12 md:pt-16 mx-auto max-w-7xl px-section-x-sm md:px-section-x-md lg:px-section-x-lg">
        <div className="corp-event-banner-stats-grid grid grid-cols-2 gap-8 text-center md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="corp-event-banner-stat gsap-reveal px-4 text-center">
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
    </SectionWrapper>
  );
}
