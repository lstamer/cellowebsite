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

      // Images stagger slide in
      gsap.from(".about-image", {
        scrollTrigger: {
          trigger: ".about-grid",
          start: "top 80%",
        },
        y: 60,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: "power2.out",
      });

      // Parallax effect on scroll
      gsap.to(".about-image-inner", {
        scrollTrigger: {
          trigger: ".about-grid",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
        y: -40,
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
              label="The Musician"
              heading="Decades of dedication, channeled into your defining moment."
              alignment="left"
              className="mb-8"
            />
          </div>
          <div className="about-text space-y-6 text-foreground/80 font-sans text-lg leading-relaxed">
            <p>
              I am Stamer. With years of classical training and a passion for crafting the perfect soundscape, I bring the profound resonance of the cello to life&apos;s most significant occasions.
            </p>
            <p>
              Every performance is a tailored experience, designed with calm authority and reassurance. I guide you through the musical selection, ensuring that when the bow meets the strings, the atmosphere is exactly as you envisioned.
            </p>
          </div>
        </div>

        {/* Right Side: Editorial Image Grid */}
        <div className="about-grid grid grid-cols-2 gap-4 h-[31.25rem] md:h-[37.5rem]">
          <div className="about-image relative w-full h-full rounded-card overflow-hidden bg-primary/10 mt-8">
            <div className="about-image-inner absolute inset-[-20%] w-[140%] h-[140%]">
              <Image
                src="/images/heroImage.jpeg"
                alt="Cello performance detail"
                fill
                className="object-cover object-left grayscale-[20%]"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
          </div>
          <div className="about-image relative w-full h-full rounded-card overflow-hidden bg-primary/20 mb-8">
            <div className="about-image-inner absolute inset-[-20%] w-[140%] h-[140%]">
              <Image
                src="/images/heroImage.jpeg"
                alt="Musician playing the cello"
                fill
                className="object-cover object-right grayscale-[20%]"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
