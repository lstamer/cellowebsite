/**
 * Public email contact helper. Mirrors `whatsapp.ts` so email-preferring leads
 * (corporates, planners, procurement) get the same one-tap, context-prefilled
 * path as WhatsApp users — paper trail, CC colleagues, attachments.
 */

import { buildEnquirySentence, type EnquiryContext } from "@/lib/enquiry-message";

export const PUBLIC_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "luke@stamer.co.za";

export interface EmailContext extends EnquiryContext {
  /** The page/control that opened the draft — for our own context only. */
  source?: string;
}

/** Builds the shared subject + body draft used by both the mailto and Gmail links. */
function buildDraft(ctx?: EmailContext): { subject: string; body: string } {
  const subjectSuffix = ctx?.eventType?.trim() ? `: ${ctx.eventType.trim()}` : "";
  const subject = `Cello enquiry${subjectSuffix}`;

  const body = `Hi Luke,\n\n${buildEnquirySentence(ctx)}\n\nThanks,`;

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
