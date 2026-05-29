"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ChevronDown } from "lucide-react";
import { scrollRevealFromTo } from "@/lib/gsap-scroll-reveal";
import { faqQuestionClass, featureItemBodyClass } from "@/lib/typography-classes";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqs: FAQItem[];
  defaultOpenIndex?: number | null;
  className?: string;
}

export function FAQAccordion({ faqs, defaultOpenIndex = 0, className }: FAQAccordionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);

  useGSAP(
    () => {
      scrollRevealFromTo(
        ".faq-item",
        { y: 20, opacity: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={cn("divide-y divide-foreground/10", className)}>
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;

        return (
          <div key={idx} className="faq-item py-6">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="group flex w-full items-start justify-between gap-6 text-left"
              aria-expanded={isOpen}
            >
              <h3 className={cn(faqQuestionClass, "pr-8")}>{faq.question}</h3>
              <ChevronDown
                className={cn(
                  "mt-1 h-5 w-5 shrink-0 text-foreground/50 transition-transform duration-300",
                  isOpen && "rotate-180 text-primary"
                )}
              />
            </button>

            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className={cn(featureItemBodyClass, "max-w-3xl pr-8")}>{faq.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
