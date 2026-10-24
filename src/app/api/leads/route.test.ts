/**
 * Contract tests for the website inquiry endpoint.
 *
 * The form on /book posts here. Supabase is the gate (no row, no success) and
 * the Telegram alert is best-effort, delivered after the response and tracked
 * on the lead row. These tests pin the wire format so a client-side change
 * cannot silently drop leads with a 400, and pin the exact Telegram text so
 * Luke's notification cannot change by accident.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createWebsiteLeadMock = vi.hoisted(() => vi.fn());
const claimWebsiteLeadAlertMock = vi.hoisted(() => vi.fn());
const completeWebsiteLeadAlertMock = vi.hoisted(() => vi.fn());
const failWebsiteLeadAlertMock = vi.hoisted(() => vi.fn());
const sendTelegramLeadAlertMock = vi.hoisted(() => vi.fn());
const logAdminEventMock = vi.hoisted(() => vi.fn());
const turnstileFetchMock = vi.hoisted(() => vi.fn());
const afterCallbacks = vi.hoisted(() => [] as Array<() => Promise<void>>);
const consumeRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/request-rate-limit", () => ({
  consumeRateLimit: consumeRateLimitMock,
  rateLimitHeaders: (result: { retryAfterSeconds: number; limit: number; remaining: number }) => ({
    "Retry-After": String(result.retryAfterSeconds),
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
  }),
}));

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
  buildWaMePrefill: (digits: string, text: string) => ({
    url: `https://wa.me/${digits}?text=${encodeURIComponent(text)}`,
    truncated: false,
  }),
  sendTelegramLeadAlert: sendTelegramLeadAlertMock,
}));

vi.mock("@/lib/admin/events", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin/events")>()),
  logAdminEvent: logAdminEventMock,
}));

vi.mock("@/lib/admin/template-store", () => ({
  loadTemplateOverrides: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "./route";
import { buildMessage } from "@/lib/booking/build-message";

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
  "cf-turnstile-response": "test-turnstile-token",
};

// What the claim RPC hands back for FULL_PAYLOAD once the row exists.
const CLAIMED_RECORD = {
  leadId: "3f2a6c1e-0b4d-4e8a-9c7f-1d2e3f4a5b6c",
  source: "lead_form" as const,
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
  guestCount: 120,
  performanceMinutes: 60,
  bookerRole: "Bride",
  message: "Ceremony and cocktails please.",
  alertAttempts: 1,
  createdAt: "2026-09-05T10:00:00.000Z",
};

/**
 * The exact message Luke receives on Telegram for FULL_PAYLOAD. Change this
 * only when he asks for the notification to change (or edits the
 * `telegram.lead_alert` template from the admin, which overrides it).
 */
const EXPECTED_TELEGRAM_TEXT = [
  "🎻 New inquiry from stamer.co.za",
  "📋 Source: Booking form (/book)",
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
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify(body),
    }),
  );
}

async function flushAfter() {
  const callbacks = afterCallbacks.splice(0);
  for (const callback of callbacks) await callback();
}

function turnstileResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/leads", () => {
  beforeEach(() => {
    afterCallbacks.length = 0;
    createWebsiteLeadMock.mockResolvedValue({ leadId: CLAIMED_RECORD.leadId });
    claimWebsiteLeadAlertMock.mockResolvedValue({
      claimed: true,
      status: "sending",
      record: CLAIMED_RECORD,
    });
    completeWebsiteLeadAlertMock.mockResolvedValue(undefined);
    failWebsiteLeadAlertMock.mockResolvedValue({ attempts: 1 });
    sendTelegramLeadAlertMock.mockResolvedValue({ ok: true, chatId: "chat_1", messageId: 42 });
    logAdminEventMock.mockResolvedValue(undefined);
    consumeRateLimitMock.mockResolvedValue({ allowed: true, retryAfterSeconds: 300, limit: 5, remaining: 4 });
    turnstileFetchMock.mockImplementation(async () =>
      turnstileResponse({ success: true, action: "book", hostname: "localhost" }),
    );
    vi.stubEnv("TURNSTILE_SECRET", "test-secret");
    vi.stubEnv("TURNSTILE_HOSTNAMES", "localhost");
    vi.stubGlobal("fetch", turnstileFetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("stores the lead, responds, then alerts Telegram after the response", async () => {
    const res = await post(FULL_PAYLOAD);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true, leadId: CLAIMED_RECORD.leadId });
    expect(createWebsiteLeadMock).toHaveBeenCalledTimes(1);
    expect(createWebsiteLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.not.objectContaining({
          "cf-turnstile-response": "test-turnstile-token",
        }),
      }),
    );
    // Nothing has been sent yet: the alert runs in after().
    expect(sendTelegramLeadAlertMock).not.toHaveBeenCalled();

    await flushAfter();

    expect(claimWebsiteLeadAlertMock).toHaveBeenCalledWith(CLAIMED_RECORD.leadId);
    expect(sendTelegramLeadAlertMock).toHaveBeenCalledTimes(1);
    expect(completeWebsiteLeadAlertMock).toHaveBeenCalledWith({
      leadId: CLAIMED_RECORD.leadId,
      chatId: "chat_1",
      messageId: 42,
    });
    expect(failWebsiteLeadAlertMock).not.toHaveBeenCalled();
  });

  it("accepts the real generated notes for a maximum length message", async () => {
    const message = "é".repeat(2_000);
    const notes = buildMessage({
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
      message,
      bookingOnBehalf: false,
      organisation: "",
      bookerRole: "bride",
      bookerRoleOther: "",
    });

    const response = await post({ ...FULL_PAYLOAD, message, notes });

    expect(response.status).toBe(200);
    expect(createWebsiteLeadMock).toHaveBeenCalledWith(expect.objectContaining({ message, notes }));
  });

  it("sends the Turnstile token to Siteverify", async () => {
    await post(FULL_PAYLOAD);

    const call = turnstileFetchMock.mock.calls[0] as [string, RequestInit];
    const body = call[1].body as URLSearchParams;
    expect(call[0]).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(call[1].method).toBe("POST");
    expect(body.get("secret")).toBe("test-secret");
    expect(body.get("response")).toBe("test-turnstile-token");
  });

  it("rejects a booking without a Turnstile token", async () => {
    const { "cf-turnstile-response": _token, ...withoutToken } = FULL_PAYLOAD;
    void _token;

    const res = await post(withoutToken);

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Verification failed" });
    expect(turnstileFetchMock).not.toHaveBeenCalled();
    expect(createWebsiteLeadMock).not.toHaveBeenCalled();
  });

  it("rejects rate limited bookings before Turnstile or lead storage", async () => {
    consumeRateLimitMock.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 121, limit: 5, remaining: 0 });
    const limited = await post(FULL_PAYLOAD);
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("121");
    expect(turnstileFetchMock).not.toHaveBeenCalled();
    expect(createWebsiteLeadMock).not.toHaveBeenCalled();

    consumeRateLimitMock.mockRejectedValueOnce(new Error("database unavailable"));
    const unavailable = await post(FULL_PAYLOAD);
    expect(unavailable.status).toBe(503);
    expect(turnstileFetchMock).not.toHaveBeenCalled();
    expect(createWebsiteLeadMock).not.toHaveBeenCalled();
  });

  it("rejects missing origin, oversized bodies, long fields, and unknown keys before persistence", async () => {
    const noOrigin = new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(FULL_PAYLOAD),
    });
    expect((await POST(noOrigin)).status).toBe(403);
    expect((await post({ ...FULL_PAYLOAD, firstName: "x".repeat(101) })).status).toBe(400);
    expect((await post({ ...FULL_PAYLOAD, extra: "no" })).status).toBe(400);
    const oversized = new Request("http://localhost/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },
      body: JSON.stringify({ ...FULL_PAYLOAD, message: "x".repeat(33_000) }),
    });
    expect((await POST(oversized)).status).toBe(413);
    expect(createWebsiteLeadMock).not.toHaveBeenCalled();
  });

  it("rejects a Turnstile token with the wrong action or hostname", async () => {
    turnstileFetchMock.mockResolvedValueOnce(
      turnstileResponse({ success: true, action: "contact", hostname: "localhost" }),
    );

    const res = await post(FULL_PAYLOAD);

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Verification failed" });
    expect(createWebsiteLeadMock).not.toHaveBeenCalled();
  });

  it("sends Luke the exact Telegram alert with three prefilled WhatsApp links", async () => {
    await post(FULL_PAYLOAD);
    await flushAfter();

    expect(sendTelegramLeadAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: EXPECTED_TELEGRAM_TEXT,
        replyUrl: expect.stringMatching(
          /^https:\/\/wa\.me\/27821234567\?text=/,
        ),
        replyLabel: "Message Thandi on WhatsApp",
        availableUrl: expect.stringMatching(
          /^https:\/\/wa\.me\/27821234567\?text=/,
        ),
        unavailableUrl: expect.stringMatching(
          /^https:\/\/wa\.me\/27821234567\?text=/,
        ),
      }),
    );

    const call = sendTelegramLeadAlertMock.mock.calls[0]?.[0] as {
      availableUrl?: string;
      unavailableUrl?: string;
    };
    expect(decodeURIComponent(call.availableUrl?.split("?text=")[1] ?? "")).toContain(
      "I am available on the 30th of September",
    );
    expect(decodeURIComponent(call.unavailableUrl?.split("?text=")[1] ?? "")).toContain(
      "My bookings are particularly busy around then",
    );
  });

  it("returns 500 with no alert when Supabase rejects the lead, and logs an event", async () => {
    createWebsiteLeadMock.mockRejectedValueOnce(new Error("db down"));

    const res = await post(FULL_PAYLOAD);

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: "Could not save your enquiry. Please try again or message on WhatsApp.",
    });
    await flushAfter();
    expect(sendTelegramLeadAlertMock).not.toHaveBeenCalled();
    expect(logAdminEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ level: "error", source: "supabase", kind: "lead_persist_failed" }),
    );
  });

  it("still returns 200 when Telegram fails, marks the alert failed and logs an event", async () => {
    sendTelegramLeadAlertMock.mockResolvedValueOnce({ ok: false, error: "429 flood" });

    const res = await post(FULL_PAYLOAD);
    expect(res.status).toBe(200);

    await flushAfter();

    expect(failWebsiteLeadAlertMock).toHaveBeenCalledWith({
      leadId: CLAIMED_RECORD.leadId,
      error: "429 flood",
    });
    expect(completeWebsiteLeadAlertMock).not.toHaveBeenCalled();
    expect(logAdminEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        level: "error",
        source: "telegram",
        kind: "lead_alert_failed",
        entityId: CLAIMED_RECORD.leadId,
      }),
    );
  });

  it("does not post a second card when the claim says another worker owns the alert", async () => {
    claimWebsiteLeadAlertMock.mockResolvedValueOnce({ claimed: false, status: "sent" });

    await post(FULL_PAYLOAD);
    await flushAfter();

    expect(sendTelegramLeadAlertMock).not.toHaveBeenCalled();
  });

  it("stores an email-only lead (no phone) and alerts without WhatsApp buttons", async () => {
    claimWebsiteLeadAlertMock.mockResolvedValueOnce({
      claimed: true,
      status: "sending",
      record: {
        ...CLAIMED_RECORD,
        phone: null,
        whatsapp: null,
        whatsappDigits: null,
        contactPreference: "email",
      },
    });

    const res = await post({
      ...FULL_PAYLOAD,
      phone: "",
      whatsapp: "",
      contactPreference: "email",
    });

    expect(res.status).toBe(200);
    expect(createWebsiteLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({ whatsappDigits: null, phoneE164: null, phone: null }),
    );

    await flushAfter();
    const call = sendTelegramLeadAlertMock.mock.calls[0][0] as {
      text: string;
      replyUrl?: string;
      availabilityLeadId?: string;
    };
    expect(call.replyUrl).toBeUndefined();
    expect(call.availabilityLeadId).toBeUndefined();
    expect(call.text).not.toContain("📞 Phone");
    expect(call.text).not.toContain("💬 WhatsApp");
    expect(call.text).toContain("📨 Preferred contact: Email");
  });

  it("does not expose availability buttons when WhatsApp is not the preferred channel", async () => {
    claimWebsiteLeadAlertMock.mockResolvedValueOnce({
      claimed: true,
      status: "sending",
      record: { ...CLAIMED_RECORD, contactPreference: "email" },
    });

    await post({ ...FULL_PAYLOAD, contactPreference: "email" });
    await flushAfter();

    expect(sendTelegramLeadAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        replyUrl: undefined,
        availableUrl: undefined,
        unavailableUrl: undefined,
      }),
    );
  });

  it("passes a well-formed analytics session id through and drops a bad one", async () => {
    await post({ ...FULL_PAYLOAD, sessionId: "abc123XYZ_-9" });
    expect(createWebsiteLeadMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ sessionId: "abc123XYZ_-9" }),
    );

    await post({ ...FULL_PAYLOAD, sessionId: "<script>" });
    expect(createWebsiteLeadMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ sessionId: null }),
    );
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
  });

  it("keeps a null guest count as null all the way to Supabase", async () => {
    const res = await post({ ...FULL_PAYLOAD, guestCount: null });

    expect(res.status).toBe(200);
    expect(createWebsiteLeadMock).toHaveBeenCalledWith(
      expect.objectContaining({ guestCount: null }),
    );
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

  it("persists whatsappDigits and E.164 so the alert can carry availability buttons", async () => {
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
});
