import { after, NextRequest, NextResponse } from "next/server";

import { describeError, logAdminEvent } from "@/lib/admin/events";
import { deliverLeadAlert } from "@/lib/inquiries/lead-alert";
import { normalizePhoneE164, toWaMeDigits } from "@/lib/inquiries/phone";
import { createWebsiteLead } from "@/lib/inquiries/supabase";

interface ContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  inquiryType: string;
  message: string;
  phone?: string;
  sessionId?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SESSION_ID_REGEX = /^[A-Za-z0-9_-]{8,64}$/;

const INQUIRY_LABELS: Record<string, string> = {
  wedding: "Wedding",
  "private-event": "Private event",
  "corporate-event": "Corporate event",
  fundraiser: "Fundraiser or tribute",
  other: "Other event",
};

function getInquiryLabel(inquiryType: string) {
  return INQUIRY_LABELS[inquiryType] ?? (inquiryType || "General inquiry");
}

function isContactPayload(payload: unknown): payload is ContactPayload {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<Record<keyof ContactPayload, unknown>>;

  return (
    typeof candidate.firstName === "string" &&
    (candidate.lastName === undefined || typeof candidate.lastName === "string") &&
    typeof candidate.email === "string" &&
    (candidate.inquiryType === undefined || typeof candidate.inquiryType === "string") &&
    typeof candidate.message === "string" &&
    (candidate.phone === undefined || typeof candidate.phone === "string") &&
    (candidate.sessionId === undefined || typeof candidate.sessionId === "string")
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!isContactPayload(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const firstName = body.firstName.trim();
  const lastName = (body.lastName ?? "").trim();
  const email = body.email.trim();
  const inquiryType = (body.inquiryType ?? "").trim();
  const message = body.message.trim();
  const phone = (body.phone ?? "").trim();

  if (!firstName || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // The phone field stays optional, but a number that cannot be resolved to
  // E.164 is rejected rather than stored half-formatted: it would silently cost
  // this lead its WhatsApp reply link and its identity link to any later
  // WhatsApp message from the same person. /api/leads guards the same way.
  if (phone && !normalizePhoneE164(phone)) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  const phoneE164 = normalizePhoneE164(phone);
  const whatsappDigits = toWaMeDigits(phone);
  const sessionId =
    body.sessionId && SESSION_ID_REGEX.test(body.sessionId) ? body.sessionId : null;

  let leadId: string;
  try {
    // Email-only enquiries are stored too: the person is linked by email
    // (2026090502) and the alert simply renders without WhatsApp buttons.
    const created = await createWebsiteLead({
      source: "contact_form",
      firstName,
      lastName: lastName || null,
      email,
      phone: phone || null,
      whatsapp: null,
      whatsappDigits,
      phoneE164,
      contactPreference: null,
      eventType: getInquiryLabel(inquiryType),
      eventDateText: null,
      eventDateIso: null,
      dateFlexible: null,
      location: null,
      guestCount: null,
      performanceMinutes: null,
      bookerRole: null,
      message: message || null,
      notes: null,
      payload: { firstName, lastName, email, inquiryType, message, phone },
      sessionId,
    });
    leadId = created.leadId;
  } catch (error) {
    const errorMessage = describeError(error);
    console.error("Contact form persistence failed:", errorMessage);
    await logAdminEvent({
      level: "error",
      source: "supabase",
      kind: "lead_persist_failed",
      message: `A contact form submission could not be stored: ${errorMessage}`,
      context: { source: "contact_form", email, inquiryType },
    });
    return NextResponse.json(
      { error: "Could not save your message. Please try again or message on WhatsApp." },
      { status: 500 },
    );
  }

  after(async () => {
    await deliverLeadAlert({ leadId, triggeredBy: "request" });
  });

  return NextResponse.json({ success: true, leadId });
}
