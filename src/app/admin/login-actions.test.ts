import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerAuthClient, logAdminEvent, consumeRateLimit } = vi.hoisted(() => ({
  createServerAuthClient: vi.fn(),
  logAdminEvent: vi.fn(async () => undefined),
  consumeRateLimit: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(
    async () =>
      new Headers({
        host: "admin.stamer.co.za",
        "x-vercel-forwarded-for": "203.0.113.8",
        "x-forwarded-host": "evil.example",
        "x-forwarded-proto": "http",
      }),
  ),
}));

vi.mock("@/lib/admin/auth", () => ({
  getAllowedAdminEmails: () => new Set(["admin@example.com"]),
  isAllowedAdminEmail: (email: string) => email === "admin@example.com",
}));

vi.mock("@/lib/admin/events", () => ({
  describeError: () => "masked error",
  logAdminEvent,
}));

vi.mock("@/lib/admin/supabase-auth", () => ({
  createServerAuthClient,
}));

vi.mock("@/lib/request-rate-limit", () => ({
  consumeRateLimit,
}));

import { sendMagicLink } from "@/app/admin/(auth)/login/actions";
import { consumeRateLimit as consumeRateLimitMock } from "@/lib/request-rate-limit";

describe("admin email login action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(consumeRateLimitMock).mockResolvedValue({
      allowed: true,
      retryAfterSeconds: 0,
      limit: 10,
      remaining: 9,
    });
  });

  it("does not mint or return a session when given the former bypass phrase", async () => {
    const form = new FormData();
    form.set("email", "skipmagiclink");

    await expect(sendMagicLink(form)).resolves.toEqual({ ok: true, channel: "email" });
    expect(consumeRateLimitMock).toHaveBeenCalledWith("admin_login", expect.any(Request));
    expect(createServerAuthClient).not.toHaveBeenCalled();
    expect(logAdminEvent).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "login_rejected" }),
    );
  });

  it("throttles invalid addresses before writing rejection logs", async () => {
    vi.mocked(consumeRateLimitMock).mockResolvedValueOnce({
      allowed: false,
      retryAfterSeconds: 60,
      limit: 10,
      remaining: 0,
    });
    const form = new FormData();
    form.set("email", "not-an-email");

    await expect(sendMagicLink(form)).resolves.toEqual({
      ok: false,
      error: "Too many sign-in attempts. Please wait and try again.",
    });
    expect(logAdminEvent).not.toHaveBeenCalled();
    expect(createServerAuthClient).not.toHaveBeenCalled();
  });

  it("fails closed without logging when the distributed limiter is unavailable", async () => {
    vi.mocked(consumeRateLimitMock).mockRejectedValueOnce(new Error("backend details"));
    const form = new FormData();
    form.set("email", "admin@example.com");

    await expect(sendMagicLink(form)).resolves.toEqual({
      ok: false,
      error: "Sign-in is temporarily unavailable. Please try again shortly.",
    });
    expect(logAdminEvent).not.toHaveBeenCalled();
    expect(createServerAuthClient).not.toHaveBeenCalled();
  });

  it("keeps the normal allow-listed email magic-link flow", async () => {
    const signInWithOtp = vi.fn(async () => ({ error: null }));
    createServerAuthClient.mockResolvedValue({ auth: { signInWithOtp } });
    const form = new FormData();
    form.set("email", "admin@example.com");

    await expect(sendMagicLink(form)).resolves.toEqual({ ok: true, channel: "email" });
    const request = vi.mocked(consumeRateLimitMock).mock.calls[0]?.[1];
    expect(request?.url).toBe("https://admin.stamer.co.za/admin/login");
    expect(request?.headers.get("x-vercel-forwarded-for")).toBe("203.0.113.8");
    expect(request?.headers.has("x-forwarded-host")).toBe(false);
    expect(request?.headers.has("x-forwarded-for")).toBe(false);
    expect(signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "admin@example.com",
        options: expect.objectContaining({
          emailRedirectTo: "https://admin.stamer.co.za/auth/callback",
        }),
      }),
    );
  });
});
