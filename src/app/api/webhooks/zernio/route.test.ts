import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ingestZernioMessageMock = vi.hoisted(() => vi.fn());
const afterCallbacks = vi.hoisted(() => [] as Array<() => Promise<void>>);

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: (callback: () => Promise<void>) => {
    afterCallbacks.push(callback);
  },
}));

vi.mock("@/lib/inquiries/env", () => ({
  requireEnv: () => "test-webhook-secret",
}));

vi.mock("@/lib/inquiries/supabase", () => ({
  claimInquiryOutboxEvent: vi.fn(),
  completeInquiryOutboxEvent: vi.fn(),
  ingestZernioMessage: ingestZernioMessageMock,
  releaseInquiryOutboxEvent: vi.fn(),
}));

vi.mock("@/lib/inquiries/triggering", () => ({
  triggerInquiryProcessing: vi.fn(),
}));

import { POST } from "./route";

const SECRET = "test-webhook-secret";
const PAYLOAD = {
  id: "event-1",
  event: "message.received",
  message: {
    id: "message-1",
    conversationId: "conversation-1",
    platform: "whatsapp",
    platformMessageId: "platform-message-1",
    direction: "incoming",
    text: "Hello",
    attachments: [],
    sender: { id: "sender-1" },
    sentAt: "2026-10-26T10:00:00.000Z",
    isRead: false,
  },
  conversation: {
    id: "conversation-1",
    platformConversationId: "platform-conversation-1",
    status: "active",
  },
  account: { id: "account-1", platform: "whatsapp", username: "stamer" },
  timestamp: "2026-10-26T10:00:00.000Z",
};

function signature(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

function post(body: BodyInit, signatureHeader?: string, headers: Record<string, string> = {}) {
  return POST(new Request("https://stamer.co.za/api/webhooks/zernio", {
    method: "POST",
    headers: {
      ...(signatureHeader ? { "x-zernio-signature": signatureHeader } : {}),
      ...headers,
    },
    body,
  }));
}

function streamedRequest(body: ReadableStream<Uint8Array>, headers: Record<string, string>) {
  return POST(new Request("https://stamer.co.za/api/webhooks/zernio", {
    method: "POST",
    headers,
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" }));
}

describe("POST /api/webhooks/zernio", () => {
  beforeEach(() => {
    afterCallbacks.length = 0;
    ingestZernioMessageMock.mockResolvedValue({
      duplicate: false,
      outboxId: "outbox-1",
      conversationId: "conversation-1",
    });
  });

  afterEach(() => vi.clearAllMocks());

  it("rejects a body whose actual streamed bytes exceed 256 KiB, even with a small Content-Length", async () => {
    let consumedBytes = 0;
    const chunk = new Uint8Array(64 * 1024);
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (consumedBytes >= 256 * 1024 + 1) {
          controller.close();
          return;
        }
        const remaining = 256 * 1024 + 1 - consumedBytes;
        const next = chunk.subarray(0, Math.min(chunk.byteLength, remaining));
        consumedBytes += next.byteLength;
        controller.enqueue(next);
      },
    });

    const response = await streamedRequest(body, {
      "x-zernio-signature": "a".repeat(64),
      "content-length": "1",
    });

    expect(response.status).toBe(413);
    expect(consumedBytes).toBe(256 * 1024 + 1);
    expect(ingestZernioMessageMock).not.toHaveBeenCalled();
  });

  it("enforces the cap on chunked requests without Content-Length", async () => {
    const chunk = new Uint8Array(256 * 1024 + 1);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(chunk);
        controller.close();
      },
    });

    const response = await streamedRequest(body, { "x-zernio-signature": "b".repeat(64) });

    expect(response.status).toBe(413);
    expect(ingestZernioMessageMock).not.toHaveBeenCalled();
  });

  it("rejects absent or malformed signatures before consuming the body", async () => {
    for (const signatureHeader of [undefined, "sha256=not-hex"]) {
      const getReader = vi.fn();
      const request = {
        headers: new Headers(signatureHeader ? { "x-zernio-signature": signatureHeader } : {}),
        body: { getReader },
      } as unknown as Request;
      const response = await POST(request);
      expect(response.status).toBe(401);
      expect(getReader).not.toHaveBeenCalled();
    }
    expect(ingestZernioMessageMock).not.toHaveBeenCalled();
  });

  it("keeps valid signed delivery working with the legacy header alias and sha256 prefix", async () => {
    const rawBody = JSON.stringify(PAYLOAD);
    const signed = `sha256=${signature(rawBody).toUpperCase()}`;
    const response = await post(rawBody, undefined, { "x-late-signature": signed });

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({
      received: true,
      duplicate: false,
      conversationId: "conversation-1",
    });
    expect(ingestZernioMessageMock).toHaveBeenCalledWith(PAYLOAD);
    expect(afterCallbacks).toHaveLength(1);
  });

  it("rejects an invalid signature after reading a bounded body", async () => {
    const rawBody = JSON.stringify(PAYLOAD);
    const response = await post(rawBody, "0".repeat(64));

    expect(response.status).toBe(401);
    expect(ingestZernioMessageMock).not.toHaveBeenCalled();
  });

  it("verifies original BOM bytes before rejecting BOM-prefixed JSON", async () => {
    const rawBody = `\uFEFF${JSON.stringify(PAYLOAD)}`;
    const response = await post(rawBody, signature(rawBody));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid JSON" });
    expect(ingestZernioMessageMock).not.toHaveBeenCalled();
  });
});
