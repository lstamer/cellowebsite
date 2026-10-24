import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/inquiries/supabase";
import { getSupabaseSecret } from "@/lib/inquiries/env";

export type RateLimitFamily = "public_form" | "telemetry" | "admin_login";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  limit: number;
  remaining: number;
}

const rpcResultSchema = z.object({
  allowed: z.boolean(),
  retry_after_seconds: z.number().int().positive(),
  rate_limit: z.number().int().positive(),
  remaining: z.number().int().nonnegative(),
});

/** Only Vercel's platform-provided client IP is used; forwarded chains are rejected. */
export function getSanitizedClientIp(request: Request): string | null {
  const value = request.headers.get("x-vercel-forwarded-for")?.trim();
  if (!value || value.length > 45 || value.includes(",") || isIP(value) === 0) return null;
  return value;
}

function hashClientIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHmac("sha256", getSupabaseSecret()).update(ip).digest("hex");
}

/** Consume the database-atomic IP and shared-family buckets. Throws on RPC failure. */
export async function consumeRateLimit(
  family: RateLimitFamily,
  request: Request,
): Promise<RateLimitResult> {
  const ipHash = hashClientIp(getSanitizedClientIp(request));
  const { data, error } = await getSupabaseAdmin().rpc("consume_public_request_limit", {
    p_family: family,
    p_ip_hash: ipHash,
  });
  if (error) throw new Error(`Request rate limit failed: ${error.message}`);

  const result = rpcResultSchema.safeParse(Array.isArray(data) ? data[0] : data);
  if (!result.success) throw new Error("Request rate limit returned an invalid result");

  return {
    allowed: result.data.allowed,
    retryAfterSeconds: result.data.retry_after_seconds,
    limit: result.data.rate_limit,
    remaining: result.data.remaining,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "Retry-After": String(result.retryAfterSeconds),
  };
}
