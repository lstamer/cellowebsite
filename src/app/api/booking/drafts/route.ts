import { BOOKING_DRAFT_DEADLINE_MS } from "@/lib/booking/contact-drafts";
import { generateBookingDrafts } from "@/lib/booking/openai-drafts";
import { completedBookingSnapshotSchema } from "@/lib/booking/progress";
import { consumeRateLimit, rateLimitHeaders } from "@/lib/request-rate-limit";
import { hasTrustedBrowserOrigin, jsonBodyErrorResponse, readBoundedJson } from "@/lib/request-security";

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(BOOKING_DRAFT_DEADLINE_MS)]);
  if (!hasTrustedBrowserOrigin(request)) return new Response(null, { status: 403 });

  const body = await readBoundedJson(request, MAX_BODY_BYTES);
  if (!body.ok) {
    return new Response(null, { status: jsonBodyErrorResponse(body.error).status });
  }
  const snapshot = completedBookingSnapshotSchema.safeParse(body.value);
  if (!snapshot.success) return new Response(null, { status: 400 });

  const apiKey = process.env.OPENAI_BOOKING_API_KEY?.trim();
  if (!apiKey) return new Response(null, { status: 204 });

  try {
    const limit = await consumeRateLimit("public_form", request);
    if (!limit.allowed) return new Response(null, { status: 429, headers: rateLimitHeaders(limit) });
    if (signal.aborted) return new Response(null, { status: 204 });

    const start = performance.now();
    const drafts = await generateBookingDrafts(snapshot.data, apiKey, signal);
    const headers = {
      "Cache-Control": "no-store",
      "Server-Timing": `openai;dur=${Math.round(performance.now() - start)}`,
    };
    if (signal.aborted || !drafts) return new Response(null, { status: 204, headers });
    return Response.json(drafts, { headers });
  } catch {
    // Provider errors, incomplete output, timeouts, and rate-store outages
    // all leave the already prepared local draft available.
    return new Response(null, { status: 204 });
  }
}
