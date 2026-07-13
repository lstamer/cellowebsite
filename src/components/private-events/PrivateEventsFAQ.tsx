"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FAQAccordion } from "@/components/ui/FAQAccordion";

const faqs = [
  {
    question: "Can you play more than just classical?",
    answer: "Yes — and most of the time I do. Alongside the classical and film favourites, I arrange pop, jazz and modern songs for cello. If there's a track that matters to you or your guests, I'll learn it and arrange it for the night.",
  },
  {
    question: "Will it actually work in my home, or do I need a proper venue?",
    answer: "Your home is honestly where the cello sounds best — living rooms, gardens, a dinner table all work beautifully. All I need is a chair and a little floor space. For bigger gatherings I bring discreet amplification.",
  },
  {
    question: "Will my guests still be able to talk over dinner?",
    answer: "Completely. Through arrivals and dinner I play at a level that lifts the room rather than talking over it — then build the energy later if the night wants it.",
  },
  {
    question: "How long do you play, and do you take breaks?",
    answer: "It's shaped around your evening — usually a mix of proper performance and easy background playing across a few hours, with short breaks worked in. We sort the timings together beforehand so none of it feels abrupt.",
  },
  {
    question: "How far ahead should I get in touch?",
    answer: "Popular weekends and the busy season fill up fast. The moment you've got a date and a place in mind, send it over — the earlier you do, the better the odds I'm free.",
  },
];

export function PrivateEventsFAQ() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".private-faq-inner",
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
      surface="cream"
      className="pb-24 md:pb-32"
      maxWidth="max-w-4xl"
    >
      <div className="private-faq-inner gsap-reveal">
        <SectionHeader
          label="FAQ"
          heading="Questions hosts usually ask"
        />

        <FAQAccordion faqs={faqs} className="mt-12" />
      </div>
    </SectionWrapper>
  );
}
