"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ScrollRevealRefresh } from "@/components/ui/ScrollRevealRefresh";
import type { BookAudience } from "@/components/BookFlow";

type EventType =
  | "wedding"
  | "private-event"
  | "corporate-event"
  | "fundraiser"
  | "something-else";

// Allowed funnel values (Contract 2). Anything else is ignored.
const EVENT_TYPES: readonly EventType[] = [
  "wedding",
  "private-event",
  "corporate-event",
  "fundraiser",
  "something-else",
];
const AUDIENCES: readonly BookAudience[] = ["planner", "expo", "coordinator", "self"];

function isEventType(value: string | null): value is EventType {
  return value !== null && (EVENT_TYPES as readonly string[]).includes(value);
}

function isAudience(value: string | null): value is BookAudience {
  return value !== null && (AUDIENCES as readonly string[]).includes(value);
}

function BookPageSkeleton() {
  return (
    <SectionWrapper className="min-h-[40rem] bg-cream" aria-hidden>
      <span className="sr-only">Loading booking form</span>
    </SectionWrapper>
  );
}

// No `loading` option: the outer <Suspense fallback={<BookPageSkeleton />}> already
// covers the pending state. Double-deferring caused a useId hydration mismatch.
const BookPageClient = dynamic(() =>
  import("@/components/book/BookPageClient").then((mod) => ({ default: mod.BookPageClient }))
);

/**
 * Reads the funnel URL params (`?type=…&for=…`, Contract 2), validates them
 * against the allowed values, and threads the resolved values into the form.
 * `useSearchParams` must sit under a <Suspense> boundary in the App Router.
 */
function BookFlowWithParams() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const forParam = searchParams.get("for");

  const initialEventType = isEventType(typeParam) ? typeParam : undefined;
  const audience = isAudience(forParam) ? forParam : undefined;

  return <BookPageClient initialEventType={initialEventType} audience={audience} />;
}

export function BookPageDeferred() {
  return (
    <>
      <ScrollRevealRefresh />
      <Suspense fallback={<BookPageSkeleton />}>
        <BookFlowWithParams />
      </Suspense>
    </>
  );
}
