"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FAQAccordion } from "@/components/ui/FAQAccordion";

const faqs = [
  {
    question: "Can you play the song that means something to us?",
    answer: "Yes — and honestly, this is my favourite part. Every package includes song requests for the moments that matter most, like your walk down the aisle or the signing. I'll arrange it and learn it for your day, so it sounds like yours.",
  },
  {
    question: "Will you keep playing through the drinks reception?",
    answer: "Of course. The All-Rounder and Full Experience packages cover the drinks reception too, so there's live cello in the background while you're off having photos taken and your guests are mingling.",
  },
  {
    question: "How early do we need to book you?",
    answer: "Popular summer and weekend dates tend to go 12-18 months ahead. If you've got your date and venue locked in, get in touch sooner rather than later — earlier is always easier on both of us.",
  },
  {
    question: "Do you need power, or any amplification?",
    answer: "In most spaces, no — the cello carries beautifully on its own. For a big outdoor setting or a room with 100+ guests, I bring discreet amplification that just needs access to a standard plug.",
  },
  {
    question: "What if the timings slip on the day?",
    answer: "They almost always do, and that's completely normal. I arrive early and build buffer time into my plan, so when the schedule moves, I move with it — no panic, no awkward silences.",
  },
];

export function WeddingFAQ() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".wedding-faq-inner",
        { y: 32, autoAlpha: 0 },
        {
          scrollTrigger: { trigger: containerRef.current, start: "top 80%", once: true },
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper
      id="faq"
      ref={containerRef}
      className="bg-background pb-24 md:pb-32"
      maxWidth="max-w-4xl"
    >
      <div className="wedding-faq-inner gsap-reveal">
        <SectionHeader
          label="FAQ"
          heading="The things couples usually want to know"
        />

        <FAQAccordion
          faqs={faqs}
          className="mt-12"
          questionClassName="font-display text-xl font-normal tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary md:text-2xl"
        />
      </div>
    </SectionWrapper>
  );
}
