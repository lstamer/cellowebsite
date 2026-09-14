import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { runInternalChecks } from "@/lib/admin/health";

/**
 * Internal health endpoint for the scheduled probe. Requires the shared
 * secret so the integration checks (which call third-party APIs) cannot be
 * triggered by the public. Without a secret configured it only reports that.
 */

function authorised(request: Request): boolean {
  const secret = process.env.HEALTH_PROBE_SECRET?.trim();
  if (!secret) return false;
  const provided = request.headers.get("x-health-secret") ?? new URL(request.url).searchParams.get("secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request): Promise<Response> {
  if (!authorised(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorised" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const checks = await runInternalChecks();
  const ok = checks.every((check) => check.ok);
  return NextResponse.json(
    { ok, checkedAt: new Date().toISOString(), checks },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
