/**
 * Contract tests for the website inquiry endpoint.
 *
 * The form on /book posts here. Supabase is the system of record (a failed
 * write fails the request); the Telegram alert Luke acts on is best-effort but
 * every failure is recorded on the row and in admin_events. These tests pin
 * the wire format so that a client-side change cannot silently drop leads
 * with a 400, and pin the exact Telegram text so his notification cannot
 * change by accident.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createWebsiteLeadMock = vi.hoisted(() => vi.fn());
const completeWebsiteLeadAlertMock = vi.hoisted(() => vi.fn());
const claimWebsiteLeadAlertMock = vi.hoisted(() => vi.fn());
const failWebsiteLeadAlertMock = vi.hoisted(() => vi.fn());
const sendTelegramLeadAlertMock = vi.hoisted(() => vi.fn());
const logAdminEventMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/inquiries/supabase", () => ({
  createWebsiteLead: createWebsiteLeadMock,
  completeWebsiteLeadAlert: completeWebsiteLeadAlertMock,
  claimWebsiteLeadAlert: claimWebsiteLeadAlertMock,
  failWebsiteLeadAlert: failWebsiteLeadAlertMock,
}));

vi.mock("@/lib/inquiries/telegram", () => ({
  sendTelegramLeadAlert: sendTelegramLeadAlertMock,
}));

vi.mock("@/lib/admin/events", () => ({
  logAdminEvent: logAdminEventMock,
}));

import { POST } from "./route";

const FULL_PAYLOAD = {
  firstName: "Thandi",
  lastName: "Nkosi",
  email: "thandi@example.com",
  phone: "+27821234567",
  whatsapp: "",
  whatsappSameAsPhone: true,
  contactPreference: "whatsapp",
  eventType: "wedding",
  eventTypeOther: "",
  date: "2026-09-30",
  dateUnsure: false,
  location: "Babylonstoren, Franschhoek",
  guestCount: 120,
  performanceMinutes: 60,
  bookerRole: "bride",
  bookerRoleOther: "",
  message: "Ceremony and cocktails please.",
  notes: "Event type: Wedding\nDate: 2026-09-30",
};

/**
 * The exact message Luke receives on Telegram for FULL_PAYLOAD. Change this
 * only when he asks for the notification to change.
 */
