import { describe, expect, it } from "vitest";
import getExampleNumber from "libphonenumber-js/examples.mobile.json" with { type: "json" };
import { getExampleNumber as buildExample } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";

import { normalizePhoneE164, toWaMeDigits } from "./phone";

/**
 * The identity contract between TypeScript and Postgres.
 *
 * A person who submits the website form and later messages on WhatsApp from
 * the same number is one human, and `inquiry_people.phone_e164` is the only
 * key the two channels share. That key is written from TypeScript and gated in
 * SQL, so the two have to agree on what a number looks like — these tests pin
 * the seam that `phone.test.ts` (which only checks the TypeScript side) cannot
 * see.
 */

/**
 * Mirror of the `inquiry_people.phone_e164` check constraint and of the guards
 * in `upsert_inquiry_person` / `create_website_lead`, from
 * `supabase/migrations/202608070001_person_identity_linking.sql`. If this
 * changes, that migration has to change with it.
 */
const SQL_E164_CHECK = /^\+[1-9][0-9]{6,14}$/;

describe("the phone value Postgres will accept", () => {
  it("accepts everything normalisation produces, so no link is silently dropped", () => {
    // A value that normalises cleanly here but fails the SQL check is the
    // dangerous case: the RPCs discard it rather than throw, so the lead would
    // save with no person link and nobody would notice.
    const inputs = [
      "082 123 4567",
      "0821234567",
      "+27 82 123 4567",
      "0027821234567",
      "27821234567",
      "+27 (0)82 123 4567",
      "+44 20 7946 0958",
      "0044 20 7946 0958",
      "+1 415 555 2671",
      "+61 2 9374 4000",
      "+91 98765 43210",
      "+971 50 123 4567",
    ];

    for (const input of inputs) {
      const e164 = normalizePhoneE164(input);
      expect(e164, `${input} should normalise`).not.toBeNull();
      expect(e164, `${input} -> ${e164} must satisfy the SQL check`).toMatch(
        SQL_E164_CHECK,
      );
    }
  });

  it("holds for every country's mobile numbers, not just the ones we thought of", () => {
    // The `{6,14}` bound in the SQL check is an assumption about how short a
    // real number can be. Sweep libphonenumber's own example set rather than
    // trusting it.
    const countries = Object.keys(getExampleNumber) as CountryCode[];
    expect(countries.length).toBeGreaterThan(100);

    const rejected = countries.filter((country) => {
      const example = buildExample(country, getExampleNumber);
      if (!example) return false;
      const e164 = normalizePhoneE164(example.number);
      return e164 === null || !SQL_E164_CHECK.test(e164);
    });

    expect(rejected).toEqual([]);
  });

  it("rejects the same junk on both sides", () => {
    for (const input of ["not a phone", "12345", "000", "+", "", "   "]) {
      expect(normalizePhoneE164(input)).toBeNull();
    }

    // Shapes Postgres refuses even if something upstream handed them over.
    for (const stored of ["0821234567", "27821234567", "+0821234567", "+27 82 123 4567"]) {
      expect(stored, `${stored} must not pass the SQL check`).not.toMatch(
        SQL_E164_CHECK,
      );
    }
  });
});

describe("one human, one key", () => {
  it("collapses the website form and WhatsApp onto the same person key", () => {
    // What the booking form receives from a South African typing by hand.
    const fromWebsiteForm = normalizePhoneE164("082 123 4567");
    // What Zernio sends on the webhook for that same human.
    const fromWhatsappWebhook = normalizePhoneE164("+27821234567");

    expect(fromWebsiteForm).toBe(fromWhatsappWebhook);
    expect(fromWebsiteForm).toMatch(SQL_E164_CHECK);
  });

  it("never produces the trunk-prefixed digits that make a dead wa.me link", () => {
    // The bug this replaced: "082 123 4567".replace(/\D/g, "") gave
    // "0821234567", so wa.me/0821234567 opened a chat with nobody.
    for (const input of ["082 123 4567", "0821234567", "0027821234567", "+27 82 123 4567"]) {
      expect(toWaMeDigits(input)).toBe("27821234567");
    }

    expect(toWaMeDigits("082 123 4567")?.startsWith("0")).toBe(false);
  });

  it("gives no digits at all rather than wrong ones", () => {
    // Null is the signal the alert uses to omit the availability buttons.
    for (const input of [null, undefined, "", "   ", "not a phone", "12345"]) {
      expect(toWaMeDigits(input)).toBeNull();
    }
  });
});
