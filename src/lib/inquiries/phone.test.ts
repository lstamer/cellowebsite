import { describe, expect, it } from "vitest";

import {
  DEFAULT_PHONE_COUNTRY,
  normalizePhoneE164,
  toWaMeDigits,
} from "./phone";

const ZA_MOBILE = "+27821234567";

describe("phone normalisation", () => {
  it("defaults to South Africa", () => {
    expect(DEFAULT_PHONE_COUNTRY).toBe("ZA");
  });

  it("converges every South African input shape on one E.164 value", () => {
    expect(normalizePhoneE164("082 123 4567")).toBe(ZA_MOBILE);
    expect(normalizePhoneE164("0821234567")).toBe(ZA_MOBILE);
    expect(normalizePhoneE164("+27 82 123 4567")).toBe(ZA_MOBILE);
    expect(normalizePhoneE164("+27821234567")).toBe(ZA_MOBILE);
    expect(normalizePhoneE164("0027821234567")).toBe(ZA_MOBILE);
  });

  it("reads a bare country code as E.164, not as a national number", () => {
    // "27821234567" carries no "+" and no trunk "0", so the ZA default is what
    // lets the leading 27 be recognised as the country calling code.
    expect(normalizePhoneE164("27821234567")).toBe(ZA_MOBILE);
    expect(normalizePhoneE164("27 82 123 4567")).toBe(ZA_MOBILE);
  });

  it("survives punctuation and pasted whitespace", () => {
    expect(normalizePhoneE164("(082) 123-4567")).toBe(ZA_MOBILE);
    expect(normalizePhoneE164("082-123-4567")).toBe(ZA_MOBILE);
    expect(normalizePhoneE164("082\t123\n4567")).toBe(ZA_MOBILE);
    expect(normalizePhoneE164("  \n+27\t82 123 4567  ")).toBe(ZA_MOBILE);
    expect(normalizePhoneE164("+27 (0)82 123 4567")).toBe(ZA_MOBILE);
  });

  it("never traps an explicitly international number in South Africa", () => {
    expect(normalizePhoneE164("+44 20 7946 0958")).toBe("+442079460958");
    expect(normalizePhoneE164("+442079460958")).toBe("+442079460958");
    expect(normalizePhoneE164("+1 415 555 2671")).toBe("+14155552671");
    // The ZA default supplies the exit code rather than the country: "00" is
    // read as the IDD prefix, so this stays a UK number.
    expect(normalizePhoneE164("0044 20 7946 0958")).toBe("+442079460958");
  });

  it("returns null rather than guessing at unusable input", () => {
    expect(normalizePhoneE164("")).toBeNull();
    expect(normalizePhoneE164("   ")).toBeNull();
    expect(normalizePhoneE164(null)).toBeNull();
    expect(normalizePhoneE164(undefined)).toBeNull();
    expect(normalizePhoneE164("not a phone")).toBeNull();
    expect(normalizePhoneE164("12345")).toBeNull();
    expect(normalizePhoneE164("000")).toBeNull();
    expect(normalizePhoneE164("+")).toBeNull();
    expect(normalizePhoneE164("082123456789012")).toBeNull();
    expect(normalizePhoneE164("082 123 4567 or 083 999 1111")).toBeNull();
  });

  it("is idempotent, so a stored value re-normalises to itself", () => {
    for (const raw of ["082 123 4567", "0027821234567", "+44 20 7946 0958"]) {
      const once = normalizePhoneE164(raw);
      expect(once).not.toBeNull();
      expect(normalizePhoneE164(once)).toBe(once);
      // And a third pass, since dedupe keys get rewritten repeatedly.
      expect(normalizePhoneE164(normalizePhoneE164(once))).toBe(once);
    }
  });
});

describe("wa.me digits", () => {
  it("strips the leading plus", () => {
    expect(toWaMeDigits("+27821234567")).toBe("27821234567");
    expect(toWaMeDigits("+44 20 7946 0958")).toBe("442079460958");
  });

  it("normalises raw input so callers cannot leak a trunk prefix", () => {
    expect(toWaMeDigits("082 123 4567")).toBe("27821234567");
    expect(toWaMeDigits("0821234567")).toBe("27821234567");
    expect(toWaMeDigits("0027821234567")).toBe("27821234567");
  });

  it("returns null for absent or invalid input instead of a dead link", () => {
    expect(toWaMeDigits(null)).toBeNull();
    expect(toWaMeDigits(undefined)).toBeNull();
    expect(toWaMeDigits("")).toBeNull();
    expect(toWaMeDigits("   ")).toBeNull();
    expect(toWaMeDigits("not a phone")).toBeNull();
    expect(toWaMeDigits("12345")).toBeNull();
  });

  it("emits digits only, which is all wa.me accepts", () => {
    const digits = toWaMeDigits("082 123 4567");
    expect(digits).toMatch(/^[0-9]+$/);
  });
});
