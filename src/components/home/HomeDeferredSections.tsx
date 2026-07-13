"use client";

import dynamic from "next/dynamic";
import { Problem } from "@/components/Problem";
import { BelowFoldSectionSkeleton } from "@/components/ui/BelowFoldSectionSkeleton";
import { ScrollRevealRefresh } from "@/components/ui/ScrollRevealRefresh";

const About = dynamic(
  () => import("@/components/About").then((mod) => ({ default: mod.About })),
  { loading: BelowFoldSectionSkeleton }
);

const Solution = dynamic(
  () => import("@/components/Solution").then((mod) => ({ default: mod.Solution })),
  { loading: BelowFoldSectionSkeleton }
);

const Testimonials = dynamic(
  () => import("@/components/Testimonials").then((mod) => ({ default: mod.Testimonials })),
  { loading: BelowFoldSectionSkeleton }
);

export function HomeDeferredSections() {
  return (
    <>
      <ScrollRevealRefresh />
      <About />
      <Problem />
      <Solution />
      <Testimonials />
    </>
  );
}
