"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Row {
  heading: string;
  body: string;
  stat: string;
  statLabel: string;
  statCountUp?: boolean;
  statNumericEnd?: number;
  statSuffix?: string;
  /** true = text left, stat right; false = stat left, text right */
  textLeft: boolean;
}

const rows: Row[] = [
  {
    heading: "Your songs, your way",
    body: "Send me your Spotify playlist, a film score you love, or just a feeling you want. I arrange it for solo cello and send you a recording to approve before the day.",
    stat: "80+",
    statLabel: "weddings performed",
    statCountUp: true,
    statNumericEnd: 80,
    statSuffix: "+",
    textLeft: true,
  },
  {
    heading: "ATCL qualified. What that means.",
    body: "The Associate of Trinity College London diploma is one of the highest performance qualifications available. It means the technical ability to handle any request — and the musical sensitivity to make it feel effortless.",
    stat: "12+",
    statLabel: "years performing live",
    statCountUp: true,
    statNumericEnd: 12,
    statSuffix: "+",
    textLeft: false,
  },
  {
    heading: "One point of contact. Zero stress.",
    body: "Send me the timeline, I handle the rest. Setup, sound check, transitions between moments — you will not think about the music on your wedding day.",
    stat: "100%",
    statLabel: "five-star reviews",
    statCountUp: false,
    textLeft: true,
  },
];

export function WeddingExperience() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Count-up for stats
      containerRef.current
        ?.querySelectorAll<HTMLSpanElement>(".exp-stat-counter")
        .forEach((el) => {
          const end = parseInt(el.dataset.end ?? "0", 10);
          const suffix = el.dataset.suffix ?? "";
          if (end > 0) {
            const proxy = { val: 0 };
            gsap.to(proxy, {
              val: end,
              duration: 2,
              ease: "power1.out",
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
              onUpdate() {
                el.textContent = Math.round(proxy.val) + suffix;
              },
            });
          }
        });

      // Text blocks
      gsap.utils.toArray<HTMLElement>(".exp-text").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              once: true,
            },
          }
        );
      });

      // Stat blocks
      gsap.utils.toArray<HTMLElement>(".exp-stat").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            delay: 0.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              once: true,
            },
          }
        );
      });
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper
      id="experience"
      ref={containerRef}
      className="bg-background"
    >
      <SectionHeader
        label="Why couples choose me"
        heading="Not just any wedding musician"
        alignment="left"
      />

      <div className="mt-20 flex flex-col gap-24 md:gap-32">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
              !row.textLeft ? "lg:[&>*:first-child]:order-last" : ""
            }`}
          >
            {/* Text block */}
            <div className="exp-text">
              <h3 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-5 leading-tight">
                {row.heading}
              </h3>
              <p className="font-sans text-lg text-foreground/60 leading-relaxed text-pretty max-w-md">
                {row.body}
              </p>
            </div>

            {/* Stat block */}
            <div
              className={`exp-stat flex flex-col ${
                row.textLeft ? "lg:items-end lg:text-right" : "lg:items-start lg:text-left"
              }`}
            >
              <p className="font-serif italic text-[5rem] md:text-[7rem] leading-none text-primary/10 select-none">
                {row.statCountUp ? (
                  <span
                    className="exp-stat-counter"
                    data-end={row.statNumericEnd}
                    data-suffix={row.statSuffix}
                  >
                    {row.stat}
                  </span>
                ) : (
                  row.stat
                )}
              </p>
              <p className="font-mono text-xs tracking-widest uppercase text-foreground/40 mt-2">
                {row.statLabel}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
