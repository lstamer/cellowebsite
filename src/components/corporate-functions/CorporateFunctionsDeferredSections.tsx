"use client";

import dynamic from "next/dynamic";
import { BelowFoldSectionSkeleton } from "@/components/ui/BelowFoldSectionSkeleton";

const CorporateFunctionsOccasions = dynamic(
  () =>
    import("@/components/corporate-functions/CorporateFunctionsOccasions").then((mod) => ({
      default: mod.CorporateFunctionsOccasions,
    })),
  { ssr: false, loading: BelowFoldSectionSkeleton }
);

const CorporateFunctionsImportance = dynamic(
  () =>
    import("@/components/corporate-functions/CorporateFunctionsImportance").then((mod) => ({
      default: mod.CorporateFunctionsImportance,
    })),
  { ssr: false, loading: BelowFoldSectionSkeleton }
);

const CorporateFunctionsBenefits = dynamic(
  () =>
    import("@/components/corporate-functions/CorporateFunctionsBenefits").then((mod) => ({
      default: mod.CorporateFunctionsBenefits,
    })),
  { ssr: false, loading: BelowFoldSectionSkeleton }
);

const CorporateFunctionsLogistics = dynamic(
  () =>
    import("@/components/corporate-functions/CorporateFunctionsLogistics").then((mod) => ({
      default: mod.CorporateFunctionsLogistics,
    })),
  { ssr: false, loading: BelowFoldSectionSkeleton }
);

const CorporateFunctionsTechRider = dynamic(
  () =>
    import("@/components/corporate-functions/CorporateFunctionsTechRider").then((mod) => ({
      default: mod.CorporateFunctionsTechRider,
    })),
  { ssr: false, loading: BelowFoldSectionSkeleton }
);

const CorporateFunctionsFAQ = dynamic(
  () =>
    import("@/components/corporate-functions/CorporateFunctionsFAQ").then((mod) => ({
      default: mod.CorporateFunctionsFAQ,
    })),
  { ssr: false, loading: BelowFoldSectionSkeleton }
);

export function CorporateFunctionsDeferredSections() {
  return (
    <>
      <CorporateFunctionsOccasions />
      <CorporateFunctionsImportance />
      <CorporateFunctionsBenefits />
      <CorporateFunctionsLogistics />
      <CorporateFunctionsTechRider />
      <CorporateFunctionsFAQ />
    </>
  );
}
