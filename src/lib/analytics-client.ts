"use client";

/**
 * Cookieless first-party analytics client.
 *
 * A random session id lives in sessionStorage (one tab, one visit), so nothing
 * follows the visitor across sites or days. Do Not Track is honoured. Sends
 * use navigator.sendBeacon so navigation is never delayed; failures are
 * silent because analytics must never affect the site.
 */

const SESSION_KEY = "stamer.session";
const ENDPOINT = "/api/t";

function randomId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function trackingDisabled(): boolean {
  if (typeof window === "undefined") return true;
  if (navigator.doNotTrack === "1") return true;
  return false;
}

export function getSessionId(): string | null {
  if (trackingDisabled()) return null;
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = randomId();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return null;
  }
}

function deviceClass(): "mobile" | "tablet" | "desktop" {
  const width = window.innerWidth;
  if (width < 640) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function send(payload: Record<string, unknown>): void {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(ENDPOINT, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch {
    // Analytics never surfaces errors to the visitor.
  }
}

export function trackPageView(path: string): void {
  const sessionId = getSessionId();
  if (!sessionId) return;
  const url = new URL(window.location.href);
  let referrerHost: string | null = null;
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname : null;
    if (referrerHost === window.location.hostname) referrerHost = null;
  } catch {
    referrerHost = null;
  }
  send({
    kind: "view",
    sessionId,
    path,
    referrerHost,
    utmSource: url.searchParams.get("utm_source"),
    utmMedium: url.searchParams.get("utm_medium"),
    utmCampaign: url.searchParams.get("utm_campaign"),
    device: deviceClass(),
    viewportWidth: window.innerWidth,
  });
}

export function trackEvent(name: string, props: Record<string, string | number | boolean | null> = {}): void {
  const sessionId = getSessionId();
  if (!sessionId) return;
  send({ kind: "event", sessionId, name, path: window.location.pathname, props });
}
