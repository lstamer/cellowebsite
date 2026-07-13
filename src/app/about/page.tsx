import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CTA } from "@/components/CTA";
import { AboutBioContent } from "@/components/about/AboutBioContent";

export default function AboutPage() {
  return (
    <main id="main" className="relative bg-background">
      <Navbar />
      <AboutBioContent />
      <CTA />
      <Footer />
    </main>
  );
}
