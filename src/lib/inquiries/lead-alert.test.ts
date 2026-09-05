import { afterEach, describe, expect, it } from "vitest";

import { clearTemplateOverrides, setTemplateOverrides } from "@/lib/admin/templates";

import { buildLeadAlertText, type LeadAlertRecord } from "./lead-alert";

const RECORD: LeadAlertRecord = {
  leadId: "3f2a6c1e-0b4d-4e8a-9c7f-1d2e3f4a5b6c",
  source: "lead_form",
  firstName: "Thandi",
  lastName: "Nkosi",
  email: "thandi@example.com",
  phone: "+27821234567",
  whatsapp: "+27821234567",
  whatsappDigits: "27821234567",
  contactPreference: "whatsapp",
  eventType: "Wedding",
  eventDateText: "2026-09-30",
  location: "Babylonstoren, Franschhoek",
  guestCount: 250,
  performanceMinutes: 60,
  bookerRole: "Bride",
  message: "Ceremony and cocktails please.",
};

describe("buildLeadAlertText", () => {
  afterEach(() => clearTemplateOverrides());

  it("renders the source first, caps guest counts at 200+, and omits empty fields", () => {
    const text = buildLeadAlertText({ ...RECORD, message: null, location: null });
    const lines = text.split("\n");

    expect(lines[0]).toBe("🎻 New inquiry from stamer.co.za");
    expect(lines[1]).toBe("📋 Source: Booking form (/book)");
    expect(text).toContain("👥 Guests: 200+");
    expect(text).not.toContain("📍 Location");
    expect(text).not.toContain("💬 Message");
    expect(text.endsWith("⏱ Performance: 60 min")).toBe(true);
  });

  it("uses the admin's override for the lead alert when one is active", () => {
    setTemplateOverrides([
      ["telegram.lead_alert", "NEW LEAD ({{source_label}}): {{name}} <{{email}}>\nMsg: {{message}}"],
    ]);

    expect(buildLeadAlertText(RECORD)).toBe(
      "NEW LEAD (Booking form (/book)): Thandi Nkosi <thandi@example.com>\nMsg: Ceremony and cocktails please.",
    );
  });
});
