import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  constantTimeEqual,
  parseTelegramCallback,
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

  it("tolerates provider formatting variants of a valid signature", () => {
    const body = JSON.stringify({ event: "message.received" });
    const secret = "webhook-secret";
    const signature = createHmac("sha256", secret).update(body).digest("hex");

    expect(verifyHmacSignature(body, signature.toUpperCase(), secret)).toBe(true);
    expect(verifyHmacSignature(body, `sha256=${signature}`, secret)).toBe(true);
    expect(
      verifyHmacSignature(body, ` SHA256=${signature.toUpperCase()} `, secret),
    ).toBe(true);
    expect(verifyHmacSignature(body, `sha256=${"0".repeat(64)}`, secret)).toBe(false);
  });

  it("compares Telegram webhook secrets exactly", () => {
    expect(constantTimeEqual("secret_123", "secret_123")).toBe(true);
    expect(constantTimeEqual("secret_124", "secret_123")).toBe(false);
    expect(constantTimeEqual(null, "secret_123")).toBe(false);
  });

  it("parses only compact, valid Telegram approval callbacks", () => {
    const id = "0f6dbf26-c2c8-4da6-8bd4-a894232b53c8";

    expect(parseTelegramCallback(`inq:a:${id}`)).toEqual({
      kind: "approval",
      approvalId: id,
      decision: "approve",
    });
    expect(parseTelegramCallback(`inq:d:${id}`)).toEqual({
      kind: "approval",
      approvalId: id,
      decision: "dismiss",
    });
    expect(parseTelegramCallback(`approve:${id}`)).toBeNull();
    expect(parseTelegramCallback("inq:a:not-a-uuid")).toBeNull();
    expect(parseTelegramCallback(`inq:a:${id}:extra`)).toBeNull();
  });

  it("keeps parsing the legacy Reject verb on cards sent before the rename", () => {
    const id = "0f6dbf26-c2c8-4da6-8bd4-a894232b53c8";

    expect(parseTelegramCallback(`inq:r:${id}`)).toEqual({
      kind: "approval",
      approvalId: id,
      decision: "dismiss",
    });
  });

  it("parses availability, website-lead, and override-confirm callbacks", () => {
    const id = "0f6dbf26-c2c8-4da6-8bd4-a894232b53c8";

    expect(parseTelegramCallback(`inq:v:a:${id}`)).toEqual({
      kind: "availability",
      availability: "available",
      checkId: id,
    });
    expect(parseTelegramCallback(`inq:v:u:${id}`)).toEqual({
      kind: "availability",
      availability: "unavailable",
      checkId: id,
    });
    expect(parseTelegramCallback(`wl:a:${id}`)).toEqual({
      kind: "lead_availability",
      availability: "available",
      leadId: id,
    });
    expect(parseTelegramCallback(`wl:u:${id}`)).toEqual({
      kind: "lead_availability",
      availability: "unavailable",
      leadId: id,
    });
    expect(parseTelegramCallback(`wl:s:${id}`)).toEqual({
      kind: "lead_review",
      decision: "approve",
      leadId: id,
    });
    expect(parseTelegramCallback(`wl:d:${id}`)).toEqual({
      kind: "lead_review",
      decision: "dismiss",
      leadId: id,
    });
    expect(parseTelegramCallback(`ovr:s:${id}`)).toEqual({
      kind: "override_confirm",
      decision: "send",
      confirmId: id,
    });
    expect(parseTelegramCallback(`ovr:c:${id}`)).toEqual({
      kind: "override_confirm",
      decision: "cancel",
      confirmId: id,
    });
    expect(parseTelegramCallback(`wl:x:${id}`)).toBeNull();
    expect(parseTelegramCallback(`ovr:s:`)).toBeNull();
    expect(parseTelegramCallback(id)).toBeNull();
  });

  it("parses suggest-changes callbacks on both draft paths and the cancel verb", () => {
    const id = "0f6dbf26-c2c8-4da6-8bd4-a894232b53c8";

    expect(parseTelegramCallback(`inq:sc:${id}`)).toEqual({
      kind: "suggest_changes",
      target: "approval",
      approvalId: id,
    });
    expect(parseTelegramCallback(`wl:sc:${id}`)).toEqual({
      kind: "suggest_changes",
      target: "website_lead",
      leadId: id,
    });
    expect(parseTelegramCallback(`sug:x:${id}`)).toEqual({
      kind: "suggest_changes_cancel",
      requestId: id,
    });
    expect(parseTelegramCallback("inq:sc:not-a-uuid")).toBeNull();
    expect(parseTelegramCallback("inq:sc:")).toBeNull();
    expect(parseTelegramCallback(`inq:sc:${id}:extra`)).toBeNull();
    expect(parseTelegramCallback("wl:sc:not-a-uuid")).toBeNull();
    expect(parseTelegramCallback("sug:x:")).toBeNull();
  });

  it("keeps every callback verb inside Telegram's 64-byte budget", () => {
    const id = "0f6dbf26-c2c8-4da6-8bd4-a894232b53c8";
    const verbs = [
      `inq:a:${id}`,
      `inq:d:${id}`,
      `inq:v:a:${id}`,
      `inq:v:u:${id}`,
      `wl:a:${id}`,
      `wl:u:${id}`,
      `wl:s:${id}`,
      `wl:d:${id}`,
      `ovr:s:${id}`,
      `ovr:c:${id}`,
      `inq:sc:${id}`,
      `wl:sc:${id}`,
      `sug:x:${id}`,
    ];

    for (const verb of verbs) {
      expect(Buffer.byteLength(verb, "utf8")).toBeLessThanOrEqual(64);
      expect(parseTelegramCallback(verb)).not.toBeNull();
    }
  });
});
