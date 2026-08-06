import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  flushInquiryTraces,
  inquiryTelemetry,
  isTracingEnabled,
  traceInquiryRun,
} from "./tracing";

const TRACING_KEYS = [
  "LANGSMITH_TRACING",
  "LANGSMITH_API_KEY",
  "LANGSMITH_PROJECT",
  "LANGSMITH_ENDPOINT",
] as const;

describe("inquiry LangSmith tracing", () => {
  let saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    saved = Object.fromEntries(TRACING_KEYS.map((key) => [key, process.env[key]]));
    for (const key of TRACING_KEYS) delete process.env[key];
  });

  afterEach(() => {
    for (const key of TRACING_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("stays off unless tracing is explicitly enabled with a key", () => {
    expect(isTracingEnabled()).toBe(false);

    process.env.LANGSMITH_TRACING = "true";
    expect(isTracingEnabled()).toBe(false);

    process.env.LANGSMITH_API_KEY = "ls-test-key";
    expect(isTracingEnabled()).toBe(true);

    process.env.LANGSMITH_TRACING = "false";
    expect(isTracingEnabled()).toBe(false);
  });

  it("attaches no telemetry to AI SDK calls when disabled", () => {
    expect(inquiryTelemetry("extract-inquiry-facts")).toBeUndefined();
  });

  it("attaches a telemetry integration when enabled", () => {
    process.env.LANGSMITH_TRACING = "true";
    process.env.LANGSMITH_API_KEY = "ls-test-key";

    const telemetry = inquiryTelemetry("extract-inquiry-facts");

    expect(telemetry?.integrations).toHaveLength(1);
  });

  // The reply pipeline must behave identically whether or not LangSmith is
  // configured, so the wrapper is a transparent passthrough in both states.
  it("returns the wrapped result and propagates errors when disabled", async () => {
    await expect(
      traceInquiryRun({ name: "inquiry-agent" }, async () => "draft"),
    ).resolves.toBe("draft");

    await expect(
      traceInquiryRun({ name: "inquiry-agent" }, async () => {
        throw new Error("model failed");
      }),
    ).rejects.toThrow("model failed");
  });

  it("returns the wrapped result and propagates errors when enabled", async () => {
    process.env.LANGSMITH_TRACING = "true";
    process.env.LANGSMITH_API_KEY = "ls-test-key";

    await expect(
      traceInquiryRun(
        { name: "inquiry-agent", conversationId: "conv-1" },
        async () => "draft",
      ),
    ).resolves.toBe("draft");

    await expect(
      traceInquiryRun({ name: "inquiry-agent" }, async () => {
        throw new Error("model failed");
      }),
    ).rejects.toThrow("model failed");
  });

  // A bad key, a network blip, or a LangSmith outage must never surface as a
  // failed inquiry run.
  it("swallows flush failures", async () => {
    process.env.LANGSMITH_TRACING = "true";
    process.env.LANGSMITH_API_KEY = "ls-test-key";
    process.env.LANGSMITH_ENDPOINT = "http://127.0.0.1:1";

    await traceInquiryRun({ name: "inquiry-agent" }, async () => "draft");

    await expect(flushInquiryTraces()).resolves.toBeUndefined();
  });
});
