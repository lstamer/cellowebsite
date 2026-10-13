import { afterEach, describe, expect, it, vi } from "vitest";

import {
  generateTextWithOpenRouterFallback,
  hasRecoverableAIError,
} from "./ai-fallback";

const chatMock = vi.hoisted(() => vi.fn());
const createOpenRouterMock = vi.hoisted(() => vi.fn(() => ({ chat: chatMock })));

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: createOpenRouterMock,
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("generateTextWithOpenRouterFallback", () => {
  it("keeps Vercel AI Gateway as the only call when it succeeds", async () => {
    const generate = vi.fn().mockResolvedValue("gateway result");

    await expect(
      generateTextWithOpenRouterFallback("openai/gpt-5.4-mini", generate),
    ).resolves.toBe("gateway result");

    expect(generate).toHaveBeenCalledTimes(1);
    expect(createOpenRouterMock).not.toHaveBeenCalled();
  });

  it("retries a network failure through configured OpenRouter", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-openrouter-key");
    vi.stubEnv("OPENROUTER_MODEL", "openai/gpt-5-mini");
    const fallbackModel = { provider: "openrouter" };
    chatMock.mockReturnValue(fallbackModel);
    const generate = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce("openrouter result");

    await expect(
      generateTextWithOpenRouterFallback("openai/gpt-5.4-mini", generate),
    ).resolves.toBe("openrouter result");

    expect(createOpenRouterMock).toHaveBeenCalledWith({
      apiKey: "test-openrouter-key",
    });
    expect(chatMock).toHaveBeenCalledWith("openai/gpt-5-mini");
    expect(generate.mock.calls.map(([model]) => model)).toEqual([
      "openai/gpt-5.4-mini",
      fallbackModel,
    ]);
  });

  it("does not retry a request validation error", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-openrouter-key");
    vi.stubEnv("OPENROUTER_MODEL", "openai/gpt-5-mini");
    const generate = vi.fn().mockRejectedValue(new Error("invalid schema"));

    await expect(
      generateTextWithOpenRouterFallback("openai/gpt-5.4-mini", generate),
    ).rejects.toThrow("invalid schema");

    expect(generate).toHaveBeenCalledTimes(1);
    expect(createOpenRouterMock).not.toHaveBeenCalled();
  });
});

describe("hasRecoverableAIError", () => {
  it("recognises fetch-level availability failures", () => {
    expect(hasRecoverableAIError(new TypeError("fetch failed"))).toBe(true);
    expect(hasRecoverableAIError(new Error("invalid request"))).toBe(false);
  });
});
