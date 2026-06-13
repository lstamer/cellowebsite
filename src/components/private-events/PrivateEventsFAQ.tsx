"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FAQAccordion } from "@/components/ui/FAQAccordion";

const faqs = [
  {
    question: "Can you play more than just classical music?",
    answer: "Yes. Alongside classical and film favourites, I arrange pop, jazz and modern songs for the cello. If there's a particular track that matters to you or your guests, I'll arrange and learn it for the night.",
  },
  {
    question: "Will it work in my home, or do I need a venue?",
    answer: "The cello suits intimate spaces beautifully — living rooms, gardens, and private dining all work well. I only need a little floor space and a chair. For larger gatherings I bring discreet amplification.",
  },
  {
    question: "Will guests still be able to talk over dinner?",
    answer: "Absolutely. For dinner and arrivals I play at a relaxed background level that lifts the room without competing with conversation, then build the energy later if the evening calls for it.",
  },
  {
    question: "How long do you play, and do you take breaks?",
    answer: "Sets are tailored to your evening — typically a mix of performance and background playing across a few hours, with short breaks built in. We agree the timings together beforehand so it flows naturally.",
  },
  {
    question: "How far in advance should I book?",
    answer: "Popular weekend and seasonal dates book up quickly. I recommend reaching out as soon as you have your date and location to secure availability.",
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
      className="bg-background pb-24 md:pb-32"
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
