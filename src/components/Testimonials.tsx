"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { Star } from "lucide-react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";

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
      "I was blown away… the guests couldn’t stop talking about the cello. I will recommend Luke any time to anyone. Bless him and his talent as he continues to live his gift out at other venues 🙏",
    name: "Violet Gordon",
    descriptor: "Kirstenhof SAPS",
    initials: "VG",
    image: "/images/testimonials/violet-gordon.jpeg",
  },
  {
    quote:
      "You are so talented, Luke! I come from a family of musicians, and have never heard the cello played the way you play it. Will definitely be using you in the future",
    name: "Louise Hill",
    descriptor: "Event Manager",
    initials: "LH",
    image: "/images/testimonials/louise-hill.jpeg",
  },
  {
    quote:
      "A friend of mine recommended Luke for a celebration for our faculty, and I could not be happier. His performance was lively, captivating, and absolutely wowed the attendees.",
    name: "Organiser",
    descriptor: "University of Stellenbosch",
    initials: "US",
    image: "/images/testimonials/organiser-stellenbosch.jpeg",
  },
  {
    quote:
      "We met Luke at Cavendish and hired him for our wedding in April. He went above and beyond with including all of our favourite songs in his setlist. It was truly special - thank you Luke!",
    name: "Sophie & Bart",
    descriptor: "Wedding in Franschhoek",
    initials: "SB",
    image: "/images/testimonials/sophie-and-bart.jpeg",
  },
  {
    quote:
      "We had a very sentimental farewell for our COO, and Luke’s cello playing made for a more special night than I could've hoped for.",

    name: "Marcus Reed",
    descriptor: "Hotel Client",
    initials: "MR",
    image: "/images/testimonials/marcus-reed.jpeg",
  },
  {
    quote:
      "From our first interaction, working with Luke was effortless and professional. He handled our requests and mitigated a lot of the stress from planning our wedding.",
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
  { value: "6,500", label: "Hours of playtime", countUp: true, numericEnd: 6500, suffix: "" },
];

interface CardPosition {
  align: string;
  offset: string;
  rotate: string;
  mt: string;
  z: string;
}

// Single-column layout (< md); sm offsets ~15% tighter than base
const mobilePositions: CardPosition[] = [
  {
    align: "self-start",
    offset: "ml-2 sm:ml-1.5",
    rotate: "-rotate-2",
    mt: "",
    z: "z-[6]",
  },
  {
    align: "self-end",
    offset: "mr-4 sm:mr-3.5",
    rotate: "rotate-3",
    mt: "-mt-8",
    z: "z-[5]",
  },
  {
    align: "self-start",
    offset: "ml-8 sm:ml-7",
    rotate: "rotate-1",
    mt: "-mt-5",
    z: "z-[4]",
  },
  {
    align: "self-end",
    offset: "mr-1 sm:mr-0.5",
    rotate: "-rotate-2",
    mt: "-mt-6",
    z: "z-[3]",
  },
  {
    align: "self-start",
    offset: "ml-4 sm:ml-3.5",
    rotate: "-rotate-1",
    mt: "-mt-4",
    z: "z-[2]",
  },
  {
    align: "self-end",
    offset: "mr-6 sm:mr-5",
    rotate: "rotate-2",
    mt: "-mt-5",
    z: "z-[1]",
  },
];

// Two-column layout (md+); tighter offsets on md, full spread at lg
const leftColPositions: CardPosition[] = [
  {
    align: "self-start",
    offset: "ml-2 md:ml-4 lg:ml-8",
    rotate: "-rotate-2",
    mt: "",
    z: "z-[3]",
  },
  {
    align: "self-end",
    offset: "mr-4 md:mr-6 lg:mr-10",
    rotate: "rotate-3",
    mt: "-mt-8 md:-mt-[1.67rem] lg:-mt-8",
    z: "z-[2]",
  },
  {
    align: "self-start",
    offset: "ml-4 md:ml-6 lg:ml-12",
    rotate: "rotate-1",
    mt: "-mt-6 md:-mt-5 lg:-mt-6",
    z: "z-[1]",
  },
];

