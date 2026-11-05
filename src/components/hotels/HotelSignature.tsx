"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";
import { cn } from "@/lib/utils";

type SignatureDesign = "original" | "perspectives";

const designs: { value: SignatureDesign; label: string }[] = [
  { value: "original", label: "Original" },
  { value: "perspectives", label: "Two perspectives" },
];

const firstVisitCopy =
  "A guest walks in for the first time. They hear a performance shaped by everything I've learned on the previous twelve visits. The songs, the timing, the feeling of that particular room.";

const signatureCopy = [
  "Before long, those details add up to a sound that belongs to your property. The first notes on the terrace at sundown might become as familiar as the view.",
  "It gives guests a story to tell and something to look forward to on their next visit.",
  "Even one extra night, a recommendation or an event booking can give the music value beyond that evening.",
];

function OriginalSignature() {
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
      <div className="grid gap-8 border-t border-on-dark/20 pt-8 md:grid-cols-2 md:gap-16">
        <p className="max-w-xl font-sans text-lg leading-relaxed text-on-dark/85">
          {firstVisitCopy}
        </p>
        <div className="max-w-xl space-y-4 font-sans text-base leading-relaxed text-on-dark/75">
          {signatureCopy.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </div>
    </>
  );
}

function TwoPerspectivesSignature() {
  return (
    <div className="grid items-stretch lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex flex-col pb-10 lg:pb-8 lg:pr-14">
        <SectionHeader
          label="Imagine a few months from now"
          alignment="left"
          className="mb-8 md:mb-10"
          labelClassName="text-on-dark/70"
          headingClassName="max-w-lg text-[3rem] leading-[0.98] text-on-dark md:text-[4rem] lg:text-[4.5rem]"
          heading={<>My thirteenth<br />visit.</>}
        />
        <p className="max-w-lg font-sans text-lg leading-relaxed text-on-dark/85">
          {firstVisitCopy}
        </p>
        <div className="mt-10 lg:mt-auto lg:pt-12">
          <p className="mb-4 font-sans text-sm text-on-dark/70">Twelve visits of getting to know your guests.</p>
          <div aria-hidden="true" className="grid grid-cols-6 gap-x-4 gap-y-4 sm:grid-cols-12 sm:gap-x-2 lg:grid-cols-6 lg:gap-x-5">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} className="border-t border-on-dark/30 pt-3 font-serif text-2xl italic leading-none text-on-dark/75">
                {String(index + 1).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="-mx-6 flex flex-col bg-cream px-6 py-10 text-foreground md:-mx-12 md:px-12 md:py-12 lg:mx-0 lg:px-10 lg:py-10 xl:px-12">
        <SectionHeader
          label="For a new guest"
          alignment="left"
          className="mb-8 md:mb-10"
          headingClassName="text-[3rem] leading-[0.98] md:text-[4rem] lg:text-[4.5rem]"
          heading={
            <>
              Their first<br />
              <HandDrawnUnderline variant={1} underlineClassName="text-accent">
                impression.
              </HandDrawnUnderline>
            </>
          }
        />
        <div className="max-w-lg space-y-5 font-sans text-base leading-relaxed text-foreground/75">
          {signatureCopy.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </div>
    </div>
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
          {design === "original" ? <OriginalSignature /> : <TwoPerspectivesSignature />}
        </div>
        <p role="status" className="sr-only">
          Showing {designs.find((option) => option.value === design)?.label} design.
        </p>
      </div>
    </SectionWrapper>
  );
}
