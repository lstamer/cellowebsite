/**
 * Shared wording for the prefilled enquiry drafts (WhatsApp + email).
 *
 * Both channels open a message written in the lead's voice, so the sentence has
 * to read naturally whether or not we know the event type. Event labels arrive
 * capitalised for UI use (e.g. "Corporate event"), and "Live cello" is the
 * catch-all label rather than a real event, so neither can be dropped straight
 * into "I'm planning a ___".
 */

/** Labels that name the service rather than an event, so they can't be the object of "planning a". */
const NON_EVENT_LABELS = new Set(["live cello", "cello", "something else"]);

/** "a wedding" / "an event" — picks the article from the leading sound. */
function withArticle(noun: string): string {
  return `${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`;
}

export interface EnquiryContext {
  /** Human label, e.g. "Corporate event". Falls back to a generic event. */
  eventType?: string;
  /** Human date, e.g. "Sat 14 Mar 2026". Empty/omitted is fine. */
  date?: string;
}

/**
 * The one-line enquiry, minus the greeting. Reads as:
 * "I'm planning a wedding on Sat 14 Mar 2026 and would love live cello.
 *  Could you let me know your availability?"
 */
export function buildEnquirySentence(ctx?: EnquiryContext): string {
  const label = ctx?.eventType?.trim().toLowerCase() ?? "";
  const event = label && !NON_EVENT_LABELS.has(label) ? label : "event";
  const datePart = ctx?.date?.trim() ? ` on ${ctx.date.trim()}` : "";

  return `I'm planning ${withArticle(event)}${datePart} and would love live cello. Could you let me know your availability?`;
}
