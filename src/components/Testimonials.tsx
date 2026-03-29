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

const mobilePositions = [
  { align: "self-start", offset: "ml-2", rotate: "-rotate-2", mt: "", z: "z-[1]", bg: "bg-primary/10" },
  { align: "self-end", offset: "mr-4", rotate: "rotate-3", mt: "-mt-8", z: "z-[2]", bg: "bg-accent/10" },
  { align: "self-start", offset: "ml-8", rotate: "rotate-1", mt: "-mt-5", z: "z-[3]", bg: "bg-primary/5" },
  { align: "self-end", offset: "mr-1", rotate: "-rotate-2", mt: "-mt-6", z: "z-[4]", bg: "bg-accent/15" },
  { align: "self-start", offset: "ml-4", rotate: "-rotate-1", mt: "-mt-4", z: "z-[5]", bg: "bg-primary/10" },
  { align: "self-end", offset: "mr-6", rotate: "rotate-2", mt: "-mt-5", z: "z-[6]", bg: "bg-accent/10" },
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

export function Testimonials() {
  const outerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // ── Mobile animations ──────────────────────────────────────────
      const isMobile = window.innerWidth < 1024;
      
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

      gsap.utils.toArray(".mobile-card-wrapper").forEach((card: any) => {
        gsap.fromTo(
          card,
          { opacity: 1, filter: "blur(0px)" },
          {
            opacity: 0.2,
            filter: "blur(8px)",
            scrollTrigger: {
              trigger: card,
              start: "bottom 20%",
              end: "bottom 0%",
              scrub: true,
            },
          }
        );
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

      // ── Desktop animations ──────────────────────────────────────────
      if (!isMobile) {
        gsap.from(".desktop-col", {
          scrollTrigger: {
            trigger: ".desktop-cards-grid",
            start: "top 80%",
            once: true,
          },
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
        });

        gsap.from(".desktop-stat", {
          scrollTrigger: {
            trigger: ".desktop-stats-grid",
            start: "top 85%",
            once: true,
          },
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
        });
      }

      // ── Stat count-up ────────────────────────────────────
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
                el.textContent = (displayVal >= 1000 ? displayVal.toLocaleString() : displayVal) + suffix;
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
                    "mobile-card-wrapper",
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
                      "absolute inset-0 rounded-2xl border border-foreground/10 shadow-card backdrop-blur-md",
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
                      <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0">
                        <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
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
              className="mobile-stat p-4 text-center"
            >
              <p className="font-display font-bold text-2xl text-primary">
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
      </SectionWrapper>

      {/* ===== DESKTOP: 3-Column Grid + Stats ===== */}
      <div className="hidden lg:block w-full py-24 bg-background">
        <div className="max-w-6xl mx-auto px-12 xl:px-20">
          <div className="text-center mb-16">
            <p className="font-mono text-xs tracking-[0.2em] font-bold uppercase text-primary/50 mb-4">
              Trust building/authority  
            </p>
            <h2 className="font-serif italic text-4xl sm:text-5xl text-foreground text-balance">
              Don&apos;t take our word for it. See what <span className="relative inline-block"><span className="relative z-10 text-primary">customers</span><span className="absolute bottom-1 left-0 w-full h-1 bg-accent/40 rounded-full" /></span> are saying about us.
            </h2>
          </div>

          <div className="desktop-cards-grid grid grid-cols-3 gap-6 xl:gap-8 items-start">
            {[0, 1, 2].map(colIndex => (
              <div 
                key={colIndex} 
                className={twMerge(
                  clsx(
                    "desktop-col flex flex-col gap-6 xl:gap-8", 
                    colIndex === 1 ? "mt-0" : "mt-12"
                  )
                )}
              >
                {testimonials.filter((_, i) => i % 3 === colIndex).map((t, i) => (
                  <div key={i} className="desktop-card bg-white rounded-2xl p-8 border border-foreground/5 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                    <StarRating className="mb-6" />
                    <p className="font-sans text-[0.95rem] leading-relaxed text-foreground/80 mb-6 font-medium">
                      &quot;{t.quote}&quot;
                    </p>
                    <div className="flex items-center gap-4">
                      <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover shrink-0 bg-primary/10" />
                      <div>
                        <p className="font-display font-bold text-sm text-foreground leading-tight">
                          {t.name}
                        </p>
                        <p className="font-sans text-xs text-foreground/50 mt-0.5">
                          {t.descriptor}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="desktop-stats-grid grid grid-cols-4 gap-4 mt-20 pt-16 border-t border-foreground/10">
            {stats.map((s, i) => (
              <div key={i} className="desktop-stat text-center px-4">
                <p className="font-display font-bold text-3xl xl:text-4xl text-primary mb-2">
                  {s.countUp ? (
                    <span 
                      className="stat-counter" 
                      data-end={s.numericEnd} 
                      data-suffix={s.suffix}
                    >
                      0{s.suffix}
                    </span>
                  ) : s.value}
                </p>
                <p className="font-sans text-sm text-foreground/60 leading-tight block mx-auto max-w-[150px]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
