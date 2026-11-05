"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";
import { cn } from "@/lib/utils";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";

type SignatureDesign = "original" | "familiarity";

const designs: { value: SignatureDesign; label: string }[] = [
  { value: "original", label: "Original" },
  { value: "familiarity", label: "Growing familiarity" },
];

const firstVisitCopy =
  "A guest walks in for the first time. They hear a performance shaped by everything I've learned on the previous twelve visits. The songs, the timing, the feeling of that particular room.";

function SignatureContent({ showProgression = false }: { showProgression?: boolean }) {
  return (
    <>
      <SectionHeader
        label="Imagine a few months from now"
        alignment="left"
        className="mb-10 md:mb-12"
        labelClassName="text-on-dark/70"
        headingClassName="max-w-5xl text-[2.75rem] leading-[1.02] text-on-dark md:text-[clamp(3.5rem,5.4vw,5.5rem)] lg:text-[clamp(3.5rem,5.4vw,5.5rem)]"
        heading={
          <>
            My thirteenth visit.{" "}
            <br />
            Their{" "}
            <HandDrawnUnderline variant={1} underlineClassName="text-accent" textClassName="text-on-dark">
              first impression.
            </HandDrawnUnderline>
          </>
        }
      />
      {showProgression && <FamiliarityProgression />}
      <div className="border-t border-on-dark/20 pt-8">
        <p className="max-w-xl font-sans text-lg leading-relaxed text-on-dark/85">
          {firstVisitCopy}
        </p>
      </div>
    </>
  );
}

const familiarityStages = [
  {
    when: "First visits",
    title: "Learn the room",
    detail: "I get to know your space and what your guests respond to.",
  },
  {
    when: "Returning regularly",
    title: "Refine the feeling",
    detail: "I build on that with song choices, timing and energy.",
  },
  {
    when: "The thirteenth visit",
    title: "A sound of your own",
    detail: "The music starts to feel like part of your property.",
  },
];

function FamiliarityProgression() {
  return (
    <figure className="mb-10 md:mb-12" aria-label="An illustration of familiarity growing over repeated visits">
      <div className="mb-5 flex items-baseline justify-between gap-6 font-sans text-sm text-on-dark/70">
        <p>Getting to know your property</p>
        <p className="shrink-0">Visit by visit</p>
      </div>
      {/* Qualitative progression: the curve carries no measured values or numerical axes. */}
      <svg viewBox="0 0 300 150" fill="none" className="mb-5 block w-full overflow-visible text-accent sm:hidden" aria-hidden="true">
        <path d="M12 130 C66 130 98 105 150 80 S238 20 288 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="12" cy="130" r="4" className="fill-surface-dark" stroke="currentColor" strokeWidth="2" />
        <circle cx="150" cy="80" r="4" className="fill-surface-dark" stroke="currentColor" strokeWidth="2" />
        <circle cx="288" cy="20" r="5" fill="currentColor" />
      </svg>
      <svg viewBox="0 0 1000 180" fill="none" className="mb-6 hidden w-full overflow-visible text-accent sm:block" aria-hidden="true">
        <path d="M12 160 C195 160 290 125 500 95 S790 20 988 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <circle cx="12" cy="160" r="5" className="fill-surface-dark" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <circle cx="500" cy="95" r="5" className="fill-surface-dark" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <circle cx="988" cy="20" r="6" fill="currentColor" />
      </svg>
      <ol className="grid list-none gap-5 p-0 sm:grid-cols-3 sm:gap-8">
        {familiarityStages.map((stage, index) => (
          <li key={stage.when} className={cn(
            "grid grid-cols-[0.8fr_1.2fr] gap-5 border-t border-on-dark/20 pt-4 sm:block sm:border-0 sm:pt-0",
            index === 1 && "sm:text-center",
            index === 2 && "sm:text-right"
          )}>
            <p className="font-sans text-sm leading-relaxed text-on-dark/65 sm:mb-3">{stage.when}</p>
            <div>
              <h3 className={cn(featureItemTitleClass, "text-on-dark")}>{stage.title}</h3>
              <p className={cn(
                featureItemBodyClass,
                "mt-2 text-on-dark/75 sm:max-w-[25ch]",
                index === 1 && "sm:mx-auto",
                index === 2 && "sm:ml-auto"
              )}>{stage.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <figcaption className="mt-6 font-sans text-xs leading-relaxed text-on-dark/65">
        An illustration of how familiarity can grow over time.
      </figcaption>
    </figure>
  );
}

export function HotelSignature() {
  const [design, setDesign] = useState<SignatureDesign>("original");

  return (
    <SectionWrapper id="a-signature" surface="dark" maxWidth="max-w-none" className="scroll-mt-16 text-on-dark">
      <div className="mx-auto max-w-7xl">
        {/* Local comparison controls. Remove this group and retain the chosen layout when approved. */}
        <div className="mb-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-on-dark/20 pb-6 md:mb-12">
          <p className="font-sans text-sm text-on-dark/75">Compare designs</p>
          <div role="group" aria-label="Signature section design" className="flex flex-wrap gap-2">
            {designs.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={design === option.value}
                aria-controls="hotel-signature-preview"
                onClick={() => setDesign(option.value)}
                className={cn(
                  "min-h-11 rounded-full border px-[1.2em] py-[0.65em] font-sans text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-dark motion-reduce:transition-none",
                  design === option.value
                    ? "border-cream bg-cream text-primary"
                    : "border-on-dark/40 bg-surface-dark text-on-dark hover:border-on-dark hover:bg-primary"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div id="hotel-signature-preview">
          <SignatureContent showProgression={design === "familiarity"} />
        </div>
        <p role="status" className="sr-only">
          Showing {designs.find((option) => option.value === design)?.label} design.
        </p>
      </div>
    </SectionWrapper>
  );
}
