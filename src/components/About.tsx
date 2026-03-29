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

      gsap.to(".about-image-inner", {
        scrollTrigger: {
          trigger: ".about-grid",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
        y: -30,
        ease: "none",
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
              heading="Hey, I'm Luke"
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
        <div className="about-grid flex items-center justify-center py-12">
          {/* Far Left */}
          <div className="-rotate-12 translate-y-6 -mx-3 sm:-mx-4 lg:-mx-5 shrink-0 z-[1]">
            <div className="about-image relative w-[5.5rem] h-[7rem] sm:w-[8rem] sm:h-[10.5rem] lg:w-[7rem] lg:h-[9rem] xl:w-[9rem] xl:h-[11.5rem] rounded-card overflow-hidden shadow-lg">
              <div className="about-image-inner absolute inset-[-20%] w-[140%] h-[140%]">
                <Image
                  src="/images/about-perf1.jpg"
                  alt="Performing in concert"
                  fill
                  className="object-cover object-left grayscale-[15%]"
                  sizes="(max-width: 768px) 20vw, 15vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
            </div>
          </div>

          {/* Left */}
          <div className="-rotate-6 translate-y-2 -mx-3 sm:-mx-4 lg:-mx-5 shrink-0 z-[2]">
            <div className="about-image relative w-[5.5rem] h-[7rem] sm:w-[8rem] sm:h-[10.5rem] lg:w-[7rem] lg:h-[9rem] xl:w-[9rem] xl:h-[11.5rem] rounded-card overflow-hidden shadow-lg">
              <div className="about-image-inner absolute inset-[-20%] w-[140%] h-[140%]">
                <Image
                  src="/images/about-perf2.jpg"
                  alt="Playing at a private event"
                  fill
                  className="object-cover object-center grayscale-[15%]"
                  sizes="(max-width: 768px) 20vw, 15vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
            </div>
          </div>

          {/* Center — larger focal card */}
          <div className="-mx-3 sm:-mx-4 lg:-mx-5 shrink-0 z-[3]">
            <div className="about-image relative w-[7rem] h-[9.5rem] sm:w-[10.5rem] sm:h-[14rem] lg:w-[9.5rem] lg:h-[12.5rem] xl:w-[12rem] xl:h-[15.5rem] rounded-card overflow-hidden shadow-2xl">
              <div className="about-image-inner absolute inset-[-20%] w-[140%] h-[140%]">
                <Image
                  src="/images/heroImage.jpeg"
                  alt="Cello performance detail"
                  fill
                  className="object-cover object-left grayscale-[20%]"
                  sizes="(max-width: 768px) 30vw, 20vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-primary/10 to-transparent" />
            </div>
          </div>

          {/* Right */}
          <div className="rotate-6 translate-y-2 -mx-3 sm:-mx-4 lg:-mx-5 shrink-0 z-[2]">
            <div className="about-image relative w-[5.5rem] h-[7rem] sm:w-[8rem] sm:h-[10.5rem] lg:w-[7rem] lg:h-[9rem] xl:w-[9rem] xl:h-[11.5rem] rounded-card overflow-hidden shadow-lg">
              <div className="about-image-inner absolute inset-[-20%] w-[140%] h-[140%]">
                <Image
                  src="/images/about-perf3-wide.jpg"
                  alt="Live performance at an event"
                  fill
                  className="object-cover object-center grayscale-[15%]"
                  sizes="(max-width: 768px) 20vw, 15vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
            </div>
          </div>

          {/* Far Right */}
          <div className="rotate-12 translate-y-6 -mx-3 sm:-mx-4 lg:-mx-5 shrink-0 z-[1]">
            <div className="about-image relative w-[5.5rem] h-[7rem] sm:w-[8rem] sm:h-[10.5rem] lg:w-[7rem] lg:h-[9rem] xl:w-[9rem] xl:h-[11.5rem] rounded-card overflow-hidden shadow-lg">
              <div className="about-image-inner absolute inset-[-20%] w-[140%] h-[140%]">
                <Image
                  src="/images/about-perf1.jpg"
                  alt="Performing at a ceremony"
                  fill
                  className="object-cover object-right grayscale-[15%]"
                  sizes="(max-width: 768px) 20vw, 15vw"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
