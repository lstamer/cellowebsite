"use client";

import dynamic from "next/dynamic";
import { BelowFoldSectionSkeleton } from "@/components/ui/BelowFoldSectionSkeleton";
import { ScrollRevealRefresh } from "@/components/ui/ScrollRevealRefresh";

const PrivateEventsOccasions = dynamic(
  () =>
    import("@/components/private-events/PrivateEventsOccasions").then((mod) => ({
      default: mod.PrivateEventsOccasions,
    })),
  { loading: BelowFoldSectionSkeleton }
);

const PrivateEventsImportance = dynamic(
  () =>
    import("@/components/private-events/PrivateEventsImportance").then((mod) => ({
      default: mod.PrivateEventsImportance,
    })),
  { loading: BelowFoldSectionSkeleton }
);

const PrivateEventsBenefits = dynamic(
  () =>
    import("@/components/private-events/PrivateEventsBenefits").then((mod) => ({
      default: mod.PrivateEventsBenefits,
    })),
  { loading: BelowFoldSectionSkeleton }
);

const PrivateEventsLogistics = dynamic(
  () =>
    import("@/components/private-events/PrivateEventsLogistics").then((mod) => ({
      default: mod.PrivateEventsLogistics,
    })),
  { loading: BelowFoldSectionSkeleton }
);

const PrivateEventsFAQ = dynamic(
  () =>
    import("@/components/private-events/PrivateEventsFAQ").then((mod) => ({
      default: mod.PrivateEventsFAQ,
    })),
  { loading: BelowFoldSectionSkeleton }
);

export function PrivateEventsDeferredSections() {
  return (
    <>
      <ScrollRevealRefresh />
      <PrivateEventsOccasions />
      <PrivateEventsImportance />
      <PrivateEventsBenefits />
      <PrivateEventsLogistics />
      <PrivateEventsFAQ />
    </>
  );
}
