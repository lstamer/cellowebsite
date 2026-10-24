import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WeddingHero } from "@/components/weddings/WeddingHero";
import { WeddingDeferredSections } from "@/components/weddings/WeddingDeferredSections";
import { CTA } from "@/components/CTA";
import { FAQJsonLd } from "@/components/ui/FAQJsonLd";
import { weddingFaqs } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "Wedding Cello Music",
  description:
    "Live cello for Cape Town weddings, from the first guest’s arrival to the last note before dinner. Luke handles the repertoire, equipment, timing, and logistics.",
  alternates: { canonical: "/services/weddings" },
};

export default function WeddingsPage() {
  return (
    <main className="relative bg-background">
      <FAQJsonLd faqs={weddingFaqs} />
      <Navbar heroVariant="dark" />
      <WeddingHero />
      <div className="relative z-[2] bg-background">
        <WeddingDeferredSections />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
