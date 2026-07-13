"use client";

// Static imports: these sections are fully SSR'd, so dynamic() with a loading
// fallback saved no HTML and its skeleton broke useId alignment during hydration.
import { CorporateFunctionsOccasions } from "@/components/corporate-functions/CorporateFunctionsOccasions";
import { CorporateFunctionsImportance } from "@/components/corporate-functions/CorporateFunctionsImportance";
import { CorporateFunctionsBenefits } from "@/components/corporate-functions/CorporateFunctionsBenefits";
import { CorporateFunctionsLogistics } from "@/components/corporate-functions/CorporateFunctionsLogistics";
import { CorporateFunctionsTechRider } from "@/components/corporate-functions/CorporateFunctionsTechRider";
import { CorporateFunctionsFAQ } from "@/components/corporate-functions/CorporateFunctionsFAQ";
import { ScrollRevealRefresh } from "@/components/ui/ScrollRevealRefresh";

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
