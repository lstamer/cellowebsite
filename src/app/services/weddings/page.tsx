import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WeddingHero } from "@/components/weddings/WeddingHero";
import { WeddingValue } from "@/components/weddings/WeddingValue";
import { WeddingBenefits } from "@/components/weddings/WeddingBenefits";
import { WeddingAuthority } from "@/components/weddings/WeddingAuthority";
import { WeddingPricing } from "@/components/weddings/WeddingPricing";
import { WeddingFAQ } from "@/components/weddings/WeddingFAQ";
import { CTA } from "@/components/CTA";

export default function WeddingsPage() {
  return (
    <main className="relative bg-background">
      <Navbar />
      <WeddingHero />
      <div className="relative z-[2] bg-background">
        <WeddingValue />
        <WeddingBenefits />
        <WeddingAuthority />
        <WeddingPricing />
        <WeddingFAQ />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
