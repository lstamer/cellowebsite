/**
 * Public, customer-facing WhatsApp deep-link helper.
 *
 * The reply channel for the whole funnel is WhatsApp, so every "WhatsApp me"
 * affordance on the site routes through here. Build wa.me links with a
 * context-prefilled message so a warm lead can reach Luke in one tap.
 *
 * Number: +27 63 908 1386 (the public/footer line). Overridable via
 * NEXT_PUBLIC_WHATSAPP_NUMBER for environment flexibility.
 */

import { buildEnquirySentence, type EnquiryContext } from "@/lib/enquiry-message";

/** E.164 digits only (no '+'), as wa.me requires. */
export const PUBLIC_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "27639081386";

/** Human-friendly version for display (e.g. in the footer). */
export const PUBLIC_WHATSAPP_DISPLAY = "+27 63 908 1386";

export interface WhatsAppContext extends EnquiryContext {
  /** Lead's name if already known. */
  name?: string;
  /** The page/control that opened the chat — kept for our own context only. */
  source?: string;
}

/**
 * Compose the prefilled message. Keeps it warm, first-person-from-the-lead,
 * and only includes details the visitor has actually provided.
 */
function buildPrefilledMessage(ctx?: WhatsAppContext): string {
  return `Hi Luke, ${buildEnquirySentence(ctx)}`;
}

/**
 * Returns a tappable wa.me link, e.g.
 * https://wa.me/27639081386?text=Hi%20Luke%2C%20I'm%20planning...
 */
export function buildWhatsAppHref(ctx?: WhatsAppContext): string {
  const text = encodeURIComponent(buildPrefilledMessage(ctx));
  return `https://wa.me/${PUBLIC_WHATSAPP_NUMBER}?text=${text}`;
}