const rightColPositions: CardPosition[] = [
  {
    align: "self-end",
    offset: "mr-2 md:mr-4 lg:mr-8",
    rotate: "-rotate-2",
    mt: "",
    z: "z-[3]",
  },
  {
    align: "self-start",
    offset: "ml-4 md:ml-6 lg:ml-10",
    rotate: "-rotate-1",
    mt: "-mt-8 md:-mt-[1.67rem] lg:-mt-8",
    z: "z-[2]",
  },
  {
    align: "self-end",
    offset: "mr-4 md:mr-6 lg:mr-12",
    rotate: "rotate-2",
    mt: "-mt-6 md:-mt-5 lg:-mt-6",
    z: "z-[1]",
  },
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
      data-tilt={pos.rotate.trim().startsWith("-") ? "-1" : "1"}
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
      <div className="absolute inset-0 rounded-card border border-foreground/10 shadow-card bg-background" />
      <div className="relative p-4 md:p-5 lg:p-6">
        <StarRating className="mb-3" />
        <span className="font-serif text-4xl leading-none text-foreground/15 select-none block -mb-2">
          &ldquo;
        </span>
        <p className="font-sans text-sm sm:text-base lg:text-lg leading-relaxed text-foreground text-pretty">
          {t.quote}
        </p>
        <div className="mt-4 pt-4 border-t border-foreground/10">
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 lg:w-9 lg:h-9 rounded-full overflow-hidden shrink-0">
              <Image
                src={t.image}
                alt={t.name}
                width={36}
                height={36}
                sizes="36px"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="font-display font-bold text-sm lg:text-base text-foreground/80 leading-tight">
                {t.name}
              </p>
              <p className="font-sans text-xs lg:text-sm text-foreground/70">
                {t.descriptor}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Signed direction (±1) a card leans in at rest, read from its CSS rotate class. */
function tiltOf(el: HTMLElement): number {
  return el.dataset.tilt === "-1" ? -1 : 1;
}

export function Testimonials() {
  const outerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const stage = outerRef.current;
      if (!stage) return;
      const track = stage.querySelector<HTMLElement>(".reel-track");
      const heading = stage.querySelector<HTMLElement>(".testimonials-heading");
      const statsGrid = stage.querySelector<HTMLElement>(".stats-grid");
      if (!track || !heading || !statsGrid) return;

      const statItems = gsap.utils.toArray<HTMLElement>(".stat-item", stage);

      const formatCount = (value: number, suffix: string) =>
        (value >= 1000 ? value.toLocaleString() : String(value)) + suffix;

      const counterTargets = gsap.utils
        .toArray<HTMLSpanElement>(".stat-counter", stage)
        .map((el) => ({
          el,
          end: parseInt((el.dataset.end || "0").replace(/,/g, ""), 10),
          suffix: el.dataset.suffix || "",
        }))
        .filter(({ end }) => end > 0);

      const mm = gsap.matchMedia();

      mm.add(
        {
          isMobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
          isTablet:
            "(min-width: 768px) and (max-width: 1023px) and (prefers-reduced-motion: no-preference)",
          isDesktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { isMobile, isTablet, isDesktop, reduceMotion } =
            context.conditions as {
              isMobile: boolean;
              isTablet: boolean;
              isDesktop: boolean;
              reduceMotion: boolean;
            };

          if (reduceMotion) {
            // Content is made fully visible by the .gsap-reveal reduced-motion
            // CSS override; counters just show their final values immediately.
            counterTargets.forEach(({ el, end, suffix }) => {
              el.textContent = formatCount(end, suffix);
            });
            return;
          }

          gsap.fromTo(
            heading,
            { y: 30, opacity: 0 },
            {
              scrollTrigger: { trigger: stage, start: "top 85%", once: true },
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power3.out",
            }
          );

          if (isDesktop) {
            // ---- Pinned proof reel (lg+) -------------------------------
            // The stage becomes a 100dvh window onto the taller reel track;
            // a scrubbed timeline deals the cards onto the table one beat at
            // a time while the "camera" pans down, finishing on the stats.
            gsap.set(stage, { height: "100dvh", overflow: "hidden" });

            const leftCards = gsap.utils.toArray<HTMLElement>(
              ".reel-col-left .reel-card",
              stage
            );
            const rightCards = gsap.utils.toArray<HTMLElement>(
              ".reel-col-right .reel-card",
              stage
            );
            const deck: HTMLElement[] = [];
            for (
              let i = 0;
              i < Math.max(leftCards.length, rightCards.length);
              i++
            ) {
              if (leftCards[i]) deck.push(leftCards[i]);
              if (rightCards[i]) deck.push(rightCards[i]);
            }

            const TOTAL = 7.8;
            const tl = gsap.timeline({
              defaults: { ease: "power3.out" },
              scrollTrigger: {
                trigger: stage,
                start: "top top",
                end: "+=220%",
                pin: true,
                scrub: 0.85,
                anticipatePin: 1,
                invalidateOnRefresh: true,
              },
            });

            // Camera pan across the full reel, linear so the scrub smoothing
            // and per-beat easing carry all the character.
            tl.to(
              track,
              {
                y: () => -Math.max(0, track.offsetHeight - window.innerHeight),
                duration: TOTAL,
                ease: "none",
              },
              0
            );

            // One card per scroll beat, dealt left/right alternately, each
            // over-rotating in the direction it finally leans.
            deck.forEach((card, i) => {
              tl.fromTo(
                card,
                {
                  y: () => window.innerHeight * 0.5,
                  rotation: tiltOf(card) * 8,
                  opacity: 0,
                },
                { y: 0, rotation: 0, opacity: 1, duration: 1.05 },
                0.2 + i * 0.9
              );
            });

            // Finale beat: stats row reveals and the numbers run.
            tl.fromTo(
              statItems,
              { y: 36, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.8, stagger: 0.15 },
              6.0
            );
            counterTargets.forEach(({ el, end, suffix }) => {
              const proxy = { val: 0 };
              tl.to(
                proxy,
                {
                  val: end,
                  duration: 1.4,
                  ease: "power1.out",
                  onUpdate() {
                    el.textContent = formatCount(Math.round(proxy.val), suffix);
                  },
                },
                6.2
              );
            });

            return;
          }

          if (isMobile || isTablet) {
            // ---- Simple staggered deal-in (< lg) -----------------------
            const cards = gsap.utils.toArray<HTMLElement>(
              isMobile ? ".mobile-card-wrapper" : ".reel-card",
              stage
            );
            cards.forEach((card) => {
              gsap.fromTo(
                card,
                { y: 56, rotation: tiltOf(card) * 6, opacity: 0 },
                {
                  scrollTrigger: { trigger: card, start: "top 88%", once: true },
                  y: 0,
                  rotation: 0,
                  opacity: 1,
                  duration: 0.9,
                  ease: "power4.out",
                }
              );
            });

            gsap.fromTo(
              statItems,
              { y: 20, opacity: 0 },
              {
                scrollTrigger: { trigger: statsGrid, start: "top 90%", once: true },
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.12,
                ease: "power3.out",
              }
            );

            counterTargets.forEach(({ el, end, suffix }) => {
              const proxy = { val: 0 };
              gsap.to(proxy, {
                val: end,
                duration: 2,
                ease: "power1.out",
                scrollTrigger: { trigger: el, start: "top 90%", once: true },
                onUpdate() {
                  el.textContent = formatCount(Math.round(proxy.val), suffix);
                },
              });
            });
          }
        }
      );

      // Web fonts change card heights, which changes the pan distance and
      // pin positions — re-measure once they settle.
      if (typeof document !== "undefined" && document.fonts?.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
    },
    { scope: outerRef }
  );

  return (
    <div
      ref={outerRef}
      id="testimonials"
      className="relative isolate bg-cream before:absolute before:inset-y-0 before:left-1/2 before:-z-10 before:w-screen before:-translate-x-1/2 before:bg-cream"
    >
      <div className="reel-track">
        <SectionWrapper surface="cream">
          {/* Heading */}
          <div className="testimonials-heading gsap-reveal text-center mb-10 lg:mb-16">
            <p className="relative mb-4 inline-block pl-4 font-jost text-sm font-semibold uppercase tracking-widest text-foreground/70 before:absolute before:left-0 before:top-1/2 before:h-[6px] before:w-[6px] before:-translate-y-1/2 before:rounded-full before:bg-accent">
              In their words
            </p>
            <h2 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl text-foreground text-balance">
              Don&apos;t take{" "}
              <HandDrawnUnderline variant={1} underlineClassName="text-accent">
                my word
              </HandDrawnUnderline>{" "}
              for it
            </h2>
          </div>

          {/* Mobile: single-column scattered pile */}
          <div className="mobile-cards-container flex flex-col px-2 sm:mx-auto sm:w-[85%] md:hidden">
            {testimonials.map((t, i) => (
              <ScatteredCard
                key={i}
                t={t}
                pos={mobilePositions[i]}
                className="mobile-card-wrapper gsap-reveal w-[72%] max-w-[17rem]"
              />
            ))}
          </div>

          {/* Tablet / desktop: two scattered columns */}
          <div className="desktop-cards-container hidden md:flex md:items-start md:gap-6 lg:gap-8 xl:gap-12">
            <div className="reel-col-left flex flex-col flex-1">
              {testimonials.slice(0, 3).map((t, i) => (
                <ScatteredCard
                  key={i}
                  t={t}
                  pos={leftColPositions[i]}
                  className="reel-card gsap-reveal md:w-[81%] lg:w-[75%]"
                />
              ))}
            </div>
            <div className="reel-col-right flex flex-col flex-1 md:mt-12 lg:mt-16">
              {testimonials.slice(3, 6).map((t, i) => (
                <ScatteredCard
                  key={i}
                  t={t}
                  pos={rightColPositions[i]}
                  className="reel-card gsap-reveal md:w-[81%] lg:w-[75%]"
                />
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 lg:mt-20 lg:pt-16 lg:border-t lg:border-foreground/10">
            {stats.map((s, i) => (
              <div key={i} className="stat-item gsap-reveal p-4 text-center">
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
    </div>
  );
}
