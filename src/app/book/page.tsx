import { Navbar } from "@/components/Navbar";
import { BookPageDeferred } from "@/components/book/BookPageDeferred";
import { FAQJsonLd } from "@/components/ui/FAQJsonLd";
import { bookingFaqs } from "@/lib/faqs";

export default function BookPage() {
  return (
    <>
      <FAQJsonLd faqs={bookingFaqs} />
      <Navbar />
      <main className="min-h-dvh bg-cream pt-6 pb-20 lg:pt-16 lg:pb-24">
        <BookPageDeferred />
      </main>
    </>
  );
}
