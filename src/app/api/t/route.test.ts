import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const fromMock = vi.hoisted(() => vi.fn());
const consumeRateLimitMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/inquiries/supabase", () => ({
  getSupabaseAdmin: () => ({ from: fromMock }),
}));
vi.mock("@/lib/request-rate-limit", () => ({
  consumeRateLimit: consumeRateLimitMock,
  rateLimitHeaders: (result: { retryAfterSeconds: number }) => ({ "Retry-After": String(result.retryAfterSeconds) }),
}));

import { POST } from "./route";

function post(value: unknown, options: { origin?: string; contentType?: string } = {}) {
  const headers: Record<string, string> = {};
  if (options.origin !== undefined) headers.Origin = options.origin;
  if (options.contentType !== undefined) headers["Content-Type"] = options.contentType;
  return POST(new NextRequest("http://localhost/api/t", {
    method: "POST",
    headers,
    body: typeof value === "string" ? value : JSON.stringify(value),
  }));
}

describe("POST /api/t", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("rejects missing origins and wrong content types before storage", async () => {
    vi.stubEnv("SUPABASE_URL", "https://supabase.example");
    consumeRateLimitMock.mockResolvedValue({ allowed: true, retryAfterSeconds: 42, limit: 120, remaining: 119 });
    expect((await post({ t: "view", sid: "abcdefgh", path: "/" }, { contentType: "application/json" })).status).toBe(403);
    expect((await post("t=view", { origin: "http://localhost:3000", contentType: "text/plain" })).status).toBe(415);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("bounds telemetry properties and rejects unknown payload fields", async () => {
    vi.stubEnv("SUPABASE_URL", "https://supabase.example");
    consumeRateLimitMock.mockResolvedValue({ allowed: true, retryAfterSeconds: 42, limit: 120, remaining: 119 });
    const props = Object.fromEntries(Array.from({ length: 21 }, (_, index) => [`p${index}`, true]));
    const tooManyProps = await post({ t: "event", sid: "abcdefgh", name: "event_name", props }, {
      origin: "http://localhost:3000", contentType: "application/json",
    });
    const extraKey = await post({ t: "view", sid: "abcdefgh", path: "/", extra: true }, {
      origin: "http://localhost:3000", contentType: "application/json",
    });
    expect(tooManyProps.status).toBe(400);
    expect(extraKey.status).toBe(400);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("rejects body bytes beyond the configured limit", async () => {
    vi.stubEnv("SUPABASE_URL", "https://supabase.example");
    const response = await post(JSON.stringify({ t: "view", sid: "abcdefgh", path: "/", padding: "x".repeat(8_300) }), {
      origin: "http://localhost:3000", contentType: "application/json",
    });
    expect(response.status).toBe(413);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("silently drops rate-limited telemetry and limiter failures with 204", async () => {
    vi.stubEnv("SUPABASE_URL", "https://supabase.example");
    const event = { t: "event", sid: "abcdefgh", name: "event_name" };
    consumeRateLimitMock.mockResolvedValueOnce({ allowed: false, retryAfterSeconds: 42, limit: 120, remaining: 0 });
    const limited = await post(event, { origin: "http://localhost:3000", contentType: "application/json" });
    expect(limited.status).toBe(204);
    expect(limited.headers.get("retry-after")).toBe("42");
    expect(fromMock).not.toHaveBeenCalled();

    consumeRateLimitMock.mockRejectedValueOnce(new Error("database unavailable"));
    const unavailable = await post(event, { origin: "http://localhost:3000", contentType: "application/json" });
    expect(unavailable.status).toBe(204);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
