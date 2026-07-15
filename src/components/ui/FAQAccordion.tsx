"use client";

import { useId, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ChevronDown } from "lucide-react";
import { gsap } from "@/lib/gsap-client";
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
  twoColumns?: boolean;
  /** Override question typography (default: {@link faqQuestionClass}) */
  questionClassName?: string;
}

export function FAQAccordion({
  faqs,
  defaultOpenIndex = 0,
  className,
  twoColumns = false,
  questionClassName = faqQuestionClass,
}: FAQAccordionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);
  const [desktopOpenIndices, setDesktopOpenIndices] = useState<
    [number | null, number | null]
  >(() => [
    defaultOpenIndex !== null && defaultOpenIndex % 2 === 0 ? defaultOpenIndex : null,
    defaultOpenIndex !== null && defaultOpenIndex % 2 === 1 ? defaultOpenIndex : null,
  ]);

  useGSAP(
    () => {
      const revealItems = (targets: string) =>
        scrollRevealFromTo(
          targets,
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

      if (!twoColumns) {
        revealItems(".faq-single .faq-item");
        return;
      }

      const media = gsap.matchMedia();
      media.add("(min-width: 768px)", () => revealItems(".faq-desktop .faq-item"));
      media.add("(max-width: 767px)", () => revealItems(".faq-mobile .faq-item"));

      return () => media.revert();
    },
    { scope: containerRef }
  );

  const renderFaqItem = (
    faq: FAQItem,
    idx: number,
    isOpen: boolean,
    onToggle: () => void,
    layout: "single" | "mobile" | "left" | "right"
  ) => {
    const answerId = `${baseId}-${layout}-answer-${idx}`;

    return (
      <div key={`${layout}-${idx}`} className="faq-item gsap-reveal py-6">
        <h3 className={cn(questionClassName)}>
          <button
            type="button"
            onClick={onToggle}
            className="group flex w-full items-start justify-between gap-6 text-left"
            aria-expanded={isOpen}
            aria-controls={answerId}
          >
            <span className="pr-8">{faq.question}</span>
            <ChevronDown
              className={cn(
                "mt-1 h-5 w-5 shrink-0 text-foreground/50 transition-transform duration-300",
                isOpen && "rotate-180 text-primary"
              )}
            />
          </button>
        </h3>

        <div
          id={answerId}
          aria-hidden={!isOpen}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
            isOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <p className={cn(featureItemBodyClass, "max-w-3xl pr-8")}>{faq.answer}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={cn(className)}>
      {!twoColumns ? (
        <div className="faq-single divide-y divide-foreground/10">
          {faqs.map((faq, idx) =>
            renderFaqItem(
              faq,
              idx,
              openIndex === idx,
              () => setOpenIndex(openIndex === idx ? null : idx),
              "single"
            )
          )}
        </div>
      ) : (
        <>
          <div className="faq-mobile divide-y divide-foreground/10 md:hidden">
            {faqs.map((faq, idx) =>
              renderFaqItem(
                faq,
                idx,
                openIndex === idx,
                () => setOpenIndex(openIndex === idx ? null : idx),
                "mobile"
              )
            )}
          </div>

          <div className="faq-desktop hidden md:grid md:grid-cols-2 md:items-start md:gap-x-12">
            {[0, 1].map((column) => (
              <div
                key={column}
                className="divide-y divide-foreground/10 border-t border-foreground/10"
              >
                {faqs.map((faq, idx) => {
                  if (idx % 2 !== column) return null;

                  const isOpen = desktopOpenIndices[column] === idx;
                  return renderFaqItem(
                    faq,
                    idx,
                    isOpen,
                    () =>
                      setDesktopOpenIndices((current) => {
                        const next: [number | null, number | null] = [...current];
                        next[column] = isOpen ? null : idx;
                        return next;
                      }),
                    column === 0 ? "left" : "right"
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
