import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FAQAccordion } from "@/components/ui/FAQAccordion";

const faqs = [
  {
    question: "When will I hear back?",
    answer:
      "Within 24 hours on weekdays, usually sooner. If it's a weekend, expect a reply on Monday morning.",
  },
  {
    question: "I forgot to mention something — can I still add details?",
    answer:
      "Yes. Reply on WhatsApp or email anytime before the booking is confirmed. Nothing is final until you receive the booking confirmation.",
  },
  {
    question: "What if my date or timing changes?",
    answer:
      "Flexible. Luke will do everything possible to accommodate a new date if availability allows, and can work around timing shifts on the day itself.",
  },
  {
    question: "How do quotes and deposits work?",
    answer:
      "Every quote is tailored to your event length, location, and package. A small deposit holds the date once you're happy with the proposal — the balance is due before the performance.",
  },
  {
    question: "How do we lock in the date?",
    answer:
      "Once you've agreed on the package and price, Luke sends a short booking confirmation and a deposit invoice. The date is secured when the deposit is received.",
  },
  {
    question: "Do you travel outside Cape Town?",
    answer:
      "Yes — across South Africa and for destination events. Travel costs are factored transparently into the quote, so there are no surprises.",
  },
];

export function BookingFAQ() {
  return (
    <SectionWrapper
      className="border-t border-foreground/10 pb-24 md:pb-32"
      maxWidth="max-w-4xl"
    >
      <SectionHeader
        label="FAQ"
        heading="Common questions while you wait"
      />
      <FAQAccordion faqs={faqs} className="mt-12" />
    </SectionWrapper>
  );
}
