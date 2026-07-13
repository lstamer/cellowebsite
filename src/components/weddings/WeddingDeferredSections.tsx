"use client";

import dynamic from "next/dynamic";
import { BelowFoldSectionSkeleton } from "@/components/ui/BelowFoldSectionSkeleton";
import { ScrollRevealRefresh } from "@/components/ui/ScrollRevealRefresh";

const WeddingValue = dynamic(
  () =>
    import("@/components/weddings/WeddingValue").then((mod) => ({
      default: mod.WeddingValue,
    })),
  { loading: BelowFoldSectionSkeleton }
);

const WeddingBenefits = dynamic(
  () =>
    import("@/components/weddings/WeddingBenefits").then((mod) => ({
      default: mod.WeddingBenefits,
    })),
  { loading: BelowFoldSectionSkeleton }
);

const WeddingLogistics = dynamic(
  () =>
    import("@/components/weddings/WeddingLogistics").then((mod) => ({
      default: mod.WeddingLogistics,
    })),
  { loading: BelowFoldSectionSkeleton }
);

const WeddingFAQ = dynamic(
  () =>
    import("@/components/weddings/WeddingFAQ").then((mod) => ({
      default: mod.WeddingFAQ,
    })),
  { loading: BelowFoldSectionSkeleton }
);

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
