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

interface Moment {
  time: string;
  heading: string;
  description: string;
}

const moments: Moment[] = [
  {
    time: "30 min before",
    heading: "Guest arrival",
    description:
      "Guests arrive to a solo cello. Conversations start softer. The room feels ready.",
  },
  {
    time: "The ceremony",
    heading: "The processional",
    description:
      "The song you chose. Played live, just for this walk. The room holds its breath.",
  },
  {
    time: "After the vows",
    heading: "Signing the register",
    description:
      "A quiet piece while you sign. Your guests sit in the afterglow of the ceremony.",
  },
  {
    time: "Reception",
    heading: "Cocktail hour",
    description:
      "Light repertoire as champagne flows and photos happen. The atmosphere carries itself.",
  },
  {
    time: "The highlight",
    heading: "The first dance",
    description:
      "Your song, arranged for solo cello. Intimate, surprising, unforgettable.",
  },
];

// Alternating left indents create visual rhythm on desktop without content duplication
const desktopOffsets = ["md:ml-0", "md:ml-[22%]", "md:ml-[8%]", "md:ml-[30%]", "md:ml-[15%]"];

export function WeddingTimeline() {
  const containerRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Draw the vertical connecting line on scroll
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            transformOrigin: "top center",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 60%",
              end: "bottom 50%",
              scrub: true,
            },
          }
        );
      }

      // Timeline dots pop in with spring
      gsap.fromTo(
        ".timeline-dot",
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: "elastic.out(1, 0.5)",
          stagger: 0.18,
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 65%",
            once: true,
          },
        }
      );

      // Moment blocks fade + slide up
      gsap.utils.toArray<HTMLElement>(".moment-block").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              once: true,
            },
          }
        );
      });
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="timeline" ref={containerRef} className="bg-background">
      <SectionHeader
        label="Your wedding day"
        heading="Five moments, one thread of music"
        alignment="left"
      />

      <div className="relative mt-20 max-w-3xl">
        {/* Vertical line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-primary/10"
          style={{ left: "0.5rem" }}
          aria-hidden
        >
          <div ref={lineRef} className="absolute inset-0 bg-primary/25 origin-top" />
        </div>

        <div className="flex flex-col">
          {moments.map((moment, idx) => (
            <div
              key={idx}
              className={`relative flex items-start gap-8 py-10 pl-8 ${desktopOffsets[idx]}`}
            >
              {/* Dot on the line */}
              <div
                className="timeline-dot absolute w-3 h-3 rounded-full bg-accent ring-4 ring-background top-[3.25rem]"
                style={{ left: "0.5rem", transform: "translateX(-50%)" }}
                aria-hidden
              />

              {/* Content */}
              <div className="moment-block max-w-sm">
                <p className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-accent mb-2">
                  {moment.time}
                </p>
                <h3 className="font-display font-bold text-xl md:text-2xl text-foreground mb-3 leading-tight">
                  {moment.heading}
                </h3>
                <p className="font-sans text-base text-foreground/60 leading-relaxed text-pretty">
                  {moment.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
