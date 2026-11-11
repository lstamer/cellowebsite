import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BookingProgress, BookingSnapshot } from "@/lib/booking/progress";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/lib/inquiries/supabase", () => ({
  getSupabaseAdmin: () => ({ rpc }),
}));

import { POST } from "./route";

const origin = "https://stamer.co.za";
const snapshot: BookingSnapshot = {
  fullName: "Example Visitor",
  email: "example@example.com",
  phone: "",
  whatsappSameAsPhone: true,
  whatsapp: "",
  eventType: "wedding",
  eventTypeOther: "",
  date: "2026-12-11",
  dateUnsure: false,
  location: "Cape Town",
  bookingOnBehalf: false,
  organisation: "",
  bookerRole: "",
  bookerRoleOther: "",
  guestCount: null,
  performanceMinutes: 60,
  message: "",
};

function post(body: unknown, requestOrigin = origin) {
  return POST(new Request(`${origin}/api/booking/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: requestOrigin },
    body: JSON.stringify(body),
  }));
}

function firstStep(): BookingProgress {
  return { attemptId: randomUUID(), revision: 1, step: 1, snapshot, sessionId: null };
}

describe("POST /api/booking/progress", () => {
  beforeEach(() => {
    vi.stubEnv("SITE_ORIGIN", origin);
    rpc.mockResolvedValueOnce({
      data: [{ allowed: true, retry_after_seconds: 30, rate_limit: 120, remaining: 119 }],
      error: null,
    });
    rpc.mockResolvedValueOnce({ data: null, error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rpc.mockReset();
  });

  it("saves an incomplete attempt without a phone or selected role", async () => {
    const first = firstStep();
    expect((await post(first)).status).toBe(204);
    expect(rpc).toHaveBeenLastCalledWith("record_booking_progress", {
      p_attempt_id: first.attemptId,
      p_revision: 1,
      p_step: 1,
      p_snapshot: snapshot,
      p_session_id: null,
      p_phone_e164: null,
      p_whatsapp_e164: null,
      p_event: null,
    });
  });

  it("records the exact opened draft alongside its full snapshot, even on a first write", async () => {
    const completed = {
      ...snapshot,
      phone: "+27 82 123 4567",
      whatsappSameAsPhone: false,
      whatsapp: "+27 82 765 4321",
      bookerRole: "host",
      message: "Please play while guests arrive 🎻",
    };
    const event = {
      id: randomUUID(),
      action: "gmail",
      source: "template",
      subject: "Cello enquiry: Wedding",
      body: "Hi Luke,\n\nPlease play while guests arrive 🎻\n\nThanks,\nExample Visitor",
    };
    const first = firstStep();
    expect((await post({ ...first, revision: 2, step: 2, snapshot: completed, event })).status).toBe(204);
    expect(rpc).toHaveBeenLastCalledWith("record_booking_progress", {
      p_attempt_id: first.attemptId,
      p_revision: 2,
      p_step: 2,
      p_snapshot: completed,
      p_session_id: null,
      p_phone_e164: "+27821234567",
      p_whatsapp_e164: "+27827654321",
      p_event: event,
    });
  });

  it("rejects cross-origin, oversized, and invalid requests before a database call", async () => {
    const first = firstStep();
    expect((await post(first, "https://another.example")).status).toBe(403);
    expect((await post({ ...first, padding: "a".repeat(32_768) })).status).toBe(413);
    expect((await post({ ...first, step: 2 })).status).toBe(400);
    expect((await post({
      ...first,
      event: { id: randomUUID(), action: "whatsapp", source: "template", subject: null, body: "A draft" },
    })).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});
