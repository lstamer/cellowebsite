"use client";

import { I18nProvider } from "react-aria-components";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { BookFlow, type BookAudience } from "@/components/BookFlow";
import { BookingFAQ } from "@/components/book/BookingFAQ";

import type { EventType } from "@/lib/booking/build-message";

interface BookPageClientProps {
  initialEventType?: EventType;
  audience?: BookAudience;
}

export function BookPageClient({ initialEventType, audience }: BookPageClientProps = {}) {
  return (
    <>
      <SectionWrapper
        maxWidth="max-w-5xl"
        className="pt-6 pb-section-y md:pt-10 md:pb-section-y-md"
      >
        <div className="flex w-full flex-col items-center">
          <div className="mb-8 mt-4 w-full max-w-2xl text-center md:mb-10">
            <SectionHeader
              as="h1"
              label="Check my date"
              labelClassName="visible"
              heading="Tell me about your event"
              alignment="center"
              className="mb-4 md:mb-4"
            />
            <p className="mx-auto max-w-xl font-sans text-lg leading-relaxed text-foreground/70">
              Share the essentials, then send me your enquiry by WhatsApp or email. I&apos;ll come back with my availability and the next steps.
            </p>
          </div>

          <div className="mb-12 w-full max-w-5xl rounded-card border border-primary/10 bg-background p-5 shadow-card sm:p-8 md:p-10">
            <I18nProvider locale="en-ZA">
              <BookFlow
                initialEventType={initialEventType}
                audience={audience}
              />
            </I18nProvider>
          </div>
        </div>
      </SectionWrapper>
      <BookingFAQ />
    </>
  );
}
