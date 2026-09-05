import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CTA } from "@/components/CTA";
import { GalleryLibrary } from "@/components/gallery/GalleryLibrary";

export const metadata: Metadata = {
  title: "Gallery | Stamer Cello",
  description:
    "Nine songs, three kinds of room. Watch live cello performances for weddings, celebrations, and corporate functions in Cape Town, then pick yours.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <main className="relative bg-background">
      <Navbar heroVariant="light" />
      <GalleryLibrary />
      <CTA />
      <Footer />
    </main>
  );
}