const EXPECTED_TELEGRAM_TEXT = [
  "🎻 New inquiry from stamer.co.za",
  "",
  "👤 Name: Thandi Nkosi",
  "👋 Role: Bride",
  "🎉 Event: Wedding",
  "📅 Date: 2026-09-30",
  "📍 Location: Babylonstoren, Franschhoek",
  "✉️ Email: thandi@example.com",
  "📞 Phone: +27821234567",
  "💬 WhatsApp: +27821234567",
  "📨 Preferred contact: WhatsApp",
  "👥 Guests: 120",
  "⏱ Performance: 60 min",
  "",
  "💬 Message: Ceremony and cocktails please.",
].join("\n");

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/leads", () => {
  beforeEach(() => {
    createWebsiteLeadMock.mockResolvedValue({ leadId: "0d3f6c0e-5f6f-4a2e-9d43-8c9a3f9d4a11" });
    completeWebsiteLeadAlertMock.mockResolvedValue(undefined);
    claimWebsiteLeadAlertMock.mockResolvedValue(true);
    failWebsiteLeadAlertMock.mockResolvedValue(undefined);
    logAdminEventMock.mockResolvedValue(undefined);
    sendTelegramLeadAlertMock.mockResolvedValue({ ok: true, chatId: "chat_1", messageId: 42 });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("accepts a known-good payload and runs the full pipeline", async () => {
    const res = await post(FULL_PAYLOAD);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      leadId: "0d3f6c0e-5f6f-4a2e-9d43-8c9a3f9d4a11",
    });
    expect(createWebsiteLeadMock).toHaveBeenCalledTimes(1);
    expect(claimWebsiteLeadAlertMock).toHaveBeenCalledWith("0d3f6c0e-5f6f-4a2e-9d43-8c9a3f9d4a11");
    expect(sendTelegramLeadAlertMock).toHaveBeenCalledTimes(1);
    expect(completeWebsiteLeadAlertMock).toHaveBeenCalledWith({
      leadId: "0d3f6c0e-5f6f-4a2e-9d43-8c9a3f9d4a11",
      chatId: "chat_1",
      messageId: 42,
    });
    expect(logAdminEventMock).not.toHaveBeenCalled();
  });

  it("sends Luke exactly the expected Telegram text with a WhatsApp reply button", async () => {
    await post(FULL_PAYLOAD);

    expect(sendTelegramLeadAlertMock).toHaveBeenCalledWith({
      text: EXPECTED_TELEGRAM_TEXT,
      replyUrl: "https://wa.me/27821234567",
      replyLabel: "Message Thandi on WhatsApp",
      availabilityLeadId: "0d3f6c0e-5f6f-4a2e-9d43-8c9a3f9d4a11",
    });
  });

  it("uses the separate WhatsApp number when it differs from the phone", async () => {
    await post({
      ...FULL_PAYLOAD,
      whatsapp: "+27831112222",
      whatsappSameAsPhone: false,
    });

    const call = sendTelegramLeadAlertMock.mock.calls[0][0] as {
      text: string;
      replyUrl: string;
    };
    expect(call.replyUrl).toBe("https://wa.me/27831112222");
    expect(call.text).toContain("💬 WhatsApp: +27831112222");
    expect(call.text).toContain("📞 Phone: +27821234567");
  });

  it("stores a lead with no usable WhatsApp number and alerts without availability buttons", async () => {
    await post({
      ...FULL_PAYLOAD,
      phone: "",
      whatsapp: "",
      whatsappSameAsPhone: true,
      contactPreference: "email",
    });

    expect(createWebsiteLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({ whatsappDigits: null, phoneE164: null, phone: null }),
    );
    const call = sendTelegramLeadAlertMock.mock.calls[0][0] as {
      text: string;
      replyUrl?: string;
      availabilityLeadId?: string;
    };
    expect(call.replyUrl).toBeUndefined();
    expect(call.availabilityLeadId).toBeUndefined();
    expect(call.text).toContain("📨 Preferred contact: Email");
    expect(call.text).not.toContain("📞 Phone");
  });

  it("omits the guest line when the count is null", async () => {
    await post({ ...FULL_PAYLOAD, guestCount: null });

    const { text } = sendTelegramLeadAlertMock.mock.calls[0][0] as { text: string };
    expect(text).not.toContain("👥 Guests");
  });

  it("rejects a guest count that is not a number or null", async () => {
    const res = await post({ ...FULL_PAYLOAD, guestCount: "120" });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid request body" });
  });

  it("rejects an unknown event type enum", async () => {
    const res = await post({ ...FULL_PAYLOAD, eventType: "Wedding" });

    expect(res.status).toBe(400);
  });

  it("rejects a missing dateUnsure flag", async () => {
    const { dateUnsure: _omit, ...withoutFlag } = FULL_PAYLOAD;
    void _omit;
    const res = await post(withoutFlag);

    expect(res.status).toBe(400);
  });

  it("rejects invalid JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/leads", { method: "POST", body: "{" }),
    );

    expect(res.status).toBe(400);
  });

  it("persists whatsappDigits so the alert can carry availability buttons", async () => {
    await post(FULL_PAYLOAD);

    expect(createWebsiteLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        whatsappDigits: "27821234567",
        phoneE164: "+27821234567",
        notes: FULL_PAYLOAD.notes,
        guestCount: 120,
        performanceMinutes: 60,
        sessionId: null,
      }),
    );
  });

  it("passes the analytics session through when present", async () => {
    await post({ ...FULL_PAYLOAD, sessionId: "sess_abc" });

    expect(createWebsiteLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "sess_abc" }),
    );
  });

  it("returns 500, logs an event and sends no alert when Supabase rejects the lead", async () => {
    createWebsiteLeadMock.mockRejectedValueOnce(new Error("supabase down"));

    const res = await post(FULL_PAYLOAD);

    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/could not save/i);
    expect(sendTelegramLeadAlertMock).not.toHaveBeenCalled();
    expect(logAdminEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error",
        source: "supabase",
        kind: "lead_persist_failed",
      }),
    );
  });

  it("still returns 200 when Telegram fails, and records the failure for retry", async () => {
    sendTelegramLeadAlertMock.mockResolvedValueOnce({ ok: false, error: "Telegram sendMessage failed (502)" });

    const res = await post(FULL_PAYLOAD);

    expect(res.status).toBe(200);
    expect(failWebsiteLeadAlertMock).toHaveBeenCalledWith({
      leadId: "0d3f6c0e-5f6f-4a2e-9d43-8c9a3f9d4a11",
      errorMessage: "Telegram sendMessage failed (502)",
    });
    expect(completeWebsiteLeadAlertMock).not.toHaveBeenCalled();
    expect(logAdminEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error",
        source: "telegram",
        kind: "lead_alert_failed",
        leadId: "0d3f6c0e-5f6f-4a2e-9d43-8c9a3f9d4a11",
      }),
    );
  });

  it("does not send when the alert claim is refused", async () => {
    claimWebsiteLeadAlertMock.mockResolvedValueOnce(false);

    const res = await post(FULL_PAYLOAD);

    expect(res.status).toBe(200);
    expect(sendTelegramLeadAlertMock).not.toHaveBeenCalled();
  });
});
