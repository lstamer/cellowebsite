"use client";

// Static imports: these sections are fully SSR'd, so dynamic() with a loading
// fallback saved no HTML and its skeleton broke useId alignment during hydration.
import { WeddingValue } from "@/components/weddings/WeddingValue";
import { WeddingBenefits } from "@/components/weddings/WeddingBenefits";
import { WeddingLogistics } from "@/components/weddings/WeddingLogistics";
import { WeddingFAQ } from "@/components/weddings/WeddingFAQ";
import { ScrollRevealRefresh } from "@/components/ui/ScrollRevealRefresh";

export function WeddingDeferredSections() {
  return (
    <>
      <ScrollRevealRefresh />
      <WeddingValue />
      <WeddingBenefits />
      <WeddingLogistics />
      <WeddingFAQ />
    </>
  );
}
