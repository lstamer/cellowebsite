import { z } from "zod";

import { requireEnv } from "@/lib/inquiries/env";

const zernioSendResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    messageId: z.union([z.string(), z.number()]),
    conversationId: z.string(),
    sentAt: z.string(),
    message: z.string(),
  }),
});

export class ZernioSendError extends Error {
  constructor(
    message: string,
    public readonly uncertain: boolean,
  ) {
    super(message);
    this.name = "ZernioSendError";
  }
}

export async function sendZernioTextMessage(input: {
  conversationId: string;
  accountId: string;
  message: string;
}): Promise<{ messageId: string }> {
  let response: Response;

  try {
    response = await fetch(
      `https://zernio.com/api/v1/inbox/conversations/${encodeURIComponent(input.conversationId)}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${requireEnv("ZERNIO_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: input.accountId,
          message: input.message,
        }),
      },
    );
  } catch (error) {
    throw new ZernioSendError(
      `Zernio network error: ${error instanceof Error ? error.message : "unknown error"}`,
      true,
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new ZernioSendError(
      `Zernio send failed (${response.status}): ${body.slice(0, 500)}`,
      false,
    );
  }

  const parsed = zernioSendResponseSchema.parse(await response.json());
  return { messageId: String(parsed.data.messageId) };
}

const zernioMediaSendResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    messageId: z.union([z.string(), z.number()]).optional(),
  }),
});

// Maps our curated-library media types onto Zernio's attachmentType enum
// (POST /v1/inbox/conversations/{id}/messages — attachmentUrl must be a
// publicly accessible URL; "document" is Zernio's "file").
const ZERNIO_ATTACHMENT_TYPES = {
  image: "image",
  video: "video",
  audio: "audio",
  document: "file",
} as const;

export async function sendZernioMediaMessage(input: {
  conversationId: string;
  accountId: string;
  mediaType: keyof typeof ZERNIO_ATTACHMENT_TYPES;
  url: string;
  fileName?: string;
}): Promise<{ messageId: string | null }> {
  let response: Response;

  try {
    response = await fetch(
      `https://zernio.com/api/v1/inbox/conversations/${encodeURIComponent(input.conversationId)}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${requireEnv("ZERNIO_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: input.accountId,
          attachmentUrl: input.url,
          attachmentType: ZERNIO_ATTACHMENT_TYPES[input.mediaType],
          ...(input.mediaType === "document" && input.fileName
            ? { attachmentName: input.fileName }
            : {}),
        }),
      },
    );
  } catch (error) {
    throw new ZernioSendError(
      `Zernio media network error: ${error instanceof Error ? error.message : "unknown error"}`,
      true,
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new ZernioSendError(
      `Zernio media send failed (${response.status}): ${body.slice(0, 500)}`,
      false,
    );
  }

  const parsed = zernioMediaSendResponseSchema.parse(await response.json());
  return {
    messageId:
      parsed.data.messageId === undefined ? null : String(parsed.data.messageId),
  };
}
