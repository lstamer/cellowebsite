import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FAQAccordion } from "@/components/ui/FAQAccordion";
import { bookingFaqs as faqs } from "@/lib/faqs";

export function BookingFAQ({
  heading = "The things people ask before booking",
}: {
  /** Override the section heading — the post-submit success screen reframes it. */
  heading?: string;
}) {
  return (
    <SectionWrapper
      id="faq"
      surface="background"
      className="scroll-mt-24 pb-24 md:pb-32"
      maxWidth="max-w-4xl"
    >
      <SectionHeader label="FAQ" heading={heading} />
      <FAQAccordion faqs={faqs} className="mt-12" />
    </SectionWrapper>
  );
}
