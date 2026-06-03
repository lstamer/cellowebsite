import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PrivateEventsHero } from "@/components/private-events/PrivateEventsHero";
import { PrivateEventsScrollRefresh } from "@/components/private-events/PrivateEventsScrollRefresh";
import { CTA } from "@/components/CTA";

const PrivateEventsOccasions = dynamic(
  () =>
    import("@/components/private-events/PrivateEventsOccasions").then((mod) => ({
      default: mod.PrivateEventsOccasions,
    })),
  { ssr: true }
);

const PrivateEventsValue = dynamic(
  () =>
    import("@/components/private-events/PrivateEventsValue").then((mod) => ({
      default: mod.PrivateEventsValue,
    })),
  { ssr: true }
);

const PrivateEventsImportance = dynamic(
  () =>
    import("@/components/private-events/PrivateEventsImportance").then((mod) => ({
      default: mod.PrivateEventsImportance,
    })),
  { ssr: true }
);

const PrivateEventsBenefits = dynamic(
  () =>
    import("@/components/private-events/PrivateEventsBenefits").then((mod) => ({
      default: mod.PrivateEventsBenefits,
    })),
  { ssr: true }
);

const PrivateEventsLogistics = dynamic(
  () =>
    import("@/components/private-events/PrivateEventsLogistics").then((mod) => ({
      default: mod.PrivateEventsLogistics,
    })),
  { ssr: true }
);

const PrivateEventsFAQ = dynamic(
  () =>
    import("@/components/private-events/PrivateEventsFAQ").then((mod) => ({
      default: mod.PrivateEventsFAQ,
    })),
  { ssr: true }
);

export default function PrivateEventsPage() {
  return (
    <main className="relative bg-background">
      <PrivateEventsScrollRefresh />
      <Navbar heroVariant="dark" />
      <PrivateEventsHero />
      <div className="relative z-[2] bg-background">
        <PrivateEventsOccasions />
        <PrivateEventsValue />
        <PrivateEventsImportance />
        <PrivateEventsBenefits />
        <PrivateEventsLogistics />
        <PrivateEventsFAQ />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
