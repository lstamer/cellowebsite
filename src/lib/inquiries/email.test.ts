import { describe, expect, it } from "vitest";

import { buildEmailAlertText, looksAutomated } from "./email";
import { parseAddress, stripHtml, trimQuotedReply } from "./gmail";

describe("gmail parsing", () => {
  it("parses display-name addresses and bare addresses", () => {
    expect(parseAddress('"Thandi Nkosi" <Thandi@Example.com>')).toEqual({ email: "thandi@example.com", name: "Thandi Nkosi" });
    expect(parseAddress("Thandi Nkosi <thandi@example.com>")).toEqual({ email: "thandi@example.com", name: "Thandi Nkosi" });
    expect(parseAddress("thandi@example.com")).toEqual({ email: "thandi@example.com", name: null });
    expect(parseAddress(null)).toEqual({ email: null, name: null });
  });

  it("strips html to readable text", () => {
    expect(stripHtml("<p>Hi Luke,</p><p>Are you free on <b>12 May</b>?</p><style>p{}</style>")).toBe("Hi Luke,\nAre you free on 12 May?");
  });

  it("drops quoted replies", () => {
    const text = "Yes that works.\n\nOn Mon, 1 Sep 2026 at 10:00, Luke <luke@stamer.co.za> wrote:\n> Are you free?\n> Luke";
    expect(trimQuotedReply(text)).toBe("Yes that works.");
  });
});

describe("email triage", () => {
  it("treats notification senders and promotional labels as automated", () => {
    expect(looksAutomated({ from: { email: "no-reply@accounts.google.com", name: null }, labels: [], subject: "Security alert" })).toBe(true);
    expect(looksAutomated({ from: { email: "shop@example.com", name: null }, labels: ["CATEGORY_PROMOTIONS"], subject: "Sale" })).toBe(true);
    expect(looksAutomated({ from: { email: "thandi@example.com", name: "Thandi" }, labels: ["INBOX"], subject: "Wedding in May" })).toBe(false);
  });

  it("builds the Telegram alert with the extracted details", () => {
    const text = buildEmailAlertText({
      fromName: "Thandi",
      fromEmail: "thandi@example.com",
      subject: "Wedding in May",
      classification: {
        is_inquiry: true,
        confidence: 0.9,
        summary: "Wants a cellist for a ceremony and cocktails.",
        contact_name: "Thandi Nkosi",
        event_type: "Wedding",
        event_date_text: "12 May 2027",
        location: "Franschhoek",
        reason: "asks about availability",
      },
    });
    expect(text).toBe(
      [
        "🎻 New inquiry by email",
        "",
        "👤 Name: Thandi Nkosi",
        "✉️ Email: thandi@example.com",
        "📝 Subject: Wedding in May",
        "🎉 Event: Wedding",
        "📅 Date: 12 May 2027",
        "📍 Location: Franschhoek",
        "",
        "💬 Wants a cellist for a ceremony and cocktails.",
      ].join("\n"),
    );
  });
});
