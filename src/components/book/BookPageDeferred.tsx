"use client";

import dynamic from "next/dynamic";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

function BookPageSkeleton() {
  return (
    <SectionWrapper className="min-h-[40rem] bg-foreground/5" aria-hidden>
      <span className="sr-only">Loading booking form</span>
    </SectionWrapper>
  );
}

const BookPageClient = dynamic(
  () => import("@/components/book/BookPageClient").then((mod) => ({ default: mod.BookPageClient })),
  { ssr: false, loading: BookPageSkeleton }
);

export function BookPageDeferred() {
  return <BookPageClient />;
}
