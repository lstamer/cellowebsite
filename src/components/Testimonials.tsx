"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Star } from "lucide-react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface TestimonialData {
  quote: string;
  name: string;
  descriptor: string;
  initials: string;
}

const testimonials: TestimonialData[] = [
  {
    quote:
      "The music transformed our ceremony into something out of a film. It was the exact atmosphere we dreamed of.",
    name: "Elena & James",
    descriptor: "Wedding Clients",
    initials: "EJ",
  },
  {
    quote:
      "Stamer\u2019s performance at our gala was captivating. Every guest was spellbound from the first note.",
    name: "Victoria Chen",
    descriptor: "Event Director",
    initials: "VC",
  },
  {
    quote:
      "He brought such warmth and elegance to my mother\u2019s memorial. The music said what words couldn\u2019t.",
    name: "David Osei",
    descriptor: "Private Client",
    initials: "DO",
  },
  {
    quote:
      "We\u2019ve booked Stamer for three consecutive years. His professionalism and artistry are unmatched.",
    name: "Sarah Mitchell",
    descriptor: "Corporate Planner",
    initials: "SM",
  },
  {
    quote:
      "The cello added a layer of sophistication to our product launch that no other instrument could have.",
    name: "Marcus Reed",
    descriptor: "Brand Director",
    initials: "MR",
  },
  {
    quote:
      "From the first consultation to the final bow, working with Stamer was effortless and extraordinary.",
    name: "Amara & Liam",
    descriptor: "Wedding Clients",
    initials: "AL",
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
  { value: "1200+", label: "Hours of playing", countUp: true, numericEnd: 1200, suffix: "+" },
  { value: "4x", label: "Competition winner", countUp: true, numericEnd: 4, suffix: "x" },
  { value: "ATCL", label: "Qualified", countUp: false, numericEnd: 0, suffix: "" },
  { value: "0", label: "Bad reviews\u2026 ever", countUp: false, numericEnd: 0, suffix: "" },
];

const mobilePositions = [
  { align: "self-start", offset: "ml-2", rotate: "-rotate-2", mt: "", z: "z-[2]", bg: "bg-primary/10" },
  { align: "self-end", offset: "mr-4", rotate: "rotate-3", mt: "-mt-8", z: "z-[3]", bg: "bg-accent/10" },
  { align: "self-start", offset: "ml-8", rotate: "rotate-1", mt: "-mt-5", z: "z-[1]", bg: "bg-primary/5" },
  { align: "self-end", offset: "mr-1", rotate: "-rotate-2", mt: "-mt-6", z: "z-[4]", bg: "bg-accent/15" },
  { align: "self-start", offset: "ml-4", rotate: "-rotate-1", mt: "-mt-4", z: "z-[2]", bg: "bg-primary/10" },
  { align: "self-end", offset: "mr-6", rotate: "rotate-2", mt: "-mt-5", z: "z-[5]", bg: "bg-accent/10" },
];

function StarRating({ className }: { className?: string }) {
  return (
    <div className={twMerge(clsx("flex gap-0.5", className))}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} fill="currentColor" className="w-3.5 h-3.5 text-accent" />
      ))}
    </div>
  );
}

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // ── Mobile animations ──────────────────────────────────────────
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

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".mobile-cards",
          start: "top 80%",
          once: true,
        },
      });

      testimonials.forEach((_, i) => {
        tl.fromTo(
          `.mq-${i}`,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
        );
        tl.fromTo(
          `.mc-${i}`,
          { opacity: 0 },
          { opacity: 1, duration: 0.45, ease: "power2.out" },
          "-=0.2"
        );
        tl.fromTo(
          `.md-${i}`,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
          "-=0.15"
        );
        if (i < testimonials.length - 1) {
          tl.addLabel(`gap-${i}`, "+=0.12");
        }
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

      // ── Desktop animations ─────────────────────────────────────────
      gsap.from(".desktop-header-el", {
        scrollTrigger: {
          trigger: ".desktop-testimonials",
          start: "top 80%",
          once: true,
        },
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
      });

      gsap.fromTo(
        ".desktop-card",
        { opacity: 0, y: 50 },
        {
          scrollTrigger: {
            trigger: ".desktop-grid",
            start: "top 85%",
            once: true,
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
        }
      );

      gsap.from(".desktop-stat", {
        scrollTrigger: {
          trigger: ".desktop-stats",
          start: "top 90%",
          once: true,
        },
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power3.out",
      });

      sectionRef.current
        ?.querySelectorAll<HTMLSpanElement>(".stat-counter")
        .forEach((el) => {
          const end = parseInt(el.dataset.end || "0", 10);
          const suffix = el.dataset.suffix || "";
          if (end > 0) {
            const proxy = { val: 0 };
            gsap.to(proxy, {
              val: end,
              duration: 2,
              ease: "power1.out",
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
              onUpdate() {
                el.textContent = Math.round(proxy.val) + suffix;
              },
            });
          }
        });
    },
    { scope: sectionRef }
  );

  return (
    <SectionWrapper id="testimonials" ref={sectionRef}>
      {/* ===== MOBILE ===== */}
      <div className="mobile-testimonials block lg:hidden">
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
                      "absolute inset-0 rounded-2xl border border-foreground/10 shadow-card",
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
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <span className="font-display text-[0.6rem] font-bold text-primary">
                          {t.initials}
                        </span>
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
              className="mobile-stat rounded-2xl border border-foreground/10 bg-primary/5 p-5 text-center"
            >
              <p className="font-display font-bold text-2xl text-primary">{s.value}</p>
              <p className="font-sans text-sm text-foreground/60 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== DESKTOP ===== */}
      <div className="desktop-testimonials hidden lg:block">
        <div className="mb-16">
          <div className="desktop-header-el">
            <SectionHeader
              label="Testimonials"
              heading="What our clients say"
              alignment="center"
              className="mb-4"
            />
          </div>
          <p className="desktop-header-el font-sans text-lg text-foreground/70 max-w-2xl mx-auto text-center">
            Every performance is a partnership. Here&apos;s what it&apos;s been
            like to work together.
          </p>
        </div>

        <div className="desktop-grid grid grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="desktop-card rounded-card border border-foreground/10 bg-background p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover flex flex-col"
            >
              <StarRating className="mb-4" />
              <p className="font-sans text-foreground/80 leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="border-t border-foreground/10 mt-6 pt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-display text-sm font-bold text-primary">
                    {t.initials}
                  </span>
                </div>
                <div>
                  <p className="font-display font-bold text-sm text-foreground">
                    {t.name}
                  </p>
                  <p className="font-sans text-xs text-foreground/50">
                    {t.descriptor}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="desktop-stats flex items-center justify-between mt-16 py-8 border-t border-b border-foreground/10">
          {stats.map((s, i) => (
            <div
              key={i}
              className={twMerge(
                clsx(
                  "desktop-stat flex-1 text-center",
                  i < stats.length - 1 && "border-r border-foreground/10"
                )
              )}
            >
              <p className="font-display font-bold text-3xl text-primary">
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
      </div>
    </SectionWrapper>
  );
}
