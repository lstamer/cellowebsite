"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { BookFlow } from "@/components/BookFlow";
import { BookingSuccess } from "@/components/book/BookingSuccess";
import { BookingFAQ } from "@/components/book/BookingFAQ";

export function BookPageClient() {
  const [submitted, setSubmitted] = useState(false);
  const [firstName, setFirstName] = useState("");

  function handleSuccess({ firstName: name }: { firstName: string }) {
    setFirstName(name);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <>
        <SectionWrapper
          maxWidth="max-w-5xl"
          className="pt-6 pb-0 md:pt-10"
        >
          <div className="flex w-full flex-col items-center">
            <BookingSuccess firstName={firstName} />
          </div>
        </SectionWrapper>
        <BookingFAQ />
      </>
    );
  }

  return (
    <SectionWrapper
      maxWidth="max-w-5xl"
      className="pt-6 pb-section-y md:pt-10 md:pb-section-y-md"
    >
      <div className="flex w-full flex-col items-center">
        <div className="mb-8 mt-4 w-full max-w-2xl text-center md:mb-10">
          <SectionHeader
            label="Get in contact"
            labelClassName="visible"
            heading="Let's chat about your event"
            alignment="center"
            className="mb-4 md:mb-4"
          />
          <p className="mx-auto max-w-xl font-sans text-lg leading-relaxed text-foreground/60">
            Share the essentials and I&apos;ll come back with availability,
            next steps, and the right live cello direction for the moment
            you&apos;re planning.
          </p>
        </div>

        <div className="mb-12 w-full max-w-2xl">
          <BookFlow onSuccess={handleSuccess} />
        </div>
      </div>
    </SectionWrapper>
  );
}
