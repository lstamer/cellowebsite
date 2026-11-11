import { bookingProgressSchema } from "@/lib/booking/progress";
import { normalizePhoneE164 } from "@/lib/inquiries/phone";
import { getSupabaseAdmin } from "@/lib/inquiries/supabase";
import { consumeRateLimit, rateLimitHeaders } from "@/lib/request-rate-limit";
import {
  hasTrustedBrowserOrigin,
  jsonBodyErrorResponse,
  readBoundedJson,
} from "@/lib/request-security";

const PROGRESS_BODY_MAX_BYTES = 32 * 1024;

export async function POST(request: Request) {
  if (!hasTrustedBrowserOrigin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await readBoundedJson(request, PROGRESS_BODY_MAX_BYTES);
  if (!body.ok) {
    const { error, status } = jsonBodyErrorResponse(body.error);
    return Response.json({ error }, { status });
  }

  const parsed = bookingProgressSchema.safeParse(body.value);
  if (!parsed.success) {
    return Response.json({ error: "Invalid booking progress" }, { status: 400 });
  }

  try {
    const rateLimit = await consumeRateLimit("telemetry", request);
    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Too many booking updates" },
        { status: 429, headers: rateLimitHeaders(rateLimit) },
      );
    }

    const { attemptId, revision, step, snapshot, sessionId, event } = parsed.data;
    const phoneE164 = normalizePhoneE164(snapshot.phone);
    const { error } = await getSupabaseAdmin().rpc("record_booking_progress", {
      p_attempt_id: attemptId,
      p_revision: revision,
      p_step: step,
      p_snapshot: snapshot,
      p_session_id: sessionId,
      p_phone_e164: phoneE164,
      p_whatsapp_e164: snapshot.whatsappSameAsPhone ? phoneE164 : normalizePhoneE164(snapshot.whatsapp),
      p_event: event ?? null,
    });
    if (error) {
      // PostgREST errors can contain submitted data, so log only the code.
      console.error("Booking progress RPC failed", { code: error.code });
      return Response.json({ error: "Could not save booking progress" }, { status: 503 });
    }
  } catch {
    console.error("Booking progress storage unavailable");
    return Response.json({ error: "Could not save booking progress" }, { status: 503 });
  }

  return new Response(null, { status: 204 });
}
