"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";
import { applyTimelineRevealFallbacks } from "@/lib/gsap-scroll-reveal";

interface Moment {
  index: string;
  scene: string;
  title: string;
  body: string;
}

const moments: Moment[] = [
  {
    index: "01",
    scene: "Processional · Vows · Signing",
    title: "The ceremony",
    body: "Cello walks you down the aisle at your pace, then holds the room through the vows — and keeps playing through the long, quiet minutes while you sign the register. The gaps a playlist can never time.",
  },
  {
    index: "02",
    scene: "Drinks while you're away for photos",
    title: "The cocktail hour",
    body: "You're off having photos taken; your guests aren't left in silence. Warm, unhurried cello keeps the lawn alive — no awkward lull, no scramble to find a speaker that works.",
  },
  {
    index: "03",
    scene: "Your entrance · The first dance",
    title: "The reception",
    body: "A song you love, reimagined for solo cello as you walk in. The same instrument that played you down the aisle lifts the room again for your first dance.",
  },
];

export function WeddingImportance() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
          once: true,
        },
      });

      tl.fromTo(
        ".importance-intro",
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );

      tl.fromTo(
        ".importance-image",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
        "-=0.5"
      );

      tl.fromTo(
        ".moment-row",
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: { each: 0.12, from: "start" },
          ease: "power3.out",
        },
        "-=0.7"
      );

      tl.fromTo(
        ".importance-closing",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "-=0.3"
      );

      applyTimelineRevealFallbacks(tl);
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="importance" ref={containerRef} className="bg-background">
      <div className="importance-intro gsap-reveal max-w-3xl">
        <SectionHeader
          label="The Impact"
          heading="One cellist. Every moment of the day."
          alignment="left"
          className="!mb-0"
        />
        <p className="font-sans mt-6 text-lg leading-relaxed text-foreground/75 text-pretty md:text-xl">
          A wedding isn&apos;t a single song — it&apos;s a dozen small moments, each
          needing a different touch. Live cello shapes all of them, and quietly
          covers the gaps you&apos;d never think to plan for.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-12 md:mt-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-20">
        <div className="importance-image gsap-reveal group relative w-full max-w-md lg:max-w-none lg:sticky lg:top-24">
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
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          </div>
        </div>

        <ol role="list" className="m-0 flex list-none flex-col p-0">
          {moments.map((moment) => (
            <li
              key={moment.index}
              className="moment-row gsap-reveal flex gap-5 border-b border-primary/10 pb-10 last:border-b-0 last:pb-0 [&:not(:first-child)]:pt-10 md:pb-12 md:[&:not(:first-child)]:pt-12"
            >
              <div
                className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-none bg-foreground font-mono text-sm text-on-dark"
                aria-hidden
              >
                {moment.index}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-jost text-xs font-semibold uppercase tracking-widest text-foreground/55">
                  {moment.scene}
                </p>
                <h3 className={cn(featureItemTitleClass, "mt-1.5")}>{moment.title}</h3>
                <p className={cn(featureItemBodyClass, "mt-2")}>{moment.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="importance-closing gsap-reveal mt-14 max-w-2xl border-l-2 border-accent pl-5 font-serif text-2xl italic leading-snug text-primary text-balance md:mt-20 md:text-3xl">
        One cellist, every moment of the day — and no dead air in between.
      </p>
    </SectionWrapper>
  );
}
