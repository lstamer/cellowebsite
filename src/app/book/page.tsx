import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { BookPageDeferred } from "@/components/book/BookPageDeferred";
import { FAQJsonLd } from "@/components/ui/FAQJsonLd";
import { bookingFaqs } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "Check Availability",
  description:
    "Tell Luke about your event and check availability for live cello at your wedding, private event, or corporate function.",
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <>
      <FAQJsonLd faqs={bookingFaqs} />
      <Navbar />
      <main data-booking-page="true" className="min-h-dvh bg-cream pt-6 pb-20 lg:pt-16 lg:pb-24">
        <BookPageDeferred />
      </main>
    </>
  );
}
