"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FAQAccordion } from "@/components/ui/FAQAccordion";

const faqs = [
  {
    question: "How far ahead should we hold a date?",
    answer: "As soon as you know the date, the city, and a rough time block. Corporate and hotel calendars move quickly, so the sooner you share it, the sooner I can confirm availability, outline what the setup needs, and hold the date once the booking is agreed.",
  },
  {
    question: "Can you work with our in-house AV or sound team?",
    answer: "Yes, and I prefer to. For larger rooms I bring my own pickup and send a balanced DI/XLR feed to front of house, then settle it with your AV team during a short sound check. For smaller networking spaces, the acoustic cello on its own is usually enough.",
  },
  {
    question: "Can the repertoire match our brand or event theme?",
    answer: "Yes. I shape the set around the tone you are after — classical, film, modern pop, quiet background music — or a specific company song or campaign track, as long as it suits the cello and there is enough lead time to arrange it properly.",
  },
  {
    question: "Will guests still be able to talk over the music at dinner?",
    answer: "Of course. The volume is shaped to the moment: low and easy to talk over during arrivals and dinner, then more present for awards walk-ups, reveals, and the moments you actually want people to notice.",
  },
  {
    question: "How do invoicing, purchase orders, and payment terms work?",
    answer: "Cleanly. I provide a proper invoice, include purchase order details wherever you need them, and agree the payment timing in writing before the booking is confirmed. The admin should be the easy part.",
  },
  {
    question: "What happens if you are unwell or unable to perform?",
    answer: "It is rare, but it is planned for. I keep a network of trusted professional musicians, and if anything happened I would tell you straight away and arrange the best possible cover. You would not be left guessing.",
  },
  {
    question: "Do you travel to hotels, expos, and venues outside Cape Town?",
    answer: "Yes. Send me the venue, the call time, and the schedule, and I will confirm the travel, the load-in timing, and any accommodation needs where they apply.",
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
