"use client";

import { useRef } from "react";
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
    title: "Music that fits your crowd",
    description:
      "Classical, film, pop, or the one song that means everything to the people in the room — I arrange and play for your guests, not off a fixed setlist.",
    icon: Music2,
  },
  {
    title: "Reading the room",
    description:
      "Live music shouldn't feel pre-programmed. I watch your guests, feel where the night is going, and shift the pacing and volume to exactly what the moment wants.",
    icon: Eye,
  },
  {
    title: "Quietly handled",
    description:
      "I arrive early, sort things out with your host or venue, and stay out of your way — all you have to do is enjoy your own evening.",
    icon: Shirt,
  },
  {
    title: "Nothing for you to manage",
    description:
      "The music runs itself on the night. No cues to give, no musician to direct — one less thing on a list that's already long enough.",
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
      "I was blown away\u2026 the guests couldn\u2019t stop talking about the cello. I will recommend Luke any time to anyone. Bless him and his talent as he continues to live his gift out at other venues \uD83D\uDE4F",
    name: "Violet Gordon",
    event: "Kirstenhof SAPS",
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
    <li className="benefit-card gsap-reveal">
      <article aria-labelledby={titleId} className="flex gap-5 text-left">
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
        ".testimonial-card",
        { y: 40, autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current?.querySelector(".testimonial-card"),
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
              label="The difference"
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
              You&apos;re already juggling a dozen things to pull this evening
              off. The music is the one part I make sure you never have to think
              about.
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
                "testimonial-card gsap-reveal rounded-l-card rounded-tr-none rounded-br-none bg-cream shadow-card p-6 lg:p-8",
                i === 1 && "lg:ml-10",
                i === 2 && "lg:ml-20"
              )}
            >
              <span
                className="font-serif text-4xl leading-none text-foreground/15 select-none block -mb-1"
                aria-hidden
              >
                &ldquo;
              </span>
              <p className="font-sans text-base lg:text-lg leading-relaxed text-foreground text-pretty">
                {t.quote}
              </p>
              <div className="mt-5 border-t border-foreground/15 pt-4">
                <p className="font-display text-sm font-semibold tracking-wide text-foreground uppercase">
                  {t.name}
                </p>
                <p className="font-sans mt-0.5 text-xs text-foreground/70">
                  {t.event}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Proof line: own centered container matching site grid ── */}
      <div className="relative z-[1] mt-24 border-t border-primary/10 pt-12 md:pt-16 mx-auto max-w-7xl px-section-x-sm md:px-section-x-md lg:px-section-x-lg">
        <p className="font-sans mx-auto max-w-2xl text-center text-lg leading-relaxed text-foreground/70 text-pretty">
          Twelve years of birthdays, anniversaries, and dinners that mattered —
          and still not a single bad review.
        </p>
      </div>
    </section>
  );
}
