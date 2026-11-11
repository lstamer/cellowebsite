import { BOOKING_DRAFT_DEADLINE_MS, type BookingContactDrafts } from "./contact-drafts";
import type { BookingProgress, BookingSnapshot } from "./progress";

/** Each retry reuses the same revision and, for a click, the same event ID. */
export async function saveBookingProgress(progress: BookingProgress): Promise<void> {
  const body = JSON.stringify(progress);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("/api/booking/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
        signal: AbortSignal.timeout?.(5_000),
      });
      if (response.status < 500) return;
    } catch {
      // Retry a dropped connection once. Progress never blocks the form.
    }
  }
}

export async function requestBookingDrafts(
  snapshot: BookingSnapshot,
  cancellation: AbortSignal,
): Promise<BookingContactDrafts | null> {
  if (cancellation.aborted) return null;
  const request = new AbortController();
  const started = performance.now();
  const cancel = () => request.abort();
  const timeout = setTimeout(cancel, BOOKING_DRAFT_DEADLINE_MS);
  cancellation.addEventListener("abort", cancel, { once: true });
  try {
    const response = await fetch("/api/booking/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
      signal: request.signal,
    });
    if (response.status !== 200) return null;
    const drafts: BookingContactDrafts = await response.json();
    if (request.signal.aborted || performance.now() - started >= BOOKING_DRAFT_DEADLINE_MS) return null;
    if (
      typeof drafts?.whatsapp !== "string" || !drafts.whatsapp ||
      typeof drafts.email?.subject !== "string" || !drafts.email.subject ||
      typeof drafts.email.body !== "string" || !drafts.email.body
    ) return null;
    return drafts;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    cancellation.removeEventListener("abort", cancel);
  }
}
