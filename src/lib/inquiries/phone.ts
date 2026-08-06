/**
 * Canonical phone normalisation for the inquiry pipeline.
 *
 * Numbers reach us from three places that all format them differently: the
 * website form (typed by hand), Zernio's WhatsApp webhooks (already E.164),
 * and Telegram approval cards (round-tripped through our own storage). They
 * have to agree, because the number is both the dedupe key for a lead and the
 * path of the wa.me reply link. `"082 123 4567"` and `"+27821234567"` are the
 * same person, and a naive `replace(/\D/g, "")` turns the first into
 * `wa.me/0821234567`, which silently opens a chat with nobody.
 *
 * Everything here is pure: no env reads, no I/O, no caching.
 */

import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * South Africa. Luke performs in and around Cape Town, so an unprefixed
 * number is overwhelmingly a local one typed the way locals type it, with the
 * `0` trunk prefix (`082 123 4567`). The default is only ever applied to input
 * that carries no country information of its own, so it can guess for the
 * common case without mangling the occasional destination-wedding enquiry
 * from abroad.
 */
export const DEFAULT_PHONE_COUNTRY = "ZA" as const;

/**
 * libphonenumber stops parsing at a tab or newline and returns nothing, so
 * `"082\t123 4567"` would be dropped outright. Spaces it handles fine. Copy
 * and paste out of an email signature or a Telegram message routinely carries
 * both, so fold every run of whitespace down to a single space first.
 */
function collapseWhitespace(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/**
 * Parse any human-entered or machine-supplied phone number into canonical
 * E.164 (`+27821234567`), or `null` if it cannot be trusted.
 *
 * Returning `null` rather than a best guess is deliberate. Downstream this
 * value addresses a WhatsApp conversation, so a wrong number is materially
 * worse than a missing one: a missing number degrades to "reply by email",
 * while a wrong one sends a quote to a stranger and leaves the real lead
 * waiting. Anything `isValid()` rejects is therefore discarded, not salvaged.
 *
 * Accepts, all converging on `+27821234567`: `082 123 4567`, `0821234567`,
 * `+27 82 123 4567`, `27821234567`, `0027821234567`, and the same with
 * parentheses, hyphens, tabs or newlines mixed in.
 */
export function normalizePhoneE164(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const cleaned = collapseWhitespace(raw);
  if (!cleaned) return null;

  // A leading "+" already states the country, so no default is passed and an
  // international number cannot be re-read as South African. Without one, ZA
  // is supplied so the library can resolve the local trunk prefix ("082..."),
  // its IDD prefix ("0027..."), and a bare country code ("27821234567"). That
  // last shape only resolves because ZA is known; without it the digits parse
  // as a national number and fail.
  const parsed = cleaned.startsWith("+")
    ? parsePhoneNumberFromString(cleaned)
    : parsePhoneNumberFromString(cleaned, DEFAULT_PHONE_COUNTRY);

  // Note that supplying ZA does not trap "0044 20 7946 0958" in South Africa:
  // "00" is read as the exit code and the number resolves to +44.
  if (!parsed || !parsed.isValid()) return null;

  return parsed.number;
}

/**
 * Render a number as the bare digits a `https://wa.me/<digits>` link needs,
 * e.g. `+27821234567` becomes `27821234567`.
 *
 * Takes raw input rather than pre-normalised E.164 and normalises it itself.
 * Callers hold numbers of mixed provenance, and a helper that trusted its
 * argument would happily emit `wa.me/0821234567` from a form value, the exact
 * failure this module exists to prevent. Invalid or absent input yields `null`
 * so callers can omit the button instead of rendering a dead link.
 */
export function toWaMeDigits(phone: string | null | undefined): string | null {
  const e164 = normalizePhoneE164(phone);
  if (!e164) return null;

  return e164.slice(1);
}
