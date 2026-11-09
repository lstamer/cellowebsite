"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { I18nProvider } from "react-aria-components";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { BookFlow, type BookAudience, type ContactPreference } from "@/components/BookFlow";
import { BookingSuccess } from "@/components/book/BookingSuccess";
import { BookingFAQ } from "@/components/book/BookingFAQ";

import {
  EVENT_TYPES,
  LEGACY_EVENT_TYPE_ALIASES,
  type EventType,
} from "@/lib/booking/build-message";

const AUDIENCES: readonly BookAudience[] = ["planner", "expo", "coordinator", "self"];

function resolveEventType(value: string | null) {
  if (value === null) return undefined;
  if ((EVENT_TYPES as readonly string[]).includes(value)) {
    return value as Exclude<EventType, "">;
  }
  return Object.hasOwn(LEGACY_EVENT_TYPE_ALIASES, value)
    ? LEGACY_EVENT_TYPE_ALIASES[value]
    : undefined;
}

function isAudience(value: string | null): value is BookAudience {
  return value !== null && (AUDIENCES as readonly string[]).includes(value);
}

function BookingQuery({
  onRead,
}: {
  onRead: (params: ReadonlyURLSearchParams) => void;
}) {
  const params = useSearchParams();
  useEffect(() => onRead(params), [onRead, params]);
  return null;
}

export function BookPageClient() {
  const [params, setParams] = useState<ReadonlyURLSearchParams | null>(null);
  const initialEventType = resolveEventType(params?.get("type") ?? null);
  const audienceParam = params?.get("for") ?? null;
  const audience = isAudience(audienceParam) ? audienceParam : undefined;

  return (
    <>
      {/* Resolve URL presets separately so the form HTML can stay static. */}
      <Suspense fallback={null}>
        <BookingQuery onRead={setParams} />
      </Suspense>
      <BookingContent
        key={`${initialEventType ?? ""}:${audience ?? ""}`}
        initialEventType={initialEventType}
        audience={audience}
        isReady={params !== null}
      />
    </>
  );
}

function BookingContent({
  initialEventType,
  audience,
  isReady,
}: {
  initialEventType?: EventType;
  audience?: BookAudience;
  isReady: boolean;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [contactPreference, setContactPreference] = useState<ContactPreference>("whatsapp");

  function handleSuccess({
    firstName: name,
    contactPreference: preference,
  }: {
    firstName: string;
    contactPreference: ContactPreference;
  }) {
    setFirstName(name);
    setContactPreference(preference);
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
            <BookingSuccess firstName={firstName} contactPreference={contactPreference} />
          </div>
        </SectionWrapper>
        <BookingFAQ heading="Common questions while you wait" />
      </>
    );
  }

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
              Give me the essentials and I&apos;ll come straight back with my
              availability, the next steps, and a sense of what the cello could do
              for the moment you&apos;re planning.
            </p>
          </div>

          <div className="mb-12 w-full max-w-5xl rounded-card border border-primary/10 bg-background p-5 shadow-card sm:p-8 md:p-10">
            <I18nProvider locale="en-ZA">
              <BookFlow
                onSuccess={handleSuccess}
                initialEventType={initialEventType}
                audience={audience}
                isReady={isReady}
              />
            </I18nProvider>
          </div>
        </div>
      </SectionWrapper>
      <BookingFAQ />
    </>
  );
}
