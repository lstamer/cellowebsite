import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PrivateEventsHero } from "@/components/private-events/PrivateEventsHero";
import { PrivateEventsDeferredSections } from "@/components/private-events/PrivateEventsDeferredSections";
import { CTA } from "@/components/CTA";
import { FAQJsonLd } from "@/components/ui/FAQJsonLd";
import { privateEventsFaqs } from "@/lib/faqs";

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
