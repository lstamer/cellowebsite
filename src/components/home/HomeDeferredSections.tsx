"use client";

import { About } from "@/components/About";
import { Problem } from "@/components/Problem";
import { Solution } from "@/components/Solution";
import { Testimonials } from "@/components/Testimonials";
import { ScrollRevealRefresh } from "@/components/ui/ScrollRevealRefresh";

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
