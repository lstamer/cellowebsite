import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  TELEGRAM_MAX_DOWNLOAD_BYTES,
  transcribeTelegramVoice,
  VoiceTranscriptionError,
} from "./voice";

const transcribeMock = vi.hoisted(() => vi.fn());
const transcriptionModelMock = vi.hoisted(() =>
  vi.fn((modelId: string) => ({ modelId })),
);

vi.mock("ai", () => ({ transcribe: transcribeMock }));
vi.mock("@ai-sdk/gateway", () => ({
  gateway: { transcriptionModel: transcriptionModelMock },
}));

type FetchCall = { url: string };

const calls: FetchCall[] = [];

// A minimal OGG container header, matching what Telegram serves for voice
// notes: the bytes the AI SDK sniffs to label the payload audio/ogg.
const oggBytes = new Uint8Array([0x4f, 0x67, 0x67, 0x53, 0x00, 0x02, 0x00, 0x00]);

function stubFetch(
  handlers: { getFile: () => Promise<Response>; download?: () => Promise<Response> },
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      calls.push({ url });
      if (url.includes("/getFile")) return handlers.getFile();
      if (!handlers.download) {
        throw new Error(`unexpected download call: ${url}`);
      }
      return handlers.download();
    }),
  );
}

function okGetFile(result: Record<string, unknown>) {
  return async () =>
    new Response(JSON.stringify({ ok: true, result }), { status: 200 });
}

function okDownload() {
  return async () => new Response(oggBytes, { status: 200 });
}

const downloadCalls = () =>
  calls.filter((call) => call.url.includes("/file/bot"));

beforeEach(() => {
  calls.length = 0;
  transcribeMock.mockReset();
  transcriptionModelMock.mockClear();
  transcribeMock.mockResolvedValue({ text: "  make it warmer  " });
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
  vi.stubEnv("AI_GATEWAY_API_KEY", "test-gateway-key");
  // Genuinely unset, not blank, so the default is exercised for real.
  vi.stubEnv("AI_TRANSCRIBE_MODEL", undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("transcribeTelegramVoice", () => {
  it("resolves the file, downloads it, and returns the trimmed transcript", async () => {
    stubFetch({
      getFile: okGetFile({ file_path: "voice/file_1.oga", file_size: 12_345 }),
      download: okDownload(),
    });

    const text = await transcribeTelegramVoice("AwACAgQAAx0");

    expect(text).toBe("make it warmer");
    expect(calls[0].url).toContain(
      "https://api.telegram.org/bottest-token/getFile?file_id=AwACAgQAAx0",
    );
    expect(calls[1].url).toBe(
      "https://api.telegram.org/file/bottest-token/voice/file_1.oga",
    );
    // Raw bytes go to the model: no transcoding, no data URL wrapping.
    const audio = transcribeMock.mock.calls[0][0].audio as Uint8Array;
    expect(Array.from(audio)).toEqual(Array.from(oggBytes));
  });

  it("defaults to openai/whisper-1 when AI_TRANSCRIBE_MODEL is unset", async () => {
    stubFetch({
      getFile: okGetFile({ file_path: "voice/file_1.oga" }),
      download: okDownload(),
    });

    await transcribeTelegramVoice("file-id");

    expect(transcriptionModelMock).toHaveBeenCalledWith("openai/whisper-1");
  });

  it("honours AI_TRANSCRIBE_MODEL when it is set", async () => {
    vi.stubEnv("AI_TRANSCRIBE_MODEL", "openai/gpt-4o-mini-transcribe");
    stubFetch({
      getFile: okGetFile({ file_path: "voice/file_1.oga" }),
      download: okDownload(),
    });

    await transcribeTelegramVoice("file-id");

    expect(transcriptionModelMock).toHaveBeenCalledWith(
      "openai/gpt-4o-mini-transcribe",
    );
  });

  it("surfaces Telegram's description when getFile reports ok: false", async () => {
    stubFetch({
      getFile: async () =>
        new Response(
          JSON.stringify({
            ok: false,
            error_code: 400,
            description: "Bad Request: file is temporarily unavailable",
          }),
          { status: 400 },
        ),
    });

    await expect(transcribeTelegramVoice("file-id")).rejects.toThrow(
      "Bad Request: file is temporarily unavailable",
    );
    expect(downloadCalls()).toHaveLength(0);
  });

  it("marks a definite Telegram 4xx as certain", async () => {
    stubFetch({
      getFile: async () =>
        new Response(
          JSON.stringify({ ok: false, description: "Bad Request: file not found" }),
          { status: 400 },
        ),
    });

    const error = await transcribeTelegramVoice("file-id").catch((e) => e);

    expect(error).toBeInstanceOf(VoiceTranscriptionError);
    expect((error as VoiceTranscriptionError).uncertain).toBe(false);
  });

  it("marks a network rejection as uncertain", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    const error = await transcribeTelegramVoice("file-id").catch((e) => e);

    expect(error).toBeInstanceOf(VoiceTranscriptionError);
    expect((error as VoiceTranscriptionError).uncertain).toBe(true);
    expect((error as VoiceTranscriptionError).message).toContain("fetch failed");
  });

  it("rejects a file over the 20 MB limit before downloading it", async () => {
    stubFetch({
      getFile: okGetFile({
        file_path: "voice/huge.oga",
        file_size: TELEGRAM_MAX_DOWNLOAD_BYTES + 1,
      }),
    });

    const error = await transcribeTelegramVoice("file-id").catch((e) => e);

    expect(error).toBeInstanceOf(VoiceTranscriptionError);
    expect((error as VoiceTranscriptionError).message).toContain("download limit");
    expect((error as VoiceTranscriptionError).uncertain).toBe(false);
    expect(downloadCalls()).toHaveLength(0);
    expect(transcribeMock).not.toHaveBeenCalled();
  });

  it("throws when the download responds non-2xx", async () => {
    stubFetch({
      getFile: okGetFile({ file_path: "voice/file_1.oga" }),
      download: async () => new Response("Not Found", { status: 404 }),
    });

    const error = await transcribeTelegramVoice("file-id").catch((e) => e);

    expect(error).toBeInstanceOf(VoiceTranscriptionError);
    expect((error as VoiceTranscriptionError).message).toContain("404");
    expect(transcribeMock).not.toHaveBeenCalled();
  });

  it("throws rather than returning an empty instruction for a silent note", async () => {
    transcribeMock.mockResolvedValue({ text: "   \n  " });
    stubFetch({
      getFile: okGetFile({ file_path: "voice/file_1.oga" }),
      download: okDownload(),
    });

    const error = await transcribeTelegramVoice("file-id").catch((e) => e);

    expect(error).toBeInstanceOf(VoiceTranscriptionError);
    expect((error as VoiceTranscriptionError).message).toContain("empty transcript");
    expect((error as VoiceTranscriptionError).uncertain).toBe(false);
  });

  it("wraps a transcription failure as uncertain so the task can retry", async () => {
    transcribeMock.mockRejectedValue(new Error("gateway 503"));
    stubFetch({
      getFile: okGetFile({ file_path: "voice/file_1.oga" }),
      download: okDownload(),
    });

    const error = await transcribeTelegramVoice("file-id").catch((e) => e);

    expect(error).toBeInstanceOf(VoiceTranscriptionError);
    expect((error as VoiceTranscriptionError).uncertain).toBe(true);
    expect((error as VoiceTranscriptionError).message).toContain("gateway 503");
  });
});
