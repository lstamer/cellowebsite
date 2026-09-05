import { logAdminEvent } from "@/lib/admin/events";
import { normalizePhoneE164, toWaMeDigits } from "@/lib/inquiries/phone";
import { createWebsiteLead } from "@/lib/inquiries/supabase";
import { deliverWebsiteLeadAlert } from "@/lib/inquiries/website-leads";
import { NextRequest, NextResponse } from "next/server";

interface ContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  inquiryType: string;
  message: string;
  phone?: string;
  sessionId?: string;
}

const INQUIRY_LABELS: Record<string, string> = {
  wedding: "Wedding",
  "private-event": "Private event",
  "corporate-event": "Corporate event",
  fundraiser: "Fundraiser or tribute",
  other: "Other event",
};

export const SAVE_FAILED_MESSAGE =
  "We could not save your message just now. Please try again in a moment, or message Luke directly on WhatsApp.";

function getInquiryLabel(inquiryType: string) {
  return INQUIRY_LABELS[inquiryType] ?? (inquiryType || "General inquiry");
}

export async function POST(req: NextRequest) {
  let body: Partial<ContactPayload>;
  try {
    body = (await req.json()) as Partial<ContactPayload>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const inquiryType = typeof body.inquiryType === "string" ? body.inquiryType : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";

  if (!firstName || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
  const eventType = getInquiryLabel(inquiryType);

  let leadId: string;
  try {
    ({ leadId } = await createWebsiteLead({
      source: "contact_form",
      firstName,
      lastName: lastName || null,
      email,
      phone: phone || null,
      whatsapp: null,
      whatsappDigits,
      phoneE164,
      contactPreference: null,
      eventType,
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
      sessionId: sessionId || null,
    }));
  } catch (error) {
    const description = error instanceof Error ? error.message : "Unknown error";
    console.error("Contact form persistence failed:", error);
    await logAdminEvent({
      level: "error",
      source: "supabase",
      kind: "lead_persist_failed",
      message: `Contact form submission could not be stored: ${description}`,
      context: { source: "contact_form", email, eventType },
    });
    return NextResponse.json({ error: SAVE_FAILED_MESSAGE }, { status: 500 });
  }

  await deliverWebsiteLeadAlert({
    id: leadId,
    source: "contact_form",
    first_name: firstName,
    last_name: lastName || null,
    email,
    phone: phone || null,
    whatsapp: null,
    whatsapp_digits: whatsappDigits,
    contact_preference: null,
    event_type: eventType,
    event_date_text: null,
    location: null,
    guest_count: null,
    performance_minutes: null,
    booker_role: null,
    message: message || null,
  });

  return NextResponse.json({ success: true, leadId });
}
