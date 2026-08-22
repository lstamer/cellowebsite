import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PricingPage } from "@/components/pricing/PricingPage";
import { FAQJsonLd } from "@/components/ui/FAQJsonLd";
import { pricingFaqs, pricingPackages } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Cello Packages & Pricing | Stamer Cello",
  description:
    "Compare Essential, Signature, and Concierge live cello packages for weddings, private events, and corporate functions in Cape Town and beyond.",
  alternates: { canonical: "/pricing" },
};

function PricingJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Stamer Cello performance packages",
    itemListElement: pricingPackages.map((pkg) => ({
      "@type": "Offer",
      name: `${pkg.name} cello package`,
      description: pkg.shortDescription,
      price: pkg.price.replace(/[^\d]/g, ""),
      priceCurrency: "ZAR",
      availability: "https://schema.org/LimitedAvailability",
      url: `https://stamer.co.za/pricing#${pkg.id}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function PricingRoute() {
  return (
    <main className="relative bg-background">
      <FAQJsonLd faqs={pricingFaqs} />
      <PricingJsonLd />
      <Navbar heroVariant="light" />
      <PricingPage />
      <Footer />
    </main>
  );
}
