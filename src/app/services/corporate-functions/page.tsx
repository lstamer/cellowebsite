import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CorporateFunctionsHero } from "@/components/corporate-functions/CorporateFunctionsHero";
import { CorporateFunctionsDeferredSections } from "@/components/corporate-functions/CorporateFunctionsDeferredSections";
import { CTA } from "@/components/CTA";

export const metadata: Metadata = {
  title: "Corporate Event Cellist in Cape Town | Stamer Cello",
};

export default function CorporateFunctionsPage() {
  return (
    <main id="main" className="relative bg-background">
      <Navbar heroVariant="dark" />
      <CorporateFunctionsHero />
      <div className="relative z-[2] bg-background">
        <CorporateFunctionsDeferredSections />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
