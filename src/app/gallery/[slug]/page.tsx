import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CTA } from "@/components/CTA";
import { GalleryDetail } from "@/components/gallery/GalleryDetail";
import { GALLERY_ITEMS, getGalleryCategory, getGalleryItem, getRelatedItems } from "@/lib/gallery";

interface GalleryItemPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return GALLERY_ITEMS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: GalleryItemPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getGalleryItem(slug);
  if (!item) return { title: "Not found | Stamer Cello" };

  const category = getGalleryCategory(item.category);
  return {
    title: `${item.title} on cello | ${category.label} | Stamer Cello`,
    description: item.blurb,
    alternates: { canonical: `/gallery/${item.slug}` },
  };
}

export default async function GalleryItemPage({ params }: GalleryItemPageProps) {
  const { slug } = await params;
  const item = getGalleryItem(slug);
  if (!item) notFound();

  return (
    <main className="relative bg-background">
      <Navbar heroVariant="light" />
      <GalleryDetail item={item} related={getRelatedItems(item)} />
      <CTA />
      <Footer />
    </main>
  );
}
