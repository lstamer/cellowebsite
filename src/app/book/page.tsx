import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { BookPageDeferred } from "@/components/book/BookPageDeferred";

export const metadata: Metadata = {
  title: "Book Luke | Stamer Cello",
};

export default function BookPage() {
  return (
    <>
      <Navbar />
      <main id="main" className="min-h-dvh bg-background pt-6 pb-20 lg:pt-16 lg:pb-24">
        <BookPageDeferred />
      </main>
    </>
  );
}
