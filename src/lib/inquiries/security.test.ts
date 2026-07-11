import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  constantTimeEqual,
  parseTelegramDecision,
  verifyHmacSignature,
} from "./security";

describe("inquiry webhook security", () => {
  it("accepts the exact Zernio HMAC and rejects malformed signatures", () => {
    const body = JSON.stringify({ event: "message.received" });
    const secret = "webhook-secret";
    const signature = createHmac("sha256", secret).update(body).digest("hex");

    expect(verifyHmacSignature(body, signature, secret)).toBe(true);
    expect(verifyHmacSignature(`${body} `, signature, secret)).toBe(false);
    expect(verifyHmacSignature(body, "not-a-signature", secret)).toBe(false);
    expect(verifyHmacSignature(body, null, secret)).toBe(false);
  });

  it("compares Telegram webhook secrets exactly", () => {
    expect(constantTimeEqual("secret_123", "secret_123")).toBe(true);
    expect(constantTimeEqual("secret_124", "secret_123")).toBe(false);
    expect(constantTimeEqual(null, "secret_123")).toBe(false);
  });

  it("parses only compact, valid Telegram approval callbacks", () => {
    const id = "0f6dbf26-c2c8-4da6-8bd4-a894232b53c8";

    expect(parseTelegramDecision(`inq:a:${id}`)).toEqual({
      approvalId: id,
      decision: "approve",
    });
    expect(parseTelegramDecision(`inq:r:${id}`)).toEqual({
      approvalId: id,
      decision: "reject",
    });
    expect(parseTelegramDecision(`approve:${id}`)).toBeNull();
    expect(parseTelegramDecision("inq:a:not-a-uuid")).toBeNull();
  });
});
