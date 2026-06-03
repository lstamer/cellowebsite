import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FAQAccordion } from "@/components/ui/FAQAccordion";

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
  return (
    <SectionWrapper
      id="faq"
      className="bg-background pb-24 md:pb-32"
      maxWidth="max-w-4xl"
    >
      <SectionHeader
        label="FAQ"
        heading="Questions couples usually ask"
      />

      <FAQAccordion
        faqs={faqs}
        className="mt-12"
        questionClassName="font-display text-xl font-normal tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary md:text-2xl"
      />
    </SectionWrapper>
  );
}
