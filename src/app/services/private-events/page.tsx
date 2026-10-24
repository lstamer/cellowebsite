import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PrivateEventsHero } from "@/components/private-events/PrivateEventsHero";
import { PrivateEventsDeferredSections } from "@/components/private-events/PrivateEventsDeferredSections";
import { CTA } from "@/components/CTA";
import { FAQJsonLd } from "@/components/ui/FAQJsonLd";
import { privateEventsFaqs } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "Private Event Cello Music",
  description:
    "Live cello for birthdays, anniversaries, dinners, and private celebrations in Cape Town. Luke takes care of the music, equipment, timing, and event logistics.",
  alternates: { canonical: "/services/private-events" },
};

export default function PrivateEventsPage() {
  return (
    <main className="relative bg-background">
      <FAQJsonLd faqs={privateEventsFaqs} />
      <Navbar heroVariant="dark" />
      <PrivateEventsHero />
      <div className="relative z-[2] bg-background">
        <PrivateEventsDeferredSections />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
