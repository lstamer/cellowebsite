"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface StatData {
  value: string;
  label: string;
  countUp: boolean;
  numericEnd: number;
  suffix: string;
}

const stats: StatData[] = [
  { value: "80+", label: "Weddings & events played", countUp: true, numericEnd: 80, suffix: "+" },
  { value: "ATCL", label: "Qualified", countUp: false, numericEnd: 0, suffix: "" },
  { value: "0", label: "Negative reviews... ever", countUp: false, numericEnd: 0, suffix: "" },
  { value: "12+", label: "Years of experience", countUp: true, numericEnd: 12, suffix: "+" },
];

export function WeddingStatsCtaBanner() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cta = containerRef.current?.querySelector<HTMLElement>(".wedding-banner-cta");
      if (cta) {
        gsap.fromTo(
          cta,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: cta,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

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
    <div
      ref={containerRef}
      id="weddings-availability"
      className="bg-surface-dark relative overflow-hidden border-y border-primary/10 py-20 md:py-24"
    >
      <div className="absolute -top-1/2 -right-[10%] w-[60%] h-[200%] bg-primary/10 rounded-full blur-3xl pointer-events-none opacity-50" />

      <SectionWrapper maxWidth="max-w-6xl" className="py-0 md:py-0">
        <div className="relative z-10 flex flex-col">
          <div className="wedding-banner-cta text-center mb-16 max-w-2xl mx-auto">
            <p className="font-serif italic text-3xl md:text-4xl text-background mb-8 text-balance">
              Ready to talk about the music for your day?
            </p>
            <Button href="/book" variant="primary" size="lg">
              Check availability
            </Button>
          </div>

          <div className="wedding-banner-stats-grid grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-background/10 text-center">
            {stats.map((s, i) => (
              <div key={i} className="wedding-banner-stat text-center px-4">
                <p className="font-display font-bold text-3xl xl:text-4xl text-background mb-2">
                  {s.countUp ? (
                    <span className="stat-counter" data-end={s.numericEnd} data-suffix={s.suffix}>
                      0{s.suffix}
                    </span>
                  ) : (
                    s.value
                  )}
                </p>
                <p className="font-sans text-sm text-background/60 leading-tight block mx-auto max-w-[150px]">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}
