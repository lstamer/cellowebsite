"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FAQAccordion } from "@/components/ui/FAQAccordion";

const faqs = [
  {
    question: "How far in advance should we hold a date?",
    answer: "As soon as your date, city, and rough time block are known. Corporate and hotel calendars often move quickly, so I can confirm availability, outline the setup needs, and hold the date once the booking is agreed.",
  },
  {
    question: "Can you work with our in-house AV or sound team?",
    answer: "Yes. For larger rooms I can provide a pickup and balanced DI/XLR feed to front of house, then work with your AV team during a short sound check. For smaller networking spaces, acoustic cello is often enough.",
  },
  {
    question: "Can the repertoire match our brand or event theme?",
    answer: "Yes. I can shape the set around the tone of the event: classical, film, modern pop, refined background music, or a specific company song or campaign track if it suits cello and enough lead time is available.",
  },
  {
    question: "Will guests still be able to talk during networking or dinner?",
    answer: "Absolutely. Volume is shaped to the moment: relaxed and low enough for conversation during arrivals or dinner, then more present for awards walk-ups, reveals, or featured moments.",
  },
  {
    question: "How do invoicing, purchase orders, and payment terms work?",
    answer: "Corporate admin is handled clearly. I can provide an invoice, include purchase order details where required, and agree payment timing in writing before the booking is confirmed.",
  },
  {
    question: "What happens if you are unwell or unable to perform?",
    answer: "That situation is rare, but it is planned for. I maintain a network of trusted professional musicians and would communicate immediately so the best available contingency can be arranged.",
  },
  {
    question: "Do you travel to hotels, expos, and venues outside Cape Town?",
    answer: "Yes. Share the venue, call time, and event schedule, and I will confirm travel requirements, load-in timing, and any accommodation needs where relevant.",
  },
];

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
      className="bg-background pb-24 md:pb-32"
      maxWidth="max-w-4xl"
    >
      <div className="corp-faq-inner gsap-reveal">
        <SectionHeader
          label="FAQ"
          heading="Questions event teams usually ask"
        />

        <FAQAccordion faqs={faqs} className="mt-12" />
      </div>
    </SectionWrapper>
  );
}
