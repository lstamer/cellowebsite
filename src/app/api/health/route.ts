import { NextResponse, type NextRequest } from "next/server";

import { runInternalHealthChecks } from "@/lib/admin/health";
import { constantTimeEqual } from "@/lib/inquiries/security";

/**
 * Internal health endpoint for the scheduled probe. Gated by a shared secret
 * header because it reveals which integrations are configured and reachable.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.HEALTH_PROBE_SECRET?.trim();
  const provided = request.headers.get("x-health-secret") ?? "";

  if (!secret || !constantTimeEqual(provided, secret)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const checks = await runInternalHealthChecks();
  const ok = checks.every((check) => check.ok);

  return NextResponse.json(
    { ok, checks, at: new Date().toISOString() },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
