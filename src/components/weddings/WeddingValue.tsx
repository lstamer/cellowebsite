"use client";

import { useRef, useState, useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

const questions = [
  "What happens if I'm a few minutes late down the aisle? Does the music just... loop awkwardly?",
  "How does the walk-down song start at exactly the right moment and last exactly as long as the walk?",
  "How do I match the music to our venue without it feeling slightly off?",
  "Do we really need different music for the ceremony, the drinks, AND the reception, or is that overkill?",
  "Is our song choice too cliche? Will the guests actually like it?",
  "What's the backup plan if something goes wrong mid-ceremony?",
  "Honestly, who's going to keep an eye on all of this on the day?",
  "How do we keep our parents happy and still play the songs we actually love?",
];

const SPEED_PX_PER_SEC = 50;

const ESCALATOR_MASK =
  "[mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_82%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_82%,transparent_100%)]";

export function WeddingValue() {
  const containerRef = useRef<HTMLElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const timelineRef = useRef<gsap.core.Tween | null>(null);
  const sectionVisibleRef = useRef(false);

  const [viewportHeight, setViewportHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!leftColRef.current) return;

    const updateHeight = () => {
      if (leftColRef.current) {
        setViewportHeight(leftColRef.current.offsetHeight);
      }
    };

    const observer = new ResizeObserver(() => {
      updateHeight();
    });

    observer.observe(leftColRef.current);
    updateHeight();
    requestAnimationFrame(updateHeight);

    return () => observer.disconnect();
  }, []);

  useGSAP(
    () => {
      const pivot = containerRef.current?.querySelector<HTMLElement>(".value-pivot");
      if (pivot) {
        gsap.fromTo(
          pivot,
          { y: 20, autoAlpha: 0 },
          {
            scrollTrigger: { trigger: pivot, start: "top 85%", once: true },
            y: 0,
            autoAlpha: 1,
            duration: 1,
            ease: "power3.out",
          }
        );
      }

      const mm = gsap.matchMedia();
      mm.add("all", () => {
        if (!trackRef.current || !viewportRef.current || !containerRef.current) return;

        const cards = trackRef.current.children;
        if (cards.length <= questions.length) return;

        const firstDuplicate = cards[questions.length] as HTMLElement;
        let setHeight = firstDuplicate.offsetTop;
        const duration = setHeight / SPEED_PX_PER_SEC;

        let tween = gsap.fromTo(trackRef.current, { y: 0 }, {
          y: -setHeight,
          duration,
          ease: "none",
          repeat: -1,
        });
        timelineRef.current = tween;
        tween.pause();

        const visibilitySt = ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom top",
          onEnter: () => {
            sectionVisibleRef.current = true;
            tween.play();
          },
          onEnterBack: () => {
            sectionVisibleRef.current = true;
            tween.play();
          },
          onLeave: () => {
            sectionVisibleRef.current = false;
            tween.pause();
          },
          onLeaveBack: () => {
            sectionVisibleRef.current = false;
            tween.pause();
          },
        });

        if (visibilitySt.isActive) {
          sectionVisibleRef.current = true;
          tween.play();
        }

        const handleResize = () => {
          if (!trackRef.current) return;
          const newSetHeight = (trackRef.current.children[questions.length] as HTMLElement)
            .offsetTop;
          if (newSetHeight === setHeight) return;

          setHeight = newSetHeight;
          const newDuration = setHeight / SPEED_PX_PER_SEC;
          const progress = tween.progress();

          tween.kill();
          tween = gsap.fromTo(trackRef.current, { y: 0 }, {
            y: -setHeight,
            duration: newDuration,
            ease: "none",
            repeat: -1,
          });
          tween.progress(progress);
          timelineRef.current = tween;
          if (visibilitySt.isActive) {
            tween.play();
          } else {
            tween.pause();
          }
        };

        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
          visibilitySt.kill();
          if (timelineRef.current) {
            timelineRef.current.kill();
            timelineRef.current = null;
          }
        };
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  const handleMouseEnter = () => {
    timelineRef.current?.pause();
  };

  const handleMouseLeave = () => {
    if (sectionVisibleRef.current) {
      timelineRef.current?.resume();
    }
  };

  return (
    <SectionWrapper id="value" ref={containerRef} className="bg-background">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-20 lg:items-start">
        <div ref={leftColRef} className="value-pivot gsap-reveal lg:self-start">
          <SectionHeader
            label="My promise"
            heading="One part of the day you won't have to think about."
            alignment="left"
            className="mb-8 md:mb-10"
          />

          <div className="max-w-xl space-y-6">
            <p className="font-sans text-lg leading-relaxed text-foreground/75 text-pretty md:text-xl">
              You&apos;re already making a hundred decisions. The music
              shouldn&apos;t be another one keeping you up at night.
            </p>
            <div
              className="value-divider h-px min-h-px w-[92%] shrink-0 bg-primary/15"
              aria-hidden
            />
            <p className="hidden font-serif text-3xl italic leading-[1.08] text-primary text-balance md:text-4xl lg:block">
              You book once. I take it from there.
            </p>
          </div>
        </div>

        <div
          ref={viewportRef}
          className={cn(
            "relative overflow-hidden",
            ESCALATOR_MASK
          )}
          style={{ height: viewportHeight }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <ul ref={trackRef} className="relative flex flex-col gap-4 md:gap-5 will-change-transform">
            {[...questions, ...questions].map((q, idx) => (
              <li
                key={idx}
                className="question-item-desktop border-l-[3px] border-l-accent border-primary/15 bg-background p-5 shadow-card transition-[box-shadow,border-color] hover:shadow-card-hover md:p-6"
              >
                <p className="font-sans text-base leading-relaxed text-foreground/75 text-pretty">
                  &ldquo;{q}&rdquo;
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
}
