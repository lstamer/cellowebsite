import { describe, expect, it } from "vitest";

import {
  buildMessage,
  formatDateForHumans,
  getEventLabel,
  type BookingMessageData,
} from "./build-message";

const BASE: BookingMessageData = {
  eventType: "wedding",
  eventTypeOther: "",
  date: "2026-09-30",
  dateUnsure: false,
  location: "Babylonstoren, Franschhoek",
  phone: "+27821234567",
  whatsappSameAsPhone: true,
  whatsapp: "",
  contactPreference: "whatsapp",
  guestCount: 120,
  performanceMinutes: 60,
  message: "  Ceremony and cocktails please.  ",
  bookingOnBehalf: false,
  organisation: "",
  bookerRole: "bride",
  bookerRoleOther: "",
};

describe("getEventLabel", () => {
  it("title-cases hyphenated enums", () => {
    expect(getEventLabel({ eventType: "corporate-event", eventTypeOther: "" })).toBe(
      "Corporate Event",
    );
  });

  it("uses the free-text description for something-else", () => {
    expect(getEventLabel({ eventType: "something-else", eventTypeOther: " Book launch " })).toBe(
      "Book launch",
    );
    expect(getEventLabel({ eventType: "something-else", eventTypeOther: "" })).toBe(
      "Other event",
    );
  });

  it("falls back when no type is chosen", () => {
    expect(getEventLabel({ eventType: "", eventTypeOther: "" })).toBe("Event inquiry");
  });
});

describe("buildMessage", () => {
  it("renders the notes block for a representative wedding lead", () => {
    expect(buildMessage(BASE)).toBe(
      [
        "Event type: Wedding",
        "Date: 30 September 2026",
        "Location: Babylonstoren, Franschhoek",
        "Phone: +27821234567",
        "WhatsApp: +27821234567",
        "Preferred contact: WhatsApp",
        "Role: Bride",
        "Guest count: 120",
        "Performance length: 60 minutes",
        "",
        "Message:",
        "Ceremony and cocktails please.",
      ].join("\n"),
    );
  });

  it("renders flexible dates, null guest counts, 200+ and on-behalf bookings", () => {
    expect(
      buildMessage({
        ...BASE,
        dateUnsure: true,
        date: "",
        guestCount: null,
        bookerRole: "other",
        bookerRoleOther: " Wedding planner ",
        bookingOnBehalf: true,
        organisation: "",
        message: "",
        whatsappSameAsPhone: false,
        whatsapp: "",
        phone: "",
        contactPreference: "email",
      }),
    ).toBe(
      [
        "Event type: Wedding",
        "Date: Flexible / TBD",
        "Location: Babylonstoren, Franschhoek",
        "Phone: Not provided",
        "WhatsApp: Not provided",
        "Preferred contact: Email",
        "Role: Wedding planner",
        "Guest count: Not specified",
        "Performance length: 60 minutes",
        "Booking on behalf of a client/company: Yes (organisation not specified)",
        "",
        "Message:",
        "Not provided",
      ].join("\n"),
    );

    expect(buildMessage({ ...BASE, guestCount: 250 })).toContain("Guest count: 200+");
  });

  it("passes a legacy 'Sep 30, 2026' date through unchanged", () => {
    expect(buildMessage({ ...BASE, date: "Sep 30, 2026" })).toContain("Date: Sep 30, 2026");
  });
});

describe("formatDateForHumans", () => {
  it("renders ISO dates in en-ZA long form without a timezone shift", () => {
    expect(formatDateForHumans("2026-09-30")).toBe("30 September 2026");
    expect(formatDateForHumans("2026-01-01")).toBe("1 January 2026");
  });

  it("leaves non-ISO strings untouched", () => {
    expect(formatDateForHumans("Sep 30, 2026")).toBe("Sep 30, 2026");
    expect(formatDateForHumans("")).toBe("");
  });
});
