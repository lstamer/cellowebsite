"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Slot order is left → right; each slot keeps layout; images follow the fan shuffle. */
const ABOUT_PHOTOS = [
  {
    src: "/images/about/luke-orchestra.png",
    alt: "Luke Stamer soloing with a school orchestra",
    wrapperClassName:
      "-rotate-[10deg] translate-y-8 -mr-9 shrink-0 z-[1] sm:-mr-12 lg:-mr-14",
    frameClassName:
      "about-image relative w-[6rem] h-[7.8rem] overflow-hidden rounded-none shadow-card sm:w-[8.8rem] sm:h-[11.4rem] lg:w-[8.2rem] lg:h-[10.6rem] xl:w-[9.5rem] xl:h-[12.4rem]",
    imageClassName: "object-cover object-center grayscale-[15%] rounded-none",
    sizes: "(max-width: 768px) 20vw, 15vw",
  },
  {
    src: "/images/about/luke-stage-lights.png",
    alt: "Luke Stamer performing cello in a white shirt on a warmly lit stage",
    wrapperClassName:
      "-rotate-[5deg] translate-y-3 -mr-9 shrink-0 z-[2] sm:-mr-12 lg:-mr-14",
    frameClassName:
      "about-image relative w-[6.8rem] h-[8.9rem] overflow-hidden rounded-none shadow-card sm:w-[10rem] sm:h-[13rem] lg:w-[9.4rem] lg:h-[12rem] xl:w-[10.9rem] xl:h-[14.1rem]",
    imageClassName: "object-cover object-center grayscale-[15%] rounded-none",
    sizes: "(max-width: 768px) 25vw, 18vw",
  },
  {
    src: "/images/about/luke-event-lights.png",
    alt: "Luke Stamer performing cello beneath colourful Confluence event lights",
    wrapperClassName: "shrink-0 z-[4]",
    frameClassName:
      "about-image relative w-[8rem] h-[10.8rem] overflow-hidden rounded-none shadow-card sm:w-[12.4rem] sm:h-[16.4rem] lg:w-[11.8rem] lg:h-[15.4rem] xl:w-[13.7rem] xl:h-[18rem]",
    imageClassName: "object-cover object-center grayscale-[20%] rounded-none",
    sizes: "(max-width: 768px) 32vw, 22vw",
  },
  {
    src: "/images/about/luke-garden-cello.png",
    alt: "Luke Stamer playing cello outdoors in a white suit",
    wrapperClassName:
      "rotate-[5deg] translate-y-3 -ml-9 shrink-0 z-[2] sm:-ml-12 lg:-ml-14",
    frameClassName:
      "about-image relative w-[6.8rem] h-[8.9rem] overflow-hidden rounded-none shadow-card sm:w-[10rem] sm:h-[13rem] lg:w-[9.4rem] lg:h-[12rem] xl:w-[10.9rem] xl:h-[14.1rem]",
    imageClassName: "object-cover object-center grayscale-[20%] rounded-none",
    sizes: "(max-width: 768px) 25vw, 18vw",
  },
  {
    src: "/images/about/luke-mall-performance.png",
    alt: "Luke Stamer performing cello for an audience in a public venue",
    wrapperClassName:
      "rotate-[10deg] translate-y-8 -ml-9 shrink-0 z-[1] sm:-ml-12 lg:-ml-14",
    frameClassName:
      "about-image relative w-[6rem] h-[7.8rem] overflow-hidden rounded-none shadow-card sm:w-[8.8rem] sm:h-[11.4rem] lg:w-[8.2rem] lg:h-[10.6rem] xl:w-[9.5rem] xl:h-[12.4rem]",
    imageClassName: "object-cover object-center grayscale-[15%] rounded-none",
    sizes: "(max-width: 768px) 20vw, 15vw",
  },
] as const;

const ABOUT_STATS = [
  {
    value: "12",
    label: "Years of experience",
  },
  {
    value: "ATCL",
    label: "Professionally qualified",
  },
  {
    value: "100%",
    label: "Satisfied customers",
  },
] as const;

export function About() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Text fade in
      gsap.from(".about-text", {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        },
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
      });

      gsap.from(".about-image", {
        scrollTrigger: {
          trigger: ".about-grid",
          start: "top 85%",
        },
        scale: 0.8,
        opacity: 0,
        duration: 1,
        stagger: {
          each: 0.12,
          from: "center",
        },
        ease: "power3.out",
      });

    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper id="about" ref={containerRef}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Side: Narrative */}
        <div className="max-w-md">
          <div className="about-text mb-0">
            <SectionHeader
              label="About Me"
              heading="Meet the maestro"
              alignment="left"
              className="mb-0 md:mb-0"
            />
          </div>
          <hr
            className="about-text my-10 h-px w-full shrink-0 border-0 bg-foreground/15"
            aria-hidden="true"
          />
          <div className="about-text space-y-6 text-foreground/80 font-sans text-lg leading-relaxed">
            <p>
              With years of classical training and a passion for crafting the perfect soundscape, I bring the profound resonance of the cello to life&apos;s most significant occasions.
            </p>
            <p>
              Every performance is a tailored experience, designed with calm authority and reassurance. I guide you through the musical selection, ensuring that when the bow meets the strings, the atmosphere is exactly as you envisioned.
            </p>
          </div>
          <dl className="about-text mt-10 grid w-full grid-cols-3 text-center">
            {ABOUT_STATS.map((stat, index) => (
              <div
                key={stat.value}
                className={cn(
                  "flex flex-col items-center px-4 py-5 sm:px-6",
                  index !== 0 && "border-l border-primary/20"
                )}
              >
                <dt className="font-display font-bold text-2xl text-primary lg:text-3xl xl:text-4xl">
                  {stat.value}
                </dt>
                <dd className="mx-auto mt-1 block max-w-[7rem] font-sans text-sm leading-snug text-foreground/60">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right Side: Fanned Card Layout */}
        <div className="about-grid flex w-full origin-center scale-[0.72] items-center justify-center py-12 sm:scale-90 md:scale-100 lg:translate-x-14 lg:-translate-y-8 lg:justify-end">
          {ABOUT_PHOTOS.map((photo) => (
            <div key={photo.src} className={photo.wrapperClassName}>
              <div className={photo.frameClassName}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className={photo.imageClassName}
                  sizes={photo.sizes}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
