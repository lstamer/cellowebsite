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

/** Returns a mailto: link with a prefilled subject + body draft. */
export function buildMailtoHref(ctx?: EmailContext): string {
  const subjectSuffix = ctx?.eventType?.trim() ? ` — ${ctx.eventType.trim()}` : "";
  const subject = `Cello enquiry${subjectSuffix}`;

  const eventLabel = ctx?.eventType?.trim() || "live cello";
  const datePart = ctx?.date?.trim() ? ` on ${ctx.date.trim()}` : "";
  const body = `Hi Luke,\n\nI'm planning a ${eventLabel}${datePart}. Could you let me know your availability?\n\nThanks,`;

  const params = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `mailto:${PUBLIC_EMAIL}?${params}`;
}
