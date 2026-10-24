import { afterEach, describe, expect, it, vi } from "vitest";

import {
  hasTrustedBrowserOrigin,
  readBoundedJson,
  verifyTurnstileToken,
} from "./request-security";

function jsonRequest(body: BodyInit, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/write", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
}

describe("readBoundedJson", () => {
  it("rejects misleading small Content-Length when streamed bytes exceed the limit", async () => {
    const request = jsonRequest(JSON.stringify({ message: "long enough" }), { "Content-Length": "1" });
    await expect(readBoundedJson(request, 8)).resolves.toEqual({ ok: false, error: "too_large" });
  });

  it("rejects oversized declared bodies before reading", async () => {
    const request = jsonRequest("{}", { "Content-Length": "100" });
    await expect(readBoundedJson(request, 8)).resolves.toEqual({ ok: false, error: "too_large" });
  });

  it("requires JSON media type and reports malformed JSON", async () => {
    const form = new Request("http://localhost:3000", { method: "POST", body: "a=1" });
    const malformed = jsonRequest("{");
    await expect(readBoundedJson(form, 8)).resolves.toEqual({ ok: false, error: "content_type" });
    await expect(readBoundedJson(malformed, 8)).resolves.toEqual({ ok: false, error: "invalid_json" });
  });

  it("parses JSON within the actual byte limit", async () => {
    await expect(readBoundedJson(jsonRequest('{"ok":true}'), 32)).resolves.toEqual({ ok: true, value: { ok: true } });
  });
});

describe("hasTrustedBrowserOrigin", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("allows the configured site and its www alias without trusting Host", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SITE_ORIGIN", "https://stamer.co.za");
    const request = new Request("https://attacker.example/api/write", {
      method: "POST",
      headers: { Origin: "https://www.stamer.co.za", Host: "attacker.example" },
    });
    expect(hasTrustedBrowserOrigin(request)).toBe(true);
  });

  it("rejects absent and unrelated browser origins", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SITE_ORIGIN", "https://stamer.co.za");
    expect(hasTrustedBrowserOrigin(new Request("https://stamer.co.za/api/write", { method: "POST" }))).toBe(false);
    expect(hasTrustedBrowserOrigin(new Request("https://stamer.co.za/api/write", {
      method: "POST",
      headers: { Origin: "https://attacker.example" },
    }))).toBe(false);
  });
});

describe("verifyTurnstileToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("binds successful verification to the requested action and allowed hostname", async () => {
    vi.stubEnv("TURNSTILE_SECRET", "secret");
    vi.stubEnv("TURNSTILE_HOSTNAMES", "stamer.co.za");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      action: "contact",
      hostname: "stamer.co.za",
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("https://stamer.co.za/api/contact", { method: "POST" });
    await expect(verifyTurnstileToken("token", request, "contact")).resolves.toBe(true);
    await expect(verifyTurnstileToken("token", request, "book")).resolves.toBe(false);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      success: true,
      action: "contact",
      hostname: "attacker.example",
    }), { status: 200 }));
    await expect(verifyTurnstileToken("token", request, "contact")).resolves.toBe(false);
  });

  it("fails closed when production configuration is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SECRET", "");
    vi.stubEnv("TURNSTILE_HOSTNAMES", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(verifyTurnstileToken("token", new Request("https://stamer.co.za"), "book")).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
