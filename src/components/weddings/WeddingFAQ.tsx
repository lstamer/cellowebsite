"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface FAQ {
  question: string;
  answer: string;
}

const column1: FAQ[] = [
  {
    question: "Can you learn a specific song for our ceremony?",
    answer:
      "Yes. Every package includes bespoke arrangements. Send me a link or title and I'll prepare it, then send you a recording to approve before the day.",
  },
  {
    question: "How far in advance should we book?",
    answer:
      "Popular summer and weekend dates book up 12–18 months ahead. I'd recommend reaching out as soon as you have your date confirmed.",
  },
  {
    question: "Do you need power or a sound system?",
    answer:
      "The cello projects naturally in most ceremony spaces. For larger outdoor venues or rooms with 100+ guests, I bring discreet professional amplification.",
  },
];

const column2: FAQ[] = [
  {
    question: "What if timings change on the day?",
    answer:
      "They always do. I arrive early, build in buffer time, and adapt as the day unfolds. You won't need to manage this.",
  },
  {
    question: "What style of music do you play?",
    answer:
      "Everything from Bach to Billie Eilish. Classical, pop arrangements, film scores, worship music — whatever fits your vision.",
  },
  {
    question: "What's the booking process?",
    answer:
      "Check your date, book a call, choose your package. I send a simple contract and a playlist planning guide. That's it.",
  },
];

function FAQItem({ q }: { q: FAQ }) {
  return (
    <div className="faq-item">
      <h3 className="font-display font-semibold text-lg text-foreground mb-3 leading-snug">
        {q.question}
      </h3>
      <p className="font-sans text-base text-foreground/60 leading-relaxed text-pretty">
        {q.answer}
      </p>
    </div>
  );
}

export function WeddingFAQ() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Zipper stagger: left1, right1, left2, right2...
      const lefts = containerRef.current?.querySelectorAll<HTMLElement>(".faq-left .faq-item");
      const rights = containerRef.current?.querySelectorAll<HTMLElement>(".faq-right .faq-item");

      if (!lefts || !rights) return;

      const maxLen = Math.max(lefts.length, rights.length);

      for (let i = 0; i < maxLen; i++) {
        const delay = i * 0.18;

        if (lefts[i]) {
          gsap.fromTo(
            lefts[i],
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              delay,
              ease: "power3.out",
              scrollTrigger: {
                trigger: containerRef.current,
                start: "top 78%",
                once: true,
              },
            }
          );
        }

        if (rights[i]) {
          gsap.fromTo(
            rights[i],
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              delay: delay + 0.09,
              ease: "power3.out",
              scrollTrigger: {
                trigger: containerRef.current,
                start: "top 78%",
                once: true,
              },
            }
          );
        }
      }
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper
      id="faq"
      ref={containerRef}
      className="bg-background pb-24 md:pb-32"
      maxWidth="max-w-5xl"
    >
      <SectionHeader label="Questions" heading="Before you decide" alignment="left" />

      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
        <div className="faq-left flex flex-col gap-12">
          {column1.map((q, i) => (
            <FAQItem key={i} q={q} />
          ))}
        </div>
        <div className="faq-right flex flex-col gap-12">
          {column2.map((q, i) => (
            <FAQItem key={i} q={q} />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
