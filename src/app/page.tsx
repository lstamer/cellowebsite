import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Services } from "@/components/Services";
import { Problem } from "@/components/Problem";
import { Solution } from "@/components/Solution";
import { Testimonials } from "@/components/Testimonials";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative bg-background">
      <Navbar />
      <Hero />
      <About />
      <Services />
      <Problem />
      <Solution />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
