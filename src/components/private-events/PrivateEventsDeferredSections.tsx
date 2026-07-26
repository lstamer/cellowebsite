"use client";

// Static imports: these sections are fully SSR'd, so dynamic() with a loading
// fallback saved no HTML and its skeleton broke useId alignment during hydration.
import { PrivateEventsOccasions } from "@/components/private-events/PrivateEventsOccasions";
import { PrivateEventsImportance } from "@/components/private-events/PrivateEventsImportance";
import { PrivateEventsBenefits } from "@/components/private-events/PrivateEventsBenefits";
import { PrivateEventsLogistics } from "@/components/private-events/PrivateEventsLogistics";
import { PrivateEventsFAQ } from "@/components/private-events/PrivateEventsFAQ";
import { ScrollRevealRefresh } from "@/components/ui/ScrollRevealRefresh";

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
