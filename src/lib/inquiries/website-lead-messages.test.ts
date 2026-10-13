import { describe, expect, it } from "vitest";

import {
  buildWebsiteLeadAvailabilityMessage,
  buildWebsiteLeadFirstContactMessage,
  type WebsiteLeadManualMessageContext,
} from "./website-lead-messages";

const CONTEXT: WebsiteLeadManualMessageContext = {
  firstName: "Sam",
  eventType: "Wedding",
  eventDateText: "21 October 2026",
  dateFlexible: false,
  location: "Cape Town",
};

describe("website lead manual WhatsApp messages", () => {
  it("builds a short first-contact acknowledgement", () => {
    expect(buildWebsiteLeadFirstContactMessage(CONTEXT)).toContain(
      "I've received your event enquiry",
    );
    expect(buildWebsiteLeadFirstContactMessage(CONTEXT)).toContain("Luke");
  });

  it("builds availability-specific messages with the lead's date", () => {
    expect(buildWebsiteLeadAvailabilityMessage(CONTEXT, "available")).toBe(
      [
        "Hi Sam, thanks for reaching out! I just did a wedding quite close to Cape Town; it’s a lovely area.",
        "I am available on the 21st of October, and I have three main packages I offer depending on how elaborate the event is.",
        "Do you have any ideas about where you see the cello fitting in? Processional/ceremony, guest arrival, cocktail hour etc? Most couples do ceremony and guest arrival, but everyone’s different.",
        "Once I know that I can come back with pricing and any other questions you may have ☺️",
        "Best regards\nLuke",
      ].join("\n\n"),
    );
    expect(
      buildWebsiteLeadAvailabilityMessage(CONTEXT, "unavailable"),
    ).toContain("I'm sorry, but I'm not available on the 21st of October");
  });

  it("uses a neutral date phrase for flexible dates", () => {
    expect(
      buildWebsiteLeadAvailabilityMessage(
        { ...CONTEXT, dateFlexible: true },
        "unavailable",
      ),
    ).toContain("the date you mentioned");
  });
});
