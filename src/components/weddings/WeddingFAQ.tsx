"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const faqs = [
  {
    question: "Can you perform our chosen song?",
    answer: "Yes. Every package includes bespoke song requests for key moments like your walk down the aisle or signing the register. I'll arrange and learn them specifically for your day.",
  },
  {
    question: "Do you play during the drinks reception as well?",
    answer: "Absolutely. The All-Rounder and Full Experience packages include extended coverage to keep the atmosphere elegant and engaging while you take photos and mingle with guests.",
  },
  {
    question: "How far in advance should we book?",
    answer: "Popular summer and weekend dates often book up 12-18 months in advance. I recommend reaching out as soon as you have your date and venue confirmed to secure availability.",
  },
  {
    question: "Do you need amplification or power?",
    answer: "The cello projects beautifully in most acoustic spaces. For larger outdoor settings or rooms with 100+ guests, I provide professional, discreet amplification that requires access to standard power.",
  },
  {
    question: "What happens if our ceremony timings change on the day?",
    answer: "Weddings rarely run exactly to the minute. I always arrive early and allow buffer time in my schedule to adapt naturally to the flow of your day without added stress.",
  },
];

export function WeddingFAQ() {
  const containerRef = useRef<HTMLElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useGSAP(
    () => {
      gsap.fromTo(
        ".faq-item",
        {
          y: 20,
          opacity: 0,
        },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            once: true,
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
    <SectionWrapper id="faq" ref={containerRef} className="bg-background pb-24 md:pb-32" maxWidth="max-w-4xl">
      <SectionHeader
        label="FAQ"
        heading="Common questions"
      />

      <div className="mt-12 divide-y divide-foreground/10">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          
          return (
            <div key={idx} className="faq-item py-6">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="flex w-full items-center justify-between text-left focus:outline-none group"
              >
                <h3 className="font-display font-semibold text-lg text-foreground pr-8 group-hover:text-primary transition-colors">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={twMerge(
                    clsx(
                      "w-5 h-5 text-foreground/50 transition-transform duration-300 shrink-0",
                      isOpen && "rotate-180 text-primary"
                    )
                  )}
                />
              </button>
              
              <div
                className={twMerge(
                  clsx(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
                  )
                )}
              >
                <div className="overflow-hidden">
                  <p className="font-sans text-base text-foreground/70 leading-relaxed max-w-3xl pr-8">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
