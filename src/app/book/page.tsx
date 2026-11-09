import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { BookPageClient } from "@/components/book/BookPageClient";
import type { BookAudience } from "@/components/BookFlow";
import { ScrollRevealRefresh } from "@/components/ui/ScrollRevealRefresh";
import {
  EVENT_TYPES,
  LEGACY_EVENT_TYPE_ALIASES,
  type EventType,
} from "@/lib/booking/build-message";
import { FAQJsonLd } from "@/components/ui/FAQJsonLd";
import { bookingFaqs } from "@/lib/faqs";

export const metadata: Metadata = {
  title: "Check Availability",
  description:
    "Tell Luke about your event and check availability for live cello at your wedding, private event, or corporate function.",
  alternates: { canonical: "/book" },
};

const AUDIENCES: readonly BookAudience[] = ["planner", "expo", "coordinator", "self"];

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveEventType(value: string | undefined) {
  if (value === undefined) return undefined;
  if ((EVENT_TYPES as readonly string[]).includes(value)) {
    return value as Exclude<EventType, "">;
  }
  return Object.hasOwn(LEGACY_EVENT_TYPE_ALIASES, value)
    ? LEGACY_EVENT_TYPE_ALIASES[value]
    : undefined;
}

function isAudience(value: string | undefined): value is BookAudience {
  return value !== undefined && (AUDIENCES as readonly string[]).includes(value);
}

export default async function BookPage({ searchParams }: PageProps<"/book">) {
  const params = await searchParams;
  const initialEventType = resolveEventType(firstValue(params.type));
  const audienceParam = firstValue(params.for);
  const audience = isAudience(audienceParam) ? audienceParam : undefined;
  return (
    <>
      <FAQJsonLd faqs={bookingFaqs} />
      <Navbar />
      <main data-booking-page="true" className="min-h-dvh bg-cream pt-6 pb-20 lg:pt-16 lg:pb-24">
        <ScrollRevealRefresh />
        <BookPageClient
          key={`${initialEventType ?? ""}:${audience ?? ""}`}
          initialEventType={initialEventType}
          audience={audience}
        />
      </main>
    </>
  );
}
