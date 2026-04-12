"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Star } from "lucide-react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Stat {
  value: string;
  label: string;
  countUp: boolean;
  numericEnd: number;
  suffix: string;
}

const stats: Stat[] = [
  { value: "80+", label: "weddings performed", countUp: true, numericEnd: 80, suffix: "+" },
  { value: "12+", label: "years experience", countUp: true, numericEnd: 12, suffix: "+" },
  { value: "ATCL", label: "Trinity College London diploma", countUp: false, numericEnd: 0, suffix: "" },
];

function StarRow() {
  return (
    <div className="flex gap-1 justify-center" aria-label="5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} fill="currentColor" className="w-4 h-4 text-accent" />
      ))}
    </div>
  );
}

export function WeddingTestimonials() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Hero quote reveal
      gsap.fromTo(
        ".hero-quote-mark",
        { scale: 0.5, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "elastic.out(1, 0.6)",
          scrollTrigger: {
            trigger: ".hero-quote-mark",
            start: "top 85%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".hero-quote-text",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".hero-quote-text",
            start: "top 80%",
            once: true,
          },
        }
      );

      // Supporting quotes
      gsap.fromTo(
        ".support-quote-left",
        { x: -30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".support-quotes",
            start: "top 82%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".support-quote-right",
        { x: 30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".support-quotes",
            start: "top 82%",
            once: true,
          },
        }
      );

      // Stats
      gsap.fromTo(
        ".test-stat",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".test-stats-row",
            start: "top 88%",
            once: true,
          },
        }
      );

      // Stat count-up
      containerRef.current
        ?.querySelectorAll<HTMLSpanElement>(".test-stat-counter")
        .forEach((el) => {
          const end = parseInt(el.dataset.end ?? "0", 10);
          const suffix = el.dataset.suffix ?? "";
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
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} id="testimonials" className="w-full bg-background">
      <SectionWrapper maxWidth="max-w-5xl">
        <SectionHeader
          label="Real couples"
          heading="In their words"
          alignment="center"
        />

        {/* Hero pull quote */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <div
            className="hero-quote-mark font-serif text-8xl text-accent/25 leading-none select-none mb-4"
            aria-hidden
          >
            &ldquo;
          </div>
          <StarRow />
          <blockquote className="hero-quote-text mt-6">
            <p className="font-serif italic text-3xl md:text-4xl lg:text-[2.6rem] text-primary leading-snug text-balance">
              The music transformed our ceremony into something out of a film.
              Our guests told us it was the single thing that made the day feel real.
            </p>
            <footer className="mt-8">
              <p className="font-display font-bold text-base text-foreground">Elena &amp; James</p>
              <p className="font-mono text-xs tracking-wider text-foreground/40 mt-1 uppercase">
                Wedding clients
              </p>
            </footer>
          </blockquote>
        </div>

        {/* Supporting quotes */}
        <div className="support-quotes grid grid-cols-1 md:grid-cols-2 gap-10 mt-20">
          <blockquote className="support-quote-left border-l-2 border-accent pl-8">
            <StarRow />
            <p className="font-sans text-lg text-foreground/70 italic leading-relaxed mt-4 text-pretty">
              &ldquo;From the first email to the last note, everything was handled. We didn&apos;t
              think about the music once on the day — and that&apos;s the highest compliment.&rdquo;
            </p>
            <footer className="mt-5">
              <p className="font-display font-semibold text-sm text-foreground">Thomas &amp; Claire</p>
              <p className="font-mono text-[0.65rem] tracking-wider text-foreground/40 uppercase mt-0.5">
                Wedding clients
              </p>
            </footer>
          </blockquote>

          <blockquote className="support-quote-right border-l-2 border-accent pl-8">
            <StarRow />
            <p className="font-sans text-lg text-foreground/70 italic leading-relaxed mt-4 text-pretty">
              &ldquo;He learned our song in three days and played it more beautifully than the
              original. I cried. My husband cried. Everyone cried.&rdquo;
            </p>
            <footer className="mt-5">
              <p className="font-display font-semibold text-sm text-foreground">Amara &amp; Liam</p>
              <p className="font-mono text-[0.65rem] tracking-wider text-foreground/40 uppercase mt-0.5">
                Wedding clients
              </p>
            </footer>
          </blockquote>
        </div>

        {/* Stats row */}
        <div className="test-stats-row grid grid-cols-3 gap-8 mt-20 pt-16 border-t border-foreground/10">
          {stats.map((s, i) => (
            <div key={i} className="test-stat text-center px-2">
              <p className="font-display font-bold text-3xl xl:text-4xl text-primary mb-2">
                {s.countUp ? (
                  <span
                    className="test-stat-counter"
                    data-end={s.numericEnd}
                    data-suffix={s.suffix}
                  >
                    {s.value}
                  </span>
                ) : (
                  s.value
                )}
              </p>
              <p className="font-sans text-sm text-foreground/60 leading-tight block mx-auto max-w-[130px]">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </SectionWrapper>
    </div>
  );
}
