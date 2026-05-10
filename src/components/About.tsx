"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const ABOUT_PHOTOS = [
  {
    src: "/images/about/luke-mall-performance.png",
    alt: "Luke Stamer performing cello for an audience in a public venue",
    wrapperClassName: "-rotate-10 translate-y-6 -mx-4 sm:-mx-5 lg:-mx-6 shrink-0 z-[1]",
    frameClassName:
      "about-image relative w-[6.5rem] h-[8.4rem] overflow-hidden rounded-none shadow-card sm:w-[9.4rem] sm:h-[12.2rem] lg:w-[8.6rem] lg:h-[11rem] xl:w-[10.2rem] xl:h-[13.1rem]",
    imageClassName: "object-cover object-center grayscale-[15%] rounded-none",
    sizes: "(max-width: 768px) 20vw, 15vw",
  },
  {
    src: "/images/about/luke-garden-cello.png",
    alt: "Luke Stamer playing cello outdoors in a white suit",
    wrapperClassName: "-rotate-5 translate-y-2 -mx-4 sm:-mx-5 lg:-mx-6 shrink-0 z-[2]",
    frameClassName:
      "about-image relative w-[7rem] h-[9.1rem] overflow-hidden rounded-none shadow-card sm:w-[10.25rem] sm:h-[13.25rem] lg:w-[9.35rem] lg:h-[11.9rem] xl:w-[11rem] xl:h-[14.25rem]",
    imageClassName: "object-cover object-center grayscale-[20%] rounded-none",
    sizes: "(max-width: 768px) 25vw, 18vw",
  },
  {
    src: "/images/about/luke-event-lights.png",
    alt: "Luke Stamer performing cello beneath colourful Confluence event lights",
    wrapperClassName: "-mx-4 sm:-mx-5 lg:-mx-6 shrink-0 z-[3]",
    frameClassName:
      "about-image relative w-[8.25rem] h-[10.75rem] overflow-hidden rounded-none shadow-card sm:w-[12rem] sm:h-[15.5rem] lg:w-[11rem] lg:h-[14rem] xl:w-[13rem] xl:h-[16.75rem]",
    imageClassName: "object-cover object-center grayscale-[20%] rounded-none",
    sizes: "(max-width: 768px) 30vw, 20vw",
  },
  {
    src: "/images/about/luke-stage-lights.png",
    alt: "Luke Stamer performing cello in a white shirt on a warmly lit stage",
    wrapperClassName: "rotate-5 translate-y-2 -mx-4 sm:-mx-5 lg:-mx-6 shrink-0 z-[2]",
    frameClassName:
      "about-image relative w-[7rem] h-[9.1rem] overflow-hidden rounded-none shadow-card sm:w-[10.25rem] sm:h-[13.25rem] lg:w-[9.35rem] lg:h-[11.9rem] xl:w-[11rem] xl:h-[14.25rem]",
    imageClassName: "object-cover object-center grayscale-[15%] rounded-none",
    sizes: "(max-width: 768px) 25vw, 18vw",
  },
  {
    src: "/images/about/luke-orchestra.png",
    alt: "Luke Stamer soloing with a school orchestra",
    wrapperClassName: "rotate-10 translate-y-6 -mx-4 sm:-mx-5 lg:-mx-6 shrink-0 z-[1]",
    frameClassName:
      "about-image relative w-[6.5rem] h-[8.4rem] overflow-hidden rounded-none shadow-card sm:w-[9.4rem] sm:h-[12.2rem] lg:w-[8.6rem] lg:h-[11rem] xl:w-[10.2rem] xl:h-[13.1rem]",
    imageClassName: "object-cover object-center grayscale-[15%] rounded-none",
    sizes: "(max-width: 768px) 20vw, 15vw",
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
        <div className="max-w-xl">
          <div className="about-text">
            <SectionHeader
              label="About Me"
              heading="Meet the maestro"
              alignment="left"
              className="mb-8"
            />
          </div>
          <div className="about-text space-y-6 text-foreground/80 font-sans text-lg leading-relaxed">
            <p>
              With years of classical training and a passion for crafting the perfect soundscape, I bring the profound resonance of the cello to life&apos;s most significant occasions.
            </p>
            <p>
              Every performance is a tailored experience, designed with calm authority and reassurance. I guide you through the musical selection, ensuring that when the bow meets the strings, the atmosphere is exactly as you envisioned.
            </p>
          </div>
        </div>

        {/* Right Side: Fanned Card Layout */}
        <div className="about-grid flex w-full origin-center scale-[0.86] items-center justify-center py-12 sm:scale-100 lg:translate-x-8">
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
