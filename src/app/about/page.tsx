import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CTA } from "@/components/CTA";
import { AboutBioContent } from "@/components/about/AboutBioContent";

export const metadata: Metadata = {
  title: "About Luke Stamer",
  description:
    "Meet Luke Stamer, a Cape Town cellist who brings classical training, a wide-ranging repertoire, and calm event logistics to weddings and events.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="relative bg-background">
      <Navbar />
      <AboutBioContent />
      <CTA />
      <Footer />
    </main>
  );
}
