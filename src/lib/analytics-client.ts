/**
 * Browser-side helpers for the first-party analytics beacon. Pure DOM APIs,
 * safe to import from client components only.
 */

const SESSION_KEY = "sc_sid";

function randomId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

/** A random per-tab id in sessionStorage. Null when storage is unavailable. */
export function getAnalyticsSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing;
    const created = randomId();
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return null;
  }
}

/** Funnel events: `book_step_2`, `book_submitted`, `whatsapp_click`, ... */
export function trackSiteEvent(name: string, props: Record<string, string | number | boolean | null> = {}): void {
  if (typeof window === "undefined") return;
  if (window.navigator.webdriver) return;
  const sessionId = getAnalyticsSessionId();
  if (!sessionId) return;

  const body = JSON.stringify({
    t: "event",
    sid: sessionId,
    name,
    path: window.location.pathname,
    props,
  });

  try {
    if (!navigator.sendBeacon?.("/api/t", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/t", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
    }
  } catch {
    // never throw from analytics
  }
}
