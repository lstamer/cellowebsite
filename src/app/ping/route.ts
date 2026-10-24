import { NextResponse } from "next/server";

/** Public liveness probe. Keep this response independent of private integrations. */
export function GET() {
  return new NextResponse(null, { status: 200, headers: { "Cache-Control": "no-store" } });
}
