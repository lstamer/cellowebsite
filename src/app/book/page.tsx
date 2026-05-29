import { Navbar } from "@/components/Navbar";
import { BookPageClient } from "@/components/book/BookPageClient";

export default function BookPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-dvh bg-background pt-6 pb-20 lg:pt-16 lg:pb-24">
        <BookPageClient />
      </main>
    </>
  );
}
