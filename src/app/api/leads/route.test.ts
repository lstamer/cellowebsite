/**
 * Contract tests for the website inquiry endpoint.
 *
 * The form on /book posts here, and this route feeds Attio, Supabase and the
 * Telegram alert Luke acts on. These tests pin the wire format so that a
 * client-side change cannot silently drop leads with a 400, and pin the exact
 * Telegram text so his notification cannot change by accident.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const upsertAttioPersonMock = vi.hoisted(() => vi.fn());
const patchAttioPersonOptionalMock = vi.hoisted(() => vi.fn());
const createAttioNoteMock = vi.hoisted(() => vi.fn());
const createWebsiteLeadMock = vi.hoisted(() => vi.fn());
const completeWebsiteLeadAlertMock = vi.hoisted(() => vi.fn());
const sendTelegramLeadAlertMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/attio", () => ({
  upsertAttioPerson: upsertAttioPersonMock,
  patchAttioPersonOptional: patchAttioPersonOptionalMock,
  createAttioNote: createAttioNoteMock,
}));

vi.mock("@/lib/inquiries/supabase", () => ({
  createWebsiteLead: createWebsiteLeadMock,
  completeWebsiteLeadAlert: completeWebsiteLeadAlertMock,
}));

vi.mock("@/lib/inquiries/telegram", () => ({
  sendTelegramLeadAlert: sendTelegramLeadAlertMock,
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
    vi.stubEnv("ATTIO_API_KEY", "test-attio-key");
    upsertAttioPersonMock.mockResolvedValue("person_123");
    patchAttioPersonOptionalMock.mockResolvedValue(undefined);
    createAttioNoteMock.mockResolvedValue(undefined);
    createWebsiteLeadMock.mockResolvedValue({ leadId: "lead_abc" });
    completeWebsiteLeadAlertMock.mockResolvedValue(undefined);
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
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(upsertAttioPersonMock).toHaveBeenCalledTimes(1);
    expect(patchAttioPersonOptionalMock).toHaveBeenCalledTimes(1);
    expect(createAttioNoteMock).toHaveBeenCalledTimes(1);
    expect(createWebsiteLeadMock).toHaveBeenCalledTimes(1);
    expect(sendTelegramLeadAlertMock).toHaveBeenCalledTimes(1);
    expect(completeWebsiteLeadAlertMock).toHaveBeenCalledWith({
      leadId: "lead_abc",
      chatId: "chat_1",
      messageId: 42,
    });
  });

  it("sends Luke the exact Telegram alert with availability buttons wired", async () => {
    await post(FULL_PAYLOAD);

    expect(sendTelegramLeadAlertMock).toHaveBeenCalledWith({
      text: EXPECTED_TELEGRAM_TEXT,
      replyUrl: "https://wa.me/27821234567",
      replyLabel: "Message Thandi on WhatsApp",
      availabilityLeadId: "lead_abc",
    });
  });

  it.each(["2026-09-30", "Sep 30, 2026"])(
    "normalises date %j to eventDateIso 2026-09-30",
    async (date) => {
      const res = await post({ ...FULL_PAYLOAD, date });

      expect(res.status).toBe(200);
      expect(createWebsiteLeadMock).toHaveBeenCalledWith(
        expect.objectContaining({
          eventDateIso: "2026-09-30",
          eventDateText: "2026-09-30",
          dateFlexible: false,
        }),
      );
    },
  );

  it("rejects a dd/mm/yyyy date", async () => {
    const res = await post({ ...FULL_PAYLOAD, date: "30/09/2026" });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid event date" });
    expect(createWebsiteLeadMock).not.toHaveBeenCalled();
    expect(sendTelegramLeadAlertMock).not.toHaveBeenCalled();
  });

  it("rejects a national-format phone number and accepts E.164", async () => {
    const bad = await post({ ...FULL_PAYLOAD, phone: "0821234567" });
    expect(bad.status).toBe(400);
    await expect(bad.json()).resolves.toEqual({ error: "Invalid phone number" });

    const good = await post({ ...FULL_PAYLOAD, phone: "+27821234567" });
    expect(good.status).toBe(200);
  });

  it("rejects a national-format WhatsApp number when it differs from phone", async () => {
    const res = await post({
      ...FULL_PAYLOAD,
      whatsappSameAsPhone: false,
      whatsapp: "082 123 4567",
    });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid WhatsApp number" });
  });

  it("treats dateUnsure as a flexible date", async () => {
    const res = await post({ ...FULL_PAYLOAD, date: "", dateUnsure: true });

    expect(res.status).toBe(200);
    expect(createWebsiteLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventDateText: "Flexible / TBD",
        eventDateIso: null,
        dateFlexible: true,
      }),
    );
    const { text } = sendTelegramLeadAlertMock.mock.calls[0][0] as { text: string };
    expect(text).toContain("📅 Date: Flexible / TBD");
  });

  it("keeps a null guest count as null all the way to Supabase", async () => {
    const res = await post({ ...FULL_PAYLOAD, guestCount: null });

    expect(res.status).toBe(200);
    expect(createWebsiteLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({ guestCount: null }),
    );
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

  it("persists whatsappDigits so the alert can carry availability buttons", async () => {
    await post(FULL_PAYLOAD);

    expect(createWebsiteLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        whatsappDigits: "27821234567",
        phoneE164: "+27821234567",
        notes: FULL_PAYLOAD.notes,
        guestCount: 120,
        performanceMinutes: 60,
      }),
    );
  });

  it("returns 500 and skips the alert when Attio rejects the person", async () => {
    upsertAttioPersonMock.mockRejectedValueOnce(new Error("attio down"));

    const res = await post(FULL_PAYLOAD);

    expect(res.status).toBe(500);
    expect(sendTelegramLeadAlertMock).not.toHaveBeenCalled();
  });
});
