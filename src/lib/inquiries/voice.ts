import { gateway } from "@ai-sdk/gateway";
import { transcribe } from "ai";
import { z } from "zod";

import { requireEnv } from "@/lib/inquiries/env";

/**
 * The Bot API refuses to serve files larger than 20 MB through
 * `api.telegram.org/file/...`, so anything bigger is rejected up front rather
 * than being discovered as a mid-download failure.
 */
export const TELEGRAM_MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;

// Flat $0.006/min, no per-token surprises, and the cheapest way to turn a
// 30-second voicenote into redraft instructions. Overridable the same way
// AI_MODEL is, with the optional-env fallback style of getSupabaseSecret.
const DEFAULT_TRANSCRIBE_MODEL = "openai/whisper-1";

function transcriptionModelId(): string {
  return process.env.AI_TRANSCRIBE_MODEL?.trim() || DEFAULT_TRANSCRIBE_MODEL;
}

const getFileSuccessSchema = z.object({
  ok: z.literal(true),
  result: z.object({
    file_path: z.string().min(1),
    file_size: z.number().int().nonnegative().optional(),
  }),
});

const getFileFailureSchema = z.object({
  ok: z.literal(false),
  description: z.string().optional(),
});

/**
 * Mirrors TelegramApiError: `uncertain` marks failures where the outcome is
 * unknown (network errors, unreadable bodies) and a Trigger.dev retry is worth
 * spending. Definite failures — a rejected file_id, an oversized note, an
 * empty transcript — will fail identically on every retry.
 */
export class VoiceTranscriptionError extends Error {
  constructor(
    message: string,
    public readonly uncertain: boolean,
  ) {
    super(message);
    this.name = "VoiceTranscriptionError";
  }
}

async function resolveVoiceFile(
  fileId: string,
): Promise<{ filePath: string; fileSize?: number }> {
  let response: Response;
  try {
    response = await fetch(
      `https://api.telegram.org/bot${requireEnv("TELEGRAM_BOT_TOKEN")}/getFile?file_id=${encodeURIComponent(fileId)}`,
    );
  } catch (error) {
    throw new VoiceTranscriptionError(
      `Telegram getFile network error: ${error instanceof Error ? error.message : "unknown error"}`,
      true,
    );
  }

  const raw = await response.text();

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new VoiceTranscriptionError(
      `Telegram getFile returned a non-JSON body (${response.status}): ${raw.slice(0, 500)}`,
      true,
    );
  }

  const failure = getFileFailureSchema.safeParse(body);
  if (failure.success) {
    throw new VoiceTranscriptionError(
      `Telegram getFile failed (${response.status}): ${failure.data.description ?? "no description"}`,
      false,
    );
  }

  const success = getFileSuccessSchema.safeParse(body);
  if (!success.success) {
    throw new VoiceTranscriptionError(
      `Telegram getFile returned an unexpected body (${response.status}): ${raw.slice(0, 500)}`,
      true,
    );
  }

  return {
    filePath: success.data.result.file_path,
    fileSize: success.data.result.file_size,
  };
}

async function downloadVoiceFile(filePath: string): Promise<Uint8Array> {
  let response: Response;
  try {
    // The download link is only guaranteed valid for about an hour after
    // getFile, so it is fetched immediately rather than stored.
    response = await fetch(
      `https://api.telegram.org/file/bot${requireEnv("TELEGRAM_BOT_TOKEN")}/${filePath}`,
    );
  } catch (error) {
    throw new VoiceTranscriptionError(
      `Telegram file download network error: ${error instanceof Error ? error.message : "unknown error"}`,
      true,
    );
  }

  if (!response.ok) {
    throw new VoiceTranscriptionError(
      `Telegram file download failed (${response.status}): ${filePath}`,
      false,
    );
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    throw new VoiceTranscriptionError(
      `Telegram file download could not be read: ${error instanceof Error ? error.message : "unknown error"}`,
      true,
    );
  }

  // getFile may omit file_size, so the real byte count is checked too.
  if (bytes.byteLength > TELEGRAM_MAX_DOWNLOAD_BYTES) {
    throw new VoiceTranscriptionError(
      `Voice note is ${bytes.byteLength} bytes, over Telegram's ${TELEGRAM_MAX_DOWNLOAD_BYTES}-byte download limit`,
      false,
    );
  }

  return bytes;
}

/**
 * Fetch a Telegram voice note by file_id and return its transcript.
 *
 * Telegram voice notes are OGG/Opus. The raw bytes go straight to the model:
 * the AI SDK sniffs the `OggS` magic bytes and labels the payload audio/ogg,
 * so there is no transcoding step and no ffmpeg dependency.
 *
 * The `voice.mime_type` and `voice.duration` fields on the update are supplied
 * by the sending client, not verified by Telegram, so neither is trusted here
 * for format or length decisions — byte sniffing and the real byte count are.
 *
 * @throws {VoiceTranscriptionError} `uncertain` is true only when the outcome
 * is genuinely unknown, so callers inside a retrying task can decide whether
 * another attempt is worth it.
 */
export async function transcribeTelegramVoice(fileId: string): Promise<string> {
  requireEnv("AI_GATEWAY_API_KEY");

  const { filePath, fileSize } = await resolveVoiceFile(fileId);

  if (fileSize !== undefined && fileSize > TELEGRAM_MAX_DOWNLOAD_BYTES) {
    throw new VoiceTranscriptionError(
      `Voice note is ${fileSize} bytes, over Telegram's ${TELEGRAM_MAX_DOWNLOAD_BYTES}-byte download limit`,
      false,
    );
  }

  const audio = await downloadVoiceFile(filePath);
  const modelId = transcriptionModelId();

  let result: Awaited<ReturnType<typeof transcribe>>;
  try {
    result = await transcribe({
      model: gateway.transcriptionModel(modelId),
      audio,
    });
  } catch (error) {
    // The SDK has already exhausted its own retries by this point; the cause
    // (rate limit, gateway blip, bad audio) is not distinguishable here.
    throw new VoiceTranscriptionError(
      `Transcription failed (${modelId}): ${error instanceof Error ? error.message : "unknown error"}`,
      true,
    );
  }

  const text = result.text.trim();

  if (!text) {
    // An empty transcript must never become an empty redraft instruction: a
    // silent note has to surface as a failure Luke can see and re-record.
    throw new VoiceTranscriptionError(
      `Transcription returned an empty transcript (${modelId})`,
      false,
    );
  }

  return text;
}
