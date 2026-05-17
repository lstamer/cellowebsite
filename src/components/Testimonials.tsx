/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Star } from "lucide-react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface TestimonialData {
  quote: string;
  name: string;
  descriptor: string;
  initials: string;
  image: string;
}

const testimonials: TestimonialData[] = [
  {
    quote:
      "The music transformed our ceremony into something out of a film. It was the exact atmosphere we dreamed of.",
    name: "Elena & James",
    descriptor: "Wedding Clients",
    initials: "EJ",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
  },
  {
    quote:
      "Stamer\u2019s performance at our gala was captivating. Every guest was spellbound from the first note.",
    name: "Victoria Chen",
    descriptor: "Event Director",
    initials: "VC",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
  },
  {
    quote:
      "He brought such warmth and elegance to my mother\u2019s memorial. The music said what words couldn\u2019t.",
    name: "David Osei",
    descriptor: "Private Client",
    initials: "DO",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    quote:
      "We\u2019ve booked Stamer for three consecutive years. His professionalism and artistry are unmatched.",
    name: "Sarah Mitchell",
    descriptor: "Corporate Planner",
    initials: "SM",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  },
  {
    quote:
      "The cello added a layer of sophistication to our product launch that no other instrument could have.",
    name: "Marcus Reed",
    descriptor: "Brand Director",
    initials: "MR",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
  },
  {
    quote:
      "From the first consultation to the final bow, working with Stamer was effortless and extraordinary.",
    name: "Amara & Liam",
    descriptor: "Wedding Clients",
    initials: "AL",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
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

interface CardPosition {
  align: string;
  offset: string;
  rotate: string;
  mt: string;
  z: string;
}

// Single-column layout (mobile/tablet)
const mobilePositions: CardPosition[] = [
  { align: "self-start", offset: "ml-2", rotate: "-rotate-2", mt: "",      z: "z-[1]" },
  { align: "self-end",   offset: "mr-4", rotate: "rotate-3",  mt: "-mt-8", z: "z-[2]" },
  { align: "self-start", offset: "ml-8", rotate: "rotate-1",  mt: "-mt-5", z: "z-[3]" },
  { align: "self-end",   offset: "mr-1", rotate: "-rotate-2", mt: "-mt-6", z: "z-[4]" },
  { align: "self-start", offset: "ml-4", rotate: "-rotate-1", mt: "-mt-4", z: "z-[5]" },
  { align: "self-end",   offset: "mr-6", rotate: "rotate-2",  mt: "-mt-5", z: "z-[6]" },
];

// Desktop left column (cards 0–2) — wider spread within each half
const leftColPositions: CardPosition[] = [
  { align: "self-start", offset: "ml-8",  rotate: "-rotate-2", mt: "",      z: "z-[1]" },
  { align: "self-end",   offset: "mr-10", rotate: "rotate-3",  mt: "-mt-8", z: "z-[2]" },
  { align: "self-start", offset: "ml-12", rotate: "rotate-1",  mt: "-mt-6", z: "z-[3]" },
];

// Desktop right column (cards 3–5)
const rightColPositions: CardPosition[] = [
  { align: "self-end",   offset: "mr-8",  rotate: "-rotate-2", mt: "",      z: "z-[1]" },
  { align: "self-start", offset: "ml-10", rotate: "-rotate-1", mt: "-mt-8", z: "z-[2]" },
  { align: "self-end",   offset: "mr-12", rotate: "rotate-2",  mt: "-mt-6", z: "z-[3]" },
];

function StarRating({ className }: { className?: string }) {
  return (
    <div className={twMerge(clsx("flex gap-0.5", className))}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} fill="currentColor" className="w-4 h-4 text-accent" />
      ))}
    </div>
  );
}

interface ScatteredCardProps {
  t: TestimonialData;
  pos: CardPosition;
  className?: string;
}

