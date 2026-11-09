import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HotelsPage } from "@/components/hotels/HotelsPage";

const pagePath = "/services/hotels";
const title = "Live Cello for Hotels & Estates";
const description =
  "Recurring live cello for hotels and estates in Cape Town and the Winelands. Music that grows with your guests, beginning with a private audition with Luke Stamer.";
const socialImage = {
  url: "/images/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "A cello in a garden setting",
};

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: pagePath },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    siteName: "Luke Stamer Cello",
    title,
    description,
    url: pagePath,
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImage],
  },
};

export default function HotelsServicePage() {
  return (
    <div className="relative overflow-x-clip bg-background">
      <Navbar heroVariant="light" />
      <main>
        <HotelsPage />
      </main>
      <Footer />
    </div>
  );
}
