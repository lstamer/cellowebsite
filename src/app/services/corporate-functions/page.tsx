import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CorporateFunctionsHero } from "@/components/corporate-functions/CorporateFunctionsHero";
import { CorporateFunctionsDeferredSections } from "@/components/corporate-functions/CorporateFunctionsDeferredSections";
import { CTA } from "@/components/CTA";
import { FAQJsonLd } from "@/components/ui/FAQJsonLd";
import { corporateFaqs } from "@/lib/faqs";

export default function CorporateFunctionsPage() {
  return (
    <main className="relative bg-background">
      <FAQJsonLd faqs={corporateFaqs} />
      <Navbar heroVariant="dark" />
      <CorporateFunctionsHero />
      <div className="relative z-[2] bg-background">
        <CorporateFunctionsDeferredSections />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
