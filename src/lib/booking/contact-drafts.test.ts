import { describe, expect, it } from "vitest";
import { BOOKER_ROLES, EVENT_TYPE_OPTIONS } from "./build-message";
import { buildBookingContactDrafts, type BookingContactDraftInput } from "./contact-drafts";

const example: BookingContactDraftInput = {
  fullName: "Alex Smith",
  eventType: "other",
  eventTypeOther: "Product launch",
  date: "2026-11-19",
  dateUnsure: false,
  location: "CTICC",
  guestCount: 116,
  performanceMinutes: 120,
  bookerRole: "corporate-organiser",
  bookerRoleOther: "",
  bookingOnBehalf: false,
  organisation: "",
  message: "We need cello for arrival and potentially while people eat after a speech. 2 sets with a 15 min interval.",
};

describe("booking contact drafts", () => {
  it("writes both drafts as the visitor and preserves their original notes", () => {
    const visitor = { ...example, email: "private@example.com", phone: "+27712345678" };
    const expectedDetails = [
      "for a product launch on 19 November 2026 at the CTICC. I'm organising the event for my company.",
      "We're looking for about 2 hours of live music. I'm expecting about 110 to 120 guests.",
      example.message,
    ].join("\n\n");
    expect(buildBookingContactDrafts(visitor)).toEqual({
      whatsapp: `Hi Luke,\n\nI'd love some live cello ${expectedDetails}\n\nThanks,\nAlex Smith`,
      email: {
        subject: "Live cello enquiry: Product launch",
        body: `Hi Luke,\n\nI'd like to enquire about live cello ${expectedDetails}\n\nKind regards,\nAlex Smith`,
      },
    });
  });

  it.each(EVENT_TYPE_OPTIONS.filter(({ value }) => value !== "other"))(
    "renders the $label option as an event in prose",
    ({ value }) => {
      const body = buildBookingContactDrafts({ ...example, eventType: value }).email.body;
      expect(body).toMatch(/for an? [a-z ]+ on 19 November 2026/);
      expect(body).not.toContain("Product launch");
    },
  );

  it.each(BOOKER_ROLES.filter(({ value }) => value !== "other"))(
    "includes the visitor's $label role",
    ({ value }) => {
      const body = buildBookingContactDrafts({ ...example, bookerRole: value }).email.body;
      expect(body.split("\n\n")[1]).toContain("I'm ");
    },
  );

  it("keeps an unfamiliar venue acronym, a flexible date and a custom role", () => {
    const { whatsapp } = buildBookingContactDrafts({
      ...example, dateUnsure: true, location: "XYZ", bookerRole: "other",
      bookerRoleOther: "an independent producer", guestCount: null, performanceMinutes: 95,
      bookingOnBehalf: true, organisation: "Acme Events", message: "First line.\nSecond line!",
    });
    expect(whatsapp).toContain("at XYZ. The date is still flexible.");
    expect(whatsapp).toContain("as an independent producer.");
    expect(whatsapp).toContain("on behalf of Acme Events.");
    expect(whatsapp).toContain("1 hour and 35 minutes");
    expect(whatsapp).toContain("First line.\nSecond line!");
    expect(whatsapp).not.toMatch(/19 November|guests/);
  });

  it("honours venue articles and the capped guest count without inventing an organisation", () => {
    const { whatsapp } = buildBookingContactDrafts({
      ...example, location: "the CTICC.", guestCount: 200, bookingOnBehalf: true,
    });
    expect(whatsapp).toContain("at the CTICC.");
    expect(whatsapp).toContain("200 or more guests");
    expect(whatsapp).toContain("on behalf of a client or company");
  });

  it.each([
    ["1 Adderley St, Cape Town City Centre, Cape Town, 8000, South Africa", "1 Adderley St in Cape Town"],
    ["17 Main Rd, Newlands, Cape Town 7700, South Africa", "17 Main Rd, Newlands, Cape Town"],
    ["Cape Town City Hall, Cape Town", "Cape Town City Hall, Cape Town"],
  ])("uses %s as a concise venue in both drafts", (location, venue) => {
    const { whatsapp, email } = buildBookingContactDrafts({ ...example, location });
    expect(whatsapp).toContain(`at ${venue}.`);
    expect(email.body).toContain(`at ${venue}.`);
  });

  it("handles singulars and ignores an organisation when booking directly", () => {
    const { whatsapp } = buildBookingContactDrafts({
      ...example, guestCount: 1, performanceMinutes: 60, organisation: "Old value", message: "",
    });
    expect(whatsapp).toContain("1 hour of live music. I'm expecting 1 guest.");
    expect(whatsapp).not.toContain("Old value");
  });
});
