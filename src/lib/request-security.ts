const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type JsonBodyError = "content_type" | "too_large" | "invalid_length" | "invalid_json";

export type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; error: JsonBodyError };

/** Read JSON with an actual streamed-byte limit; Content-Length is only an early hint. */
export async function readBoundedJson(request: Request, maxBytes: number): Promise<JsonBodyResult> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") return { ok: false, error: "content_type" };

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) return { ok: false, error: "invalid_length" };
    if (Number(contentLength) > maxBytes) return { ok: false, error: "too_large" };
  }

  if (!request.body) return { ok: false, error: "invalid_json" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // The size decision is already final; cancellation is best-effort.
        }
        return { ok: false, error: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, error: "invalid_json" };
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown };
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}

function normaliseOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Origin is a browser-side CSRF signal; it is not identity or client authentication. */
export function hasTrustedBrowserOrigin(request: Request): boolean {
  const originHeader = request.headers.get("origin");
  if (!originHeader) return false;

  const origin = normaliseOrigin(originHeader);
  if (!origin) return false;

  const configuredOrigins = [process.env.SITE_ORIGIN ?? "https://stamer.co.za", process.env.PUBLIC_SITE_ORIGINS]
    .filter(Boolean)
    .flatMap((value) => (value ?? "").split(","))
    .map((value) => normaliseOrigin(value.trim()))
    .filter((value): value is string => value !== null);
  for (const configured of [...configuredOrigins]) {
    const url = new URL(configured);
    if (!url.hostname.startsWith("www.")) {
      url.hostname = `www.${url.hostname}`;
      configuredOrigins.push(url.origin);
    }
  }

  // Vercel provides these from deployment configuration, not from the Host header.
  const deploymentHosts = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL]
    .filter(Boolean)
    .map((host) => normaliseOrigin(`https://${host}`))
    .filter((value): value is string => value !== null);
  configuredOrigins.push(...deploymentHosts);

  if (process.env.NODE_ENV !== "production") {
    configuredOrigins.push("http://localhost:3000", "http://127.0.0.1:3000");
  }

  return configuredOrigins.includes(origin);
}

export function isTurnstileToken(token: unknown): token is string {
  return typeof token === "string" && token.length > 0 && token.length <= 2048;
}

export async function verifyTurnstileToken(
  token: string,
  request: Request,
  expectedAction: "book" | "contact",
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  const expectedHostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );
  if (!secret || expectedHostnames.size === 0) return false;

  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const body = new URLSearchParams({ secret, response: token });
  if (clientIp) body.set("remoteip", clientIp);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body,
    });
    if (!response.ok) return false;

    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || Array.isArray(result)) return false;
    const verification = result as Record<string, unknown>;
    return (
      verification.success === true &&
      verification.action === expectedAction &&
      typeof verification.hostname === "string" &&
      expectedHostnames.has(verification.hostname)
    );
  } catch {
    return false;
  }
}

export function jsonBodyErrorResponse(error: JsonBodyError) {
  if (error === "too_large") return { error: "Request body too large", status: 413 } as const;
  if (error === "content_type") return { error: "Expected application/json", status: 415 } as const;
  return { error: "Invalid request body", status: 400 } as const;
}
