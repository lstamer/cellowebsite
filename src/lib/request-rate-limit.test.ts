import { afterEach, describe, expect, it, vi } from "vitest";

const rpcMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/inquiries/supabase", () => ({
  getSupabaseAdmin: () => ({ rpc: rpcMock }),
}));

import {
  consumeRateLimit,
  getSanitizedClientIp,
  rateLimitHeaders,
} from "./request-rate-limit";

describe("request rate limits", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("uses only a single validated Vercel client IP and sends an HMAC, never the raw IP", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "existing-service-secret");
    rpcMock.mockResolvedValue({
      data: [{ allowed: true, retry_after_seconds: 40, rate_limit: 5, remaining: 4 }],
      error: null,
    });
    const request = new Request("https://stamer.co.za/api/contact", {
      headers: { "x-vercel-forwarded-for": "203.0.113.7" },
    });

    await expect(consumeRateLimit("public_form", request)).resolves.toEqual({
      allowed: true,
      retryAfterSeconds: 40,
      limit: 5,
      remaining: 4,
    });
    expect(getSanitizedClientIp(request)).toBe("203.0.113.7");
    const args = rpcMock.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(args.p_family).toBe("public_form");
    expect(args.p_ip_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(args.p_ip_hash).not.toBe("203.0.113.7");
  });

  it("ignores generic forwarded headers and rejects malformed or chained platform values", () => {
    expect(getSanitizedClientIp(new Request("https://stamer.co.za", {
      headers: { "x-forwarded-for": "203.0.113.7", "x-real-ip": "203.0.113.8" },
    }))).toBeNull();
    expect(getSanitizedClientIp(new Request("https://stamer.co.za", {
      headers: { "x-vercel-forwarded-for": "203.0.113.7, 198.51.100.2" },
    }))).toBeNull();
    expect(getSanitizedClientIp(new Request("https://stamer.co.za", {
      headers: { "x-vercel-forwarded-for": "not-an-ip" },
    }))).toBeNull();
  });

  it("fails when the RPC fails or returns malformed data", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "database down" } });
    await expect(consumeRateLimit("admin_login", new Request("https://stamer.co.za"))).rejects.toThrow("database down");
    rpcMock.mockResolvedValueOnce({ data: { allowed: "yes" }, error: null });
    await expect(consumeRateLimit("admin_login", new Request("https://stamer.co.za"))).rejects.toThrow("invalid result");
  });

  it("exposes retry and counter headers", () => {
    expect(rateLimitHeaders({ allowed: false, retryAfterSeconds: 73, limit: 5, remaining: 0 })).toEqual({
      "RateLimit-Limit": "5",
      "RateLimit-Remaining": "0",
      "Retry-After": "73",
    });
  });
});
