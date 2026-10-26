import { afterEach, describe, expect, it, vi } from "vitest";

import {
  hasTrustedBrowserOrigin,
  readBoundedJson,
  readBoundedText,
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

describe("readBoundedText", () => {
  it("rejects an oversized declared body before reading", async () => {
    const getReader = vi.fn();
    const request = {
      headers: new Headers({ "Content-Length": "9" }),
      body: { getReader },
    } as unknown as Request;

    await expect(readBoundedText(request, 8)).resolves.toEqual({ ok: false, error: "too_large" });
    expect(getReader).not.toHaveBeenCalled();
  });

  it("uses actual streamed bytes when Content-Length is understated or absent", async () => {
    const bytes = new TextEncoder().encode("123456789");
    for (const headers of [{ "Content-Length": "1" }, {}]) {
      const request = new Request("http://localhost:3000/webhook", {
        method: "POST",
        headers,
        body: new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(bytes.subarray(0, 4));
            controller.enqueue(bytes.subarray(4));
            controller.close();
          },
        }),
        duplex: "half",
      } as RequestInit & { duplex: "half" });

      await expect(readBoundedText(request, 8)).resolves.toEqual({ ok: false, error: "too_large" });
    }
  });

  it("preserves exact UTF-8 text within the byte limit and rejects malformed UTF-8", async () => {
    const body = '{"message":"Zażółć gęślą"}';
    await expect(readBoundedText(new Request("http://localhost/webhook", {
      method: "POST",
      body,
    }), new TextEncoder().encode(body).byteLength)).resolves.toEqual({ ok: true, value: body });

    const bomBody = `\uFEFF${body}`;
    const bomBytes = new TextEncoder().encode(bomBody);
    const multibyteBoundary = bomBytes.indexOf(0xc5) + 1;
    const splitBody = new Request("http://localhost/webhook", {
      method: "POST",
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(bomBytes.subarray(0, multibyteBoundary));
          controller.enqueue(bomBytes.subarray(multibyteBoundary));
          controller.close();
        },
      }),
      duplex: "half",
    } as RequestInit & { duplex: "half" });
    await expect(readBoundedText(splitBody, bomBytes.byteLength)).resolves.toEqual({ ok: true, value: bomBody });

    const invalidUtf8 = new Request("http://localhost/webhook", {
      method: "POST",
      body: new Uint8Array([0xc3, 0x28]),
    });
    await expect(readBoundedText(invalidUtf8, 8)).resolves.toEqual({ ok: false, error: "invalid_body" });
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
