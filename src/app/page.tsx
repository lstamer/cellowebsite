import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { HomeDeferredSections } from "@/components/home/HomeDeferredSections";
import { PUBLIC_EMAIL } from "@/lib/email";
import { PUBLIC_WHATSAPP_NUMBER } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Live Cello for Weddings & Events",
  description:
    "Cape Town cellist Luke Stamer brings live music to weddings, private events, and corporate functions. Classical and modern, played live. Effortless live music, handled.",
  alternates: { canonical: "/" },
};

function HomeJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://stamer.co.za/#luke-stamer",
    name: "Luke Stamer",
    url: "https://stamer.co.za/",
    image: "https://stamer.co.za/images/og-default.jpg",
    jobTitle: "Professional cellist",
    description:
      "Cape Town cellist performing live music at weddings, private events, and corporate functions.",
    email: PUBLIC_EMAIL,
    telephone: `+${PUBLIC_WHATSAPP_NUMBER}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Cape Town",
      addressRegion: "Western Cape",
      addressCountry: "ZA",
    },
    areaServed: [
      { "@type": "City", name: "Cape Town" },
      { "@type": "AdministrativeArea", name: "Western Cape" },
      { "@type": "Country", name: "South Africa" },
    ],
    knowsAbout: [
      "Live cello performance",
      "Wedding music",
      "Private event music",
      "Corporate event music",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export default function Home() {
  return (
    <main className="relative bg-background">
      <HomeJsonLd />
      <Navbar heroVariant="dark" />
      <Hero />
      <div className="bg-background">
        <Services />
        <HomeDeferredSections />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
