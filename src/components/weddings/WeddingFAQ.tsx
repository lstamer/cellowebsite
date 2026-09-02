"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FAQAccordion } from "@/components/ui/FAQAccordion";
import { weddingFaqs as faqs } from "@/lib/faqs";

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
      surface="cream"
      className="pb-24 md:pb-32"
      maxWidth="max-w-7xl"
    >
      <div className="wedding-faq-inner gsap-reveal">
        <SectionHeader
          label="FAQ"
          heading="The things couples usually want to know"
        />

        <div className="mt-12 rounded-card border border-primary/10 bg-background px-7.5 py-1.5 shadow-card md:px-10">
          <FAQAccordion faqs={faqs} twoColumns numbered />
        </div>
      </div>
    </SectionWrapper>
  );
}
