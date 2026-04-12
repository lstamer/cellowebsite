import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WeddingHero } from "@/components/weddings/WeddingHero";
import { WeddingTimeline } from "@/components/weddings/WeddingTimeline";
import { WeddingExperience } from "@/components/weddings/WeddingExperience";
import { WeddingTestimonials } from "@/components/weddings/WeddingTestimonials";
import { WeddingPricing } from "@/components/weddings/WeddingPricing";
import { WeddingFAQ } from "@/components/weddings/WeddingFAQ";
import { CTA } from "@/components/CTA";

export default function WeddingsPage() {
  return (
    <main className="relative bg-background">
      <Navbar />
      <WeddingHero />
      <div className="relative z-[2] bg-background">
        <WeddingTimeline />
        <WeddingExperience />
        <WeddingTestimonials />
        <WeddingPricing />
        <WeddingFAQ />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
