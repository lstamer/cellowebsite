import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WeddingHero } from "@/components/weddings/WeddingHero";
import { WeddingDeferredSections } from "@/components/weddings/WeddingDeferredSections";
import { CTA } from "@/components/CTA";

export default function WeddingsPage() {
  return (
    <main className="relative bg-background">
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
