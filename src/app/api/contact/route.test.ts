/**
 * Contract tests for the home-page contact endpoint. Same gate as /api/leads:
 * Supabase must accept the row, Telegram is best-effort after the response.
 * The phone is optional here, so email-only enquiries must be stored too.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createWebsiteLeadMock = vi.hoisted(() => vi.fn());
const claimWebsiteLeadAlertMock = vi.hoisted(() => vi.fn());
const completeWebsiteLeadAlertMock = vi.hoisted(() => vi.fn());
const failWebsiteLeadAlertMock = vi.hoisted(() => vi.fn());
const sendTelegramLeadAlertMock = vi.hoisted(() => vi.fn());
const logAdminEventMock = vi.hoisted(() => vi.fn());
const afterCallbacks = vi.hoisted(() => [] as Array<() => Promise<void>>);

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (callback: () => Promise<void>) => {
    afterCallbacks.push(callback);
  },
}));

vi.mock("@/lib/inquiries/supabase", () => ({
  createWebsiteLead: createWebsiteLeadMock,
  claimWebsiteLeadAlert: claimWebsiteLeadAlertMock,
  completeWebsiteLeadAlert: completeWebsiteLeadAlertMock,
  failWebsiteLeadAlert: failWebsiteLeadAlertMock,
}));

vi.mock("@/lib/inquiries/telegram", () => ({
  sendTelegramLeadAlert: sendTelegramLeadAlertMock,
}));

vi.mock("@/lib/admin/events", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin/events")>()),
  logAdminEvent: logAdminEventMock,
}));

vi.mock("@/lib/admin/template-store", () => ({
  loadTemplateOverrides: vi.fn().mockResolvedValue(undefined),
}));

import { NextRequest } from "next/server";

import { POST } from "./route";

const LEAD_ID = "8a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

const EMAIL_ONLY = {
  firstName: "Pieter",
  lastName: "van Wyk",
  email: "pieter@example.com",
  inquiryType: "corporate-event",
  message: "Year-end function in Stellenbosch, 80 people.",
};

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

async function flushAfter() {
  const callbacks = afterCallbacks.splice(0);
  for (const callback of callbacks) await callback();
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    afterCallbacks.length = 0;
    createWebsiteLeadMock.mockResolvedValue({ leadId: LEAD_ID });
    claimWebsiteLeadAlertMock.mockResolvedValue({
      claimed: true,
      status: "sending",
      record: {
        leadId: LEAD_ID,
        source: "contact_form",
        firstName: "Pieter",
        lastName: "van Wyk",
        email: "pieter@example.com",
        phone: null,
        whatsapp: null,
        whatsappDigits: null,
        contactPreference: null,
        eventType: "Corporate event",
        eventDateText: null,
        location: null,
        guestCount: null,
        performanceMinutes: null,
        bookerRole: null,
        message: EMAIL_ONLY.message,
        alertAttempts: 1,
        createdAt: "2026-09-05T10:00:00.000Z",
      },
    });
    completeWebsiteLeadAlertMock.mockResolvedValue(undefined);
    failWebsiteLeadAlertMock.mockResolvedValue({ attempts: 1 });
    sendTelegramLeadAlertMock.mockResolvedValue({ ok: true, chatId: "chat_1", messageId: 7 });
    logAdminEventMock.mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("stores an email-only enquiry (the old code dropped these) and alerts Luke", async () => {
    const res = await post(EMAIL_ONLY);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true, leadId: LEAD_ID });
    expect(createWebsiteLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "contact_form",
        email: "pieter@example.com",
        phone: null,
        whatsappDigits: null,
        phoneE164: null,
        eventType: "Corporate event",
      }),
    );

    await flushAfter();

    expect(sendTelegramLeadAlertMock).toHaveBeenCalledWith({
      text: [
        "🎻 New inquiry from stamer.co.za",
        "📋 Source: Contact form (home page)",
        "",
        "👤 Name: Pieter van Wyk",
        "🎉 Event: Corporate event",
        "✉️ Email: pieter@example.com",
        "",
        "💬 Message: Year-end function in Stellenbosch, 80 people.",
      ].join("\n"),
      replyUrl: undefined,
      replyLabel: "Message Pieter on WhatsApp",
      availabilityLeadId: undefined,
    });
    expect(completeWebsiteLeadAlertMock).toHaveBeenCalledWith({
      leadId: LEAD_ID,
      chatId: "chat_1",
      messageId: 7,
    });
  });

  it("normalises a local phone number to E.164 and wa.me digits", async () => {
    const res = await post({ ...EMAIL_ONLY, phone: "082 123 4567" });

    expect(res.status).toBe(200);
    expect(createWebsiteLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: "082 123 4567",
        phoneE164: "+27821234567",
        whatsappDigits: "27821234567",
      }),
    );
  });

  it("rejects a phone number that cannot be normalised", async () => {
    const res = await post({ ...EMAIL_ONLY, phone: "12345" });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid phone number" });
    expect(createWebsiteLeadMock).not.toHaveBeenCalled();
  });

  it("rejects missing required fields and malformed email", async () => {
    expect((await post({ ...EMAIL_ONLY, message: "" })).status).toBe(400);
    expect((await post({ ...EMAIL_ONLY, email: "not-an-email" })).status).toBe(400);
    expect((await post({ firstName: 1 })).status).toBe(400);
  });

  it("returns 500 and logs an event when Supabase is down", async () => {
    createWebsiteLeadMock.mockRejectedValueOnce(new Error("timeout"));

    const res = await post(EMAIL_ONLY);

    expect(res.status).toBe(500);
    await flushAfter();
    expect(sendTelegramLeadAlertMock).not.toHaveBeenCalled();
    expect(logAdminEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "lead_persist_failed", context: expect.objectContaining({ source: "contact_form" }) }),
    );
  });
});
