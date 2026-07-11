import { createHmac, timingSafeEqual } from "node:crypto";

export function constantTimeEqual(
  supplied: string | null,
  expected: string,
): boolean {
  if (!supplied) return false;

  const suppliedBuffer = Buffer.from(supplied, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
}

export function verifyHmacSignature(
  rawBody: string,
  suppliedSignature: string | null,
  secret: string,
): boolean {
  if (!suppliedSignature || !/^[a-f0-9]{64}$/.test(suppliedSignature)) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return constantTimeEqual(suppliedSignature, expected);
}

export type TelegramDecision = {
  approvalId: string;
  decision: "approve" | "reject";
};

export function parseTelegramDecision(data: string): TelegramDecision | null {
  const match = data.match(
    /^inq:(a|r):([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i,
  );

  if (!match) return null;

  return {
    approvalId: match[2].toLowerCase(),
    decision: match[1] === "a" ? "approve" : "reject",
  };
}
