import dynamic from "next/dynamic";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WeddingHero } from "@/components/weddings/WeddingHero";
import { WeddingScrollRefresh } from "@/components/weddings/WeddingScrollRefresh";
import { CTA } from "@/components/CTA";

const WeddingValue = dynamic(
  () =>
    import("@/components/weddings/WeddingValue").then((mod) => ({
      default: mod.WeddingValue,
    })),
  { ssr: true }
);

const WeddingImportance = dynamic(
  () =>
    import("@/components/weddings/WeddingImportance").then((mod) => ({
      default: mod.WeddingImportance,
    })),
  { ssr: true }
);

const WeddingBenefits = dynamic(
  () =>
    import("@/components/weddings/WeddingBenefits").then((mod) => ({
      default: mod.WeddingBenefits,
    })),
  { ssr: true }
);

const WeddingLogistics = dynamic(
  () =>
    import("@/components/weddings/WeddingLogistics").then((mod) => ({
      default: mod.WeddingLogistics,
    })),
  { ssr: true }
);

const WeddingFAQ = dynamic(
  () =>
    import("@/components/weddings/WeddingFAQ").then((mod) => ({
      default: mod.WeddingFAQ,
    })),
  { ssr: true }
);

export default function WeddingsPage() {
  return (
    <main className="relative bg-background">
      <WeddingScrollRefresh />
      <Navbar heroVariant="dark" />
      <WeddingHero />
      <div className="relative z-[2] bg-background">
        <WeddingValue />
        <WeddingImportance />
        <WeddingBenefits />
        <WeddingLogistics />
        <WeddingFAQ />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
