"use client";

import dynamic from "next/dynamic";
import { Problem } from "@/components/Problem";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

function BelowFoldSectionSkeleton() {
  return (
    <SectionWrapper className="min-h-[28rem] bg-foreground/5" aria-hidden>
      <span className="sr-only">Loading section</span>
    </SectionWrapper>
  );
}

const About = dynamic(
  () => import("@/components/About").then((mod) => ({ default: mod.About })),
  { ssr: false, loading: BelowFoldSectionSkeleton }
);

const Solution = dynamic(
  () => import("@/components/Solution").then((mod) => ({ default: mod.Solution })),
  { ssr: false, loading: BelowFoldSectionSkeleton }
);

const Testimonials = dynamic(
  () => import("@/components/Testimonials").then((mod) => ({ default: mod.Testimonials })),
  { ssr: false, loading: BelowFoldSectionSkeleton }
);

export function HomeDeferredSections() {
  return (
    <>
      <About />
      <Problem />
      <Solution />
      <Testimonials />
    </>
  );
}
