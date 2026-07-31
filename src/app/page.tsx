import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { HomeDeferredSections } from "@/components/home/HomeDeferredSections";

export default function Home() {
  return (
    <main className="relative bg-background">
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
