import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/inquiries/supabase", () => ({
  getSupabaseAdmin: () => ({ from: () => ({ select: () => ({ limit: async () => ({ error: null }) }) }) }),
}));

import { runInternalHealthChecks, runWorkerIntegrationHealthChecks } from "./health";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("health credential boundaries", () => {
  it("checks the web app without requiring worker credentials", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-telegram-key");
    vi.stubEnv("ZERNIO_API_KEY", "");
    vi.stubEnv("AI_GATEWAY_API_KEY", "");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, result: { username: "test" } })));
    vi.stubGlobal("fetch", fetchMock);
    const results = await runInternalHealthChecks();
    expect(results.map(result => result.check)).toEqual(["supabase", "telegram"]);
    expect(results.every(result => result.ok)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("checks worker integrations without exposing keys in returned details", async () => {
    vi.stubEnv("ZERNIO_API_KEY", "test-zernio-key");
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-gateway-key");
    const fetchMock = vi.fn().mockImplementation(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const results = await runWorkerIntegrationHealthChecks();
    expect(results.map(result => result.check)).toEqual(["zernio", "ai_gateway"]);
    expect(results.every(result => result.ok)).toBe(true);
    expect(JSON.stringify(results)).not.toContain("test-zernio-key");
    expect(JSON.stringify(results)).not.toContain("test-gateway-key");
  });
});
