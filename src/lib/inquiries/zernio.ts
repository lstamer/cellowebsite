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