function ScatteredCard({ t, pos, className }: ScatteredCardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "relative",
          pos.align,
          pos.offset,
          pos.mt,
          pos.z,
          pos.rotate,
          className
        )
      )}
    >
      <div className="absolute inset-0 rounded-2xl border border-foreground/10 shadow-card bg-white" />
      <div className="relative p-4 lg:p-6">
        <StarRating className="mb-3" />
        <span className="font-serif text-4xl leading-none text-foreground/15 select-none block -mb-2">
          &ldquo;
        </span>
        <p className="font-serif italic text-sm sm:text-base lg:text-lg leading-relaxed text-foreground text-pretty">
          {t.quote}
        </p>
        <div className="mt-4 pt-4 border-t border-foreground/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-full overflow-hidden shrink-0">
              <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-display font-bold text-sm lg:text-base text-foreground/80 leading-tight">
                {t.name}
              </p>
              <p className="font-sans text-xs lg:text-sm text-foreground/50">
                {t.descriptor}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const outerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const isMobile = window.innerWidth < 1024;

      gsap.from(".testimonials-heading", {
        scrollTrigger: {
          trigger: "#testimonials",
          start: "top 85%",
          once: true,
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      if (isMobile) {
        gsap.from(".mobile-card-wrapper", {
          scrollTrigger: {
            trigger: ".mobile-cards-container",
            start: "top 80%",
            once: true,
          },
          y: 30,
          opacity: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
        });
      } else {
        gsap.from(".desktop-col", {
          scrollTrigger: {
            trigger: ".desktop-cards-container",
            start: "top 75%",
            once: true,
          },
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
        });
      }

      gsap.from(".stat-item", {
        scrollTrigger: {
          trigger: ".stats-grid",
          start: "top 90%",
          once: true,
        },
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
      });

      outerRef.current
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
    { scope: outerRef }
  );

  return (
    <div ref={outerRef} id="testimonials">
      <SectionWrapper>
        {/* Heading */}
        <div className="testimonials-heading text-center mb-10 lg:mb-16">
          <p className="font-jost text-xs tracking-[0.2em] font-bold uppercase text-primary/50 mb-4">
            Client Testimonials
          </p>
          <h2 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl text-foreground text-balance">
            Don&apos;t take our word for it. See what{" "}
            <HandDrawnUnderline variant={1}>customers</HandDrawnUnderline> are
            saying about us.
          </h2>
        </div>

        {/* Mobile / tablet: single-column scattered pile */}
        <div className="mobile-cards-container flex flex-col px-2 lg:hidden">
          {testimonials.map((t, i) => (
            <ScatteredCard
              key={i}
              t={t}
              pos={mobilePositions[i]}
              className="mobile-card-wrapper w-[72%] max-w-[17rem] md:w-[44%] md:max-w-none"
            />
          ))}
        </div>

        {/* Desktop: two scattered columns */}
        <div className="desktop-cards-container hidden lg:flex lg:gap-8 xl:gap-12 lg:items-start">
          <div className="desktop-col flex flex-col flex-1">
            {testimonials.slice(0, 3).map((t, i) => (
              <ScatteredCard
                key={i}
                t={t}
                pos={leftColPositions[i]}
                className="w-[75%]"
              />
            ))}
          </div>
          <div className="desktop-col flex flex-col flex-1 mt-16">
            {testimonials.slice(3, 6).map((t, i) => (
              <ScatteredCard
                key={i}
                t={t}
                pos={rightColPositions[i]}
                className="w-[75%]"
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 lg:mt-20 lg:pt-16 lg:border-t lg:border-foreground/10">
          {stats.map((s, i) => (
            <div key={i} className="stat-item p-4 text-center">
              <p className="font-display font-bold text-2xl lg:text-3xl xl:text-4xl text-primary">
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
              <p className="font-sans text-sm text-foreground/60 mt-1 block mx-auto max-w-[150px]">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </SectionWrapper>
    </div>
  );
}

