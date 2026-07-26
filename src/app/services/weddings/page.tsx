import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WeddingHero } from "@/components/weddings/WeddingHero";
import { WeddingDeferredSections } from "@/components/weddings/WeddingDeferredSections";
import { CTA } from "@/components/CTA";

export const metadata: Metadata = {
  title: "Wedding Cellist in Cape Town | Stamer Cello",
};

export default function WeddingsPage() {
  return (
    <main id="main" className="relative bg-background">
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
