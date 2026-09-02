"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { weddingTestimonials } from "@/lib/testimonials";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

export function WeddingTestimonials() {
  const containerRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const directionRef = useRef<-1 | 0 | 1>(0);
  const transitionLockedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTestimonial = weddingTestimonials[activeIndex];

  useGSAP(
    () => {
      gsap.fromTo(
        ".wedding-testimonials-header",
        { y: 36, autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 78%",
            once: true,
          },
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );

      gsap.fromTo(
        ".wedding-testimonial-shell",
        { y: 40, autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 72%",
            once: true,
          },
          y: 0,
          autoAlpha: 1,
          duration: 0.9,
          ease: "power3.out",
        }
      );

      gsap.fromTo(
        ".wedding-testimonial-word",
        { y: "0.5em", autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 72%",
            once: true,
          },
          y: 0,
          autoAlpha: 1,
          duration: 0.6,
          stagger: 0.028,
          ease: "power3.out",
          delay: 0.25,
        }
      );
    },
    { scope: containerRef }
  );

  useGSAP(
    () => {
      const card = cardRef.current;
      const direction = directionRef.current;

      if (!card || direction === 0) return;

      const timeline = gsap.timeline({
        onComplete: () => {
          transitionLockedRef.current = false;
        },
      });

      timeline
        .fromTo(
          card,
          { x: direction * 32, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.55, ease: "power3.out" }
        )
        .fromTo(
          ".wedding-testimonial-word",
          { y: "0.5em", autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.5,
            stagger: 0.028,
            ease: "power3.out",
          },
          0.12
        );
    },
    { scope: containerRef, dependencies: [activeIndex] }
  );

  const changeTestimonial = (direction: -1 | 1) => {
    const card = cardRef.current;
    if (!card || transitionLockedRef.current) return;

    const moveToNextIndex = () => {
      setActiveIndex(
        (currentIndex) =>
          (currentIndex + direction + weddingTestimonials.length) %
          weddingTestimonials.length
      );
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      directionRef.current = 0;
      moveToNextIndex();
      return;
    }

    transitionLockedRef.current = true;
    directionRef.current = direction;
    gsap.to(card, {
      x: direction * -32,
      autoAlpha: 0,
      duration: 0.28,
      ease: "power2.in",
      onComplete: moveToNextIndex,
    });
  };

  return (
    <SectionWrapper
      id="wedding-testimonials"
      ref={containerRef}
      maxWidth="max-w-7xl"
      surface="dark"
    >
      <div className="wedding-testimonials-header gsap-reveal">
        <SectionHeader
          label="Love notes"
          heading="Reviews from couples like you"
          alignment="center"
          className="!mb-0"
          labelClassName="text-on-dark/70"
          headingClassName="text-on-dark"
        />
      </div>

      <div
        className="wedding-testimonial-shell gsap-reveal mx-auto mt-12 max-w-5xl md:mt-16"
        role="region"
        aria-roledescription="carousel"
        aria-label="Wedding testimonials"
      >
        <div aria-live="polite" aria-atomic="true">
          <article
            ref={cardRef}
            className="relative isolate flex min-h-[48dvh] flex-col items-center justify-center overflow-hidden rounded-card border border-primary/10 bg-background px-8 pb-10 pt-20 text-center shadow-card md:min-h-[52dvh] md:px-12 md:pb-12 md:pt-24 lg:px-16 lg:pb-16 lg:pt-28"
            aria-label={`Testimonial ${activeIndex + 1} of ${weddingTestimonials.length}`}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 bg-grain opacity-[0.07]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -left-[0.02em] -top-[0.16em] -z-10 select-none font-serif text-[14rem] leading-none text-primary md:text-[22rem] lg:text-[26rem]"
            >
              &ldquo;
            </span>

            <blockquote>
              <p className="mx-auto max-w-3xl font-serif text-2xl italic leading-snug text-foreground text-balance md:text-3xl lg:text-4xl">
                <span className="sr-only">{activeTestimonial.quote}</span>
                <span aria-hidden>
                  {activeTestimonial.quote.split(" ").map((word, index) => (
                    <span
                      key={`${activeIndex}-${index}`}
                      className="wedding-testimonial-word inline-block whitespace-pre"
                    >
                      {word}
                      {index < activeTestimonial.quote.split(" ").length - 1 ? " " : ""}
                    </span>
                  ))}
                </span>
              </p>
            </blockquote>

            <footer className="mt-10 border-t border-primary/10 pt-6">
              <p className="font-display text-xl font-semibold tracking-tight text-primary md:text-2xl">
                {activeTestimonial.name}
              </p>
              <p className="mt-2 font-sans text-sm text-foreground/70">
                {activeTestimonial.descriptor}
              </p>
            </footer>
          </article>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4" aria-label="Testimonial navigation">
          <button
            type="button"
            onClick={() => changeTestimonial(-1)}
            aria-label="Show previous testimonial"
            className="flex h-[48px] w-[48px] items-center justify-center rounded-full border border-on-dark/40 text-on-dark transition-colors duration-300 hover:border-on-dark hover:bg-on-dark/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
          >
            <ChevronLeft className="h-[20px] w-[20px]" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => changeTestimonial(1)}
            aria-label="Show next testimonial"
            className="flex h-[48px] w-[48px] items-center justify-center rounded-full border border-on-dark/40 text-on-dark transition-colors duration-300 hover:border-on-dark hover:bg-on-dark/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-dark"
          >
            <ChevronRight className="h-[20px] w-[20px]" aria-hidden />
          </button>
        </div>
      </div>
    </SectionWrapper>
  );
}
