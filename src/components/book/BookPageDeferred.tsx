"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ScrollRevealRefresh } from "@/components/ui/ScrollRevealRefresh";
import type { BookAudience } from "@/components/BookFlow";
import {
  EVENT_TYPES,
  LEGACY_EVENT_TYPE_ALIASES,
  type EventType,
} from "@/lib/booking/build-message";

type FunnelEventType = Exclude<EventType, "">;

const AUDIENCES: readonly BookAudience[] = ["planner", "expo", "coordinator", "self"];

/**
 * Resolves the funnel `?type=` value (Contract 2) against the current event
 * types, falling back to the legacy aliases so older links still work.
 * Anything else is ignored.
 */
function resolveEventType(value: string | null): FunnelEventType | undefined {
  if (value === null) return undefined;
  if ((EVENT_TYPES as readonly string[]).includes(value)) return value as FunnelEventType;
  return LEGACY_EVENT_TYPE_ALIASES[value];
}

function isAudience(value: string | null): value is BookAudience {
  return value !== null && (AUDIENCES as readonly string[]).includes(value);
}

function BookPageSkeleton() {
  return (
    <SectionWrapper surface="cream" className="min-h-[40rem]" aria-hidden>
      <span className="sr-only">Loading booking form</span>
    </SectionWrapper>
  );
}

const BookPageClient = dynamic(
  () => import("@/components/book/BookPageClient").then((mod) => ({ default: mod.BookPageClient })),
  { ssr: false, loading: BookPageSkeleton }
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

  const initialEventType = resolveEventType(typeParam);
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
