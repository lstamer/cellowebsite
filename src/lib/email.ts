/**
 * Public email contact helper. Mirrors `whatsapp.ts` so email-preferring leads
 * (corporates, planners, procurement) get the same one-tap, context-prefilled
 * path as WhatsApp users — paper trail, CC colleagues, attachments.
 */

export const PUBLIC_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "luke@stamer.co.za";

export interface EmailContext {
  /** Human label, e.g. "Corporate event". */
  eventType?: string;
  /** Human date, e.g. "Sat 14 Mar 2026". */
  date?: string;
  /** The page/control that opened the draft — for our own context only. */
  source?: string;
}

/** Builds the shared subject + body draft used by both the mailto and Gmail links. */
function buildDraft(ctx?: EmailContext): { subject: string; body: string } {
  const subjectSuffix = ctx?.eventType?.trim() ? ` — ${ctx.eventType.trim()}` : "";
  const subject = `Cello enquiry${subjectSuffix}`;

  const eventLabel = ctx?.eventType?.trim() || "live cello";
  const datePart = ctx?.date?.trim() ? ` on ${ctx.date.trim()}` : "";
  const body = `Hi Luke,\n\nI'm planning a ${eventLabel}${datePart}. Could you let me know your availability?\n\nThanks,`;

  return { subject, body };
}

/** Returns a mailto: link with a prefilled subject + body draft. */
export function buildMailtoHref(ctx?: EmailContext): string {
  const { subject, body } = buildDraft(ctx);
  const params = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `mailto:${PUBLIC_EMAIL}?${params}`;
}

/**
 * Returns a Gmail web "compose" URL carrying the same prefilled draft. Use on
 * desktop, where a `mailto:` handler is often unset and the link would
 * otherwise do nothing — this always opens a real compose window in the browser.
 */
export function buildGmailComposeHref(ctx?: EmailContext): string {
  const { subject, body } = buildDraft(ctx);
  const params =
    `view=cm&fs=1&to=${encodeURIComponent(PUBLIC_EMAIL)}` +
    `&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `https://mail.google.com/mail/?${params}`;
}
