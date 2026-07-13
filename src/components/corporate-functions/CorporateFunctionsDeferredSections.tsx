"use client";

import dynamic from "next/dynamic";
import { BelowFoldSectionSkeleton } from "@/components/ui/BelowFoldSectionSkeleton";
import { ScrollRevealRefresh } from "@/components/ui/ScrollRevealRefresh";

const CorporateFunctionsOccasions = dynamic(
  () =>
    import("@/components/corporate-functions/CorporateFunctionsOccasions").then((mod) => ({
      default: mod.CorporateFunctionsOccasions,
    })),
  { loading: BelowFoldSectionSkeleton }
);

const CorporateFunctionsImportance = dynamic(
  () =>
    import("@/components/corporate-functions/CorporateFunctionsImportance").then((mod) => ({
      default: mod.CorporateFunctionsImportance,
    })),
  { loading: BelowFoldSectionSkeleton }
);

const CorporateFunctionsBenefits = dynamic(
  () =>
    import("@/components/corporate-functions/CorporateFunctionsBenefits").then((mod) => ({
      default: mod.CorporateFunctionsBenefits,
    })),
  { loading: BelowFoldSectionSkeleton }
);

const CorporateFunctionsLogistics = dynamic(
  () =>
    import("@/components/corporate-functions/CorporateFunctionsLogistics").then((mod) => ({
      default: mod.CorporateFunctionsLogistics,
    })),
  { loading: BelowFoldSectionSkeleton }
);

const CorporateFunctionsTechRider = dynamic(
  () =>
    import("@/components/corporate-functions/CorporateFunctionsTechRider").then((mod) => ({
      default: mod.CorporateFunctionsTechRider,
    })),
  { loading: BelowFoldSectionSkeleton }
);

const CorporateFunctionsFAQ = dynamic(
  () =>
    import("@/components/corporate-functions/CorporateFunctionsFAQ").then((mod) => ({
      default: mod.CorporateFunctionsFAQ,
    })),
  { loading: BelowFoldSectionSkeleton }
);

export function CorporateFunctionsDeferredSections() {
  return (
    <>
      <ScrollRevealRefresh />
      <CorporateFunctionsOccasions />
      <CorporateFunctionsImportance />
      <CorporateFunctionsBenefits />
      <CorporateFunctionsLogistics />
      <CorporateFunctionsTechRider />
      <CorporateFunctionsFAQ />
    </>
  );
}
