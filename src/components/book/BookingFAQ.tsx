import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FAQAccordion } from "@/components/ui/FAQAccordion";

const faqs = [
  {
    question: "When will I hear back?",
    answer:
      "Within 24 hours on weekdays, usually sooner. If you've written over a weekend, you'll hear from me first thing Monday.",
  },
  {
    question: "I forgot to mention something — can I still add details?",
    answer:
      "Of course. Reply on WhatsApp or email any time before things are confirmed — nothing's locked in until you've got the booking confirmation in hand.",
  },
  {
    question: "What if my date or timing changes?",
    answer:
      "Things move — I get it. I'll do everything I can to hold a new date if I'm free, and I can work around timing shifts on the day itself.",
  },
  {
    question: "How do quotes and deposits work?",
    answer:
      "Every quote is built around your event's length, location, and package — no fixed menu. A small deposit holds the date once you're happy with it, and the balance is due before I play.",
  },
  {
    question: "How do we lock in the date?",
    answer:
      "Once we've agreed the package and price, I send a short booking confirmation and a deposit invoice. The date is yours the moment the deposit lands.",
  },
  {
    question: "Do you travel outside Cape Town?",
    answer:
      "Yes — across South Africa, and for destination events too. Travel goes into the quote upfront, so there's nothing surprising waiting at the end.",
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
