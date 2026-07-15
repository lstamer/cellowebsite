"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FAQAccordion } from "@/components/ui/FAQAccordion";
import { corporateFaqs as faqs } from "@/lib/faqs";

export function CorporateFunctionsFAQ() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".corp-faq-inner",
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
      <div className="corp-faq-inner gsap-reveal">
        <SectionHeader
          label="FAQ"
          heading="Questions event teams usually ask"
        />

        <FAQAccordion faqs={faqs} twoColumns className="mt-12" />
      </div>
    </SectionWrapper>
  );
}
