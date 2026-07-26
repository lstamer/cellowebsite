import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PrivateEventsHero } from "@/components/private-events/PrivateEventsHero";
import { PrivateEventsDeferredSections } from "@/components/private-events/PrivateEventsDeferredSections";
import { CTA } from "@/components/CTA";

export const metadata: Metadata = {
  title: "Private Event Cellist in Cape Town | Stamer Cello",
};

export default function PrivateEventsPage() {
  return (
    <main id="main" className="relative bg-background">
      <Navbar heroVariant="dark" />
      <PrivateEventsHero />
      <div className="relative z-[2] bg-background">
        <PrivateEventsDeferredSections />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
