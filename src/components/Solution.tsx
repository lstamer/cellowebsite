"use client";

import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const steps = [
  {
    title: "Confirm availability",
    desc: "Check my availability for your date and share a few details about your event. I'll get back to you promptly.",
    icon: "/images/process/calendar-icon.png",
    alt: "Hand-drawn calendar icon",
  },
  {
    title: "We discuss your event",
    desc: "We'll talk through your vision, music preferences and key moments to create a personalised plan.",
    icon: "/images/process/conversation-icon.png",
    alt: "Hand-drawn conversation icon",
  },
  {
    title: "Enjoy the event",
    desc: "Sit back and enjoy the atmosphere. I'll take care of the music and help make your day truly unforgettable.",
    icon: "/images/process/music-icon.png",
    alt: "Hand-drawn music icon",
  },
];

export function Solution() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const animateBlocks = (selector: string) => {
        gsap.fromTo(
          selector,
          { y: 30, opacity: 0 },
          {
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 70%",
              once: true,
            },
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.14,
            ease: "power3.out",
          }
        );
      };

      const media = gsap.matchMedia();

      media.add("(min-width: 768px)", () => animateBlocks(".solution-desktop-block"));
      media.add("(max-width: 767px)", () => animateBlocks(".solution-mobile-block"));

      return () => media.revert();
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper ref={containerRef} className="bg-background relative" id="process" maxWidth="max-w-none">
      <SectionHeader
        label="How it works"
        heading={
          <>
            Let&apos;s make something{" "}
            <span className="relative inline-block">
              beautiful
              <svg
                aria-hidden
                className="pointer-events-none absolute left-[-3%] right-[-3%] top-full mt-[0.04em] h-[0.26em] w-[106%] text-accent"
                viewBox="0 0 120 14"
                preserveAspectRatio="none"
              >
                <path
                  d="M 1.5 8.2 C 14 5.8, 26 10.2, 40 7.4 S 64 5.6, 78 8.6 S 100 5.4, 118.5 7.8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            .
          </>
        }
      />

      <div className="mx-auto max-w-6xl">
        <div className="relative mb-14 hidden grid-cols-3 items-center md:grid">
          <svg
            aria-hidden
            className="pointer-events-none absolute left-[25%] top-1/2 z-0 h-[3.5rem] w-[18%] -translate-y-1/2 text-accent"
            viewBox="0 0 120 24"
            preserveAspectRatio="none"
          >
            <path
              d="M 2 13 C 21 8, 42 15, 60 12 C 78 9, 97 15, 118 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <svg
            aria-hidden
            className="pointer-events-none absolute left-[57%] top-1/2 z-0 h-[3.5rem] w-[18%] -translate-y-1/2 text-accent"
            viewBox="0 0 120 24"
            preserveAspectRatio="none"
          >
            <path
              d="M 2 12 C 20 16, 40 9, 60 12 C 80 15, 99 8, 118 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {steps.map((step) => (
            <div key={step.title} className="solution-desktop-block relative z-10 flex justify-center">
              <Image
                src={step.icon}
                alt={step.alt}
                width={640}
                height={640}
                className="h-auto w-[12.375rem] lg:w-[14.125rem]"
                sizes="(min-width: 1024px) 226px, 198px"
              />
            </div>
          ))}
        </div>

        <div className="hidden grid-cols-3 md:grid">
          {steps.map((step) => (
            <article
              key={step.title}
              className="solution-desktop-block border-primary/10 px-8 text-center md:border-l md:first:border-l-0 lg:px-12"
            >
              <h3 className="mx-auto mb-6 max-w-[13rem] font-display text-[1.55rem] font-bold leading-[1.08] tracking-[-0.03em] text-primary text-balance">
                {step.title}
              </h3>
              <p className="mx-auto max-w-[15rem] font-sans text-[1.0625rem] leading-[1.85] text-foreground/70 text-pretty">
                {step.desc}
              </p>
            </article>
          ))}
        </div>

        <div className="relative mx-auto max-w-xl space-y-10 md:hidden">
          <svg
            aria-hidden
            className="pointer-events-none absolute bottom-[4rem] left-[3.5rem] top-[4rem] z-0 w-[1.5rem] text-accent"
            viewBox="0 0 24 320"
            preserveAspectRatio="none"
          >
            <path
              d="M 12 4 C 10 48, 15 92, 12 136 C 9 178, 15 218, 12 260 C 10 286, 14 304, 12 316"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {steps.map((step) => (
            <article
              key={step.title}
              className="solution-mobile-block relative z-10 grid grid-cols-[8rem_1fr] items-start gap-4"
            >
              <Image
                src={step.icon}
                alt={step.alt}
                width={640}
                height={640}
                className="h-auto w-full"
                sizes="128px"
              />
              <div>
                <h3 className="mb-3 font-display text-[1.35rem] font-bold leading-[1.08] tracking-[-0.03em] text-primary text-balance">
                  {step.title}
                </h3>
                <p className="font-sans text-base leading-relaxed text-foreground/70 text-pretty">
                  {step.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
