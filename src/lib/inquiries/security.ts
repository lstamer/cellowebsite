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
  if (!suppliedSignature) return false;

  // Providers vary in header format; tolerate a sha256= prefix and uppercase
  // hex so a formatting difference cannot silently reject every webhook.
  const normalised = suppliedSignature
    .trim()
    .replace(/^sha256=/i, "")
    .toLowerCase();

  if (!/^[a-f0-9]{64}$/.test(normalised)) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return constantTimeEqual(normalised, expected);
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Every actionable Telegram button encodes "<verb prefix>:<uuid>". The parser
// is strict: an unknown prefix or malformed uuid yields null and the webhook
// answers the callback without acting.
export type TelegramCallbackAction =
  | { kind: "approval"; decision: "approve" | "dismiss"; approvalId: string }
  | {
      kind: "availability";
      availability: "available" | "unavailable";
      checkId: string;
    }
  | {
      kind: "lead_availability";
      availability: "available" | "unavailable";
      leadId: string;
    }
  | { kind: "lead_review"; decision: "approve" | "dismiss"; leadId: string }
  | { kind: "override_confirm"; decision: "send" | "cancel"; confirmId: string }
  // Suggest changes needs one verb per draft path because the single uuid a
  // 64-byte callback can carry points at a different table on each side.
  | { kind: "suggest_changes"; target: "approval"; approvalId: string }
  | { kind: "suggest_changes"; target: "website_lead"; leadId: string }
  | { kind: "suggest_changes_cancel"; requestId: string };

export function parseTelegramCallback(
  data: string,
): TelegramCallbackAction | null {
  const separator = data.lastIndexOf(":");
  if (separator === -1) return null;

  const rawId = data.slice(separator + 1);
  if (!UUID_PATTERN.test(rawId)) return null;

  const prefix = data.slice(0, separator);
  const id = rawId.toLowerCase();

  switch (prefix) {
    case "inq:a":
      return { kind: "approval", decision: "approve", approvalId: id };
    // "inq:r" is the legacy Reject verb still live on cards sent before the
    // Dismiss rename; both mean "send nothing".
    case "inq:r":
    case "inq:d":
      return { kind: "approval", decision: "dismiss", approvalId: id };
    case "inq:sc":
      return { kind: "suggest_changes", target: "approval", approvalId: id };
    case "inq:v:a":
      return { kind: "availability", availability: "available", checkId: id };
    case "inq:v:u":
      return { kind: "availability", availability: "unavailable", checkId: id };
    case "wl:a":
      return {
        kind: "lead_availability",
        availability: "available",
        leadId: id,
      };
    case "wl:u":
      return {
        kind: "lead_availability",
        availability: "unavailable",
        leadId: id,
      };
    case "wl:s":
      return { kind: "lead_review", decision: "approve", leadId: id };
    case "wl:d":
      return { kind: "lead_review", decision: "dismiss", leadId: id };
    case "wl:sc":
      return { kind: "suggest_changes", target: "website_lead", leadId: id };
    case "ovr:s":
      return { kind: "override_confirm", decision: "send", confirmId: id };
    case "ovr:c":
      return { kind: "override_confirm", decision: "cancel", confirmId: id };
    case "sug:x":
      return { kind: "suggest_changes_cancel", requestId: id };
    default:
      return null;
  }
}
