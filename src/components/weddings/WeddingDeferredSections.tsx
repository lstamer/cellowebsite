"use client";

import dynamic from "next/dynamic";
import { BelowFoldSectionSkeleton } from "@/components/ui/BelowFoldSectionSkeleton";
import { ScrollRevealRefresh } from "@/components/ui/ScrollRevealRefresh";

const WeddingValue = dynamic(
  () =>
    import("@/components/weddings/WeddingValue").then((mod) => ({
      default: mod.WeddingValue,
    })),
  { ssr: false, loading: BelowFoldSectionSkeleton }
);

const WeddingBenefits = dynamic(
  () =>
    import("@/components/weddings/WeddingBenefits").then((mod) => ({
      default: mod.WeddingBenefits,
    })),
  { ssr: false, loading: BelowFoldSectionSkeleton }
);

const WeddingLogistics = dynamic(
  () =>
    import("@/components/weddings/WeddingLogistics").then((mod) => ({
      default: mod.WeddingLogistics,
    })),
  { ssr: false, loading: BelowFoldSectionSkeleton }
);

const WeddingTestimonials = dynamic(
  () =>
    import("@/components/weddings/WeddingTestimonials").then((mod) => ({
      default: mod.WeddingTestimonials,
    })),
  { ssr: false, loading: BelowFoldSectionSkeleton }
);

const WeddingFAQ = dynamic(
  () =>
    import("@/components/weddings/WeddingFAQ").then((mod) => ({
      default: mod.WeddingFAQ,
    })),
  { ssr: false, loading: BelowFoldSectionSkeleton }
);

export function WeddingDeferredSections() {
  return (
    <>
      <ScrollRevealRefresh />
      <WeddingValue />
      <WeddingBenefits />
      <WeddingLogistics />
      <WeddingTestimonials />
      <WeddingFAQ />
    </>
  );
}
