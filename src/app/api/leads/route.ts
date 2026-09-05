import { logAdminEvent } from "@/lib/admin/events";
import {
  EVENT_TYPES as FORM_EVENT_TYPES,
  getEventLabel,
  type EventType,
} from "@/lib/booking/build-message";
import { normalizePhoneE164, toWaMeDigits } from "@/lib/inquiries/phone";
import { createWebsiteLead } from "@/lib/inquiries/supabase";
import { deliverWebsiteLeadAlert } from "@/lib/inquiries/website-leads";
import { isValidPhoneNumber } from "libphonenumber-js";
import { NextResponse } from "next/server";

type BookerRole =
  | "bride"
  | "groom"
  | "partner"
  | "event-planner"
  | "corporate-organiser"
  | "executive-assistant"
  | "host"
  | "family-or-friend"
  | "other"
  | "";
type ContactPreference = "whatsapp" | "email";

interface LeadPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  whatsappSameAsPhone: boolean;
  contactPreference: ContactPreference;
  eventType: EventType;
  eventTypeOther: string;
  date: string;
  dateUnsure: boolean;
  location: string;
  guestCount: number | null;
  performanceMinutes: number;
  bookerRole: BookerRole;
  bookerRoleOther: string;
  message: string;
  notes: string;
  /** Cookieless analytics session, when the tracker is running. */
  sessionId?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EVENT_TYPES: EventType[] = [...FORM_EVENT_TYPES, ""];
const BOOKER_ROLES: BookerRole[] = [
  "bride",
  "groom",
  "partner",
  "event-planner",
  "corporate-organiser",
  "executive-assistant",
  "host",
  "family-or-friend",
  "other",
  "",
];
const CONTACT_PREFERENCES: ContactPreference[] = ["whatsapp", "email"];
const BOOKER_ROLE_LABELS: Record<Exclude<BookerRole, "">, string> = {
  bride: "Bride",
  groom: "Groom",
  partner: "Partner",
  "event-planner": "Event planner",
  "corporate-organiser": "Corporate organiser",
  "executive-assistant": "Executive assistant",
  host: "Host",
  "family-or-friend": "Family or friend",
  other: "Other",
};
const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

/** Shown to the visitor when the enquiry could not be stored. */
export const SAVE_FAILED_MESSAGE =
  "We could not save your enquiry just now. Please try again in a moment, or message Luke directly on WhatsApp.";

function getEventType(payload: LeadPayload) {
  return getEventLabel(payload);
}

function getBookerRole(payload: LeadPayload) {
  if (payload.bookerRole === "other") {
    return payload.bookerRoleOther.trim() || "Other";
  }

  if (!payload.bookerRole) return "Not provided";
  return BOOKER_ROLE_LABELS[payload.bookerRole];
}

function isLeadPayload(payload: unknown): payload is LeadPayload {
  if (!payload || typeof payload !== "object") return false;

  const candidate = payload as Partial<Record<keyof LeadPayload, unknown>>;

  return (
    typeof candidate.firstName === "string" &&
    typeof candidate.lastName === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.phone === "string" &&
    typeof candidate.whatsapp === "string" &&
    typeof candidate.whatsappSameAsPhone === "boolean" &&
    typeof candidate.contactPreference === "string" &&
    CONTACT_PREFERENCES.includes(candidate.contactPreference as ContactPreference) &&
    typeof candidate.eventType === "string" &&
    EVENT_TYPES.includes(candidate.eventType as EventType) &&
    typeof candidate.eventTypeOther === "string" &&
    typeof candidate.date === "string" &&
    typeof candidate.dateUnsure === "boolean" &&
    typeof candidate.location === "string" &&
    (typeof candidate.guestCount === "number" || candidate.guestCount === null) &&
    typeof candidate.performanceMinutes === "number" &&
    typeof candidate.bookerRole === "string" &&
    BOOKER_ROLES.includes(candidate.bookerRole as BookerRole) &&
    typeof candidate.bookerRoleOther === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.notes === "string" &&
    (candidate.sessionId === undefined || typeof candidate.sessionId === "string")
  );
}

function toIsoDate(date: string, dateUnsure: boolean) {
  if (dateUnsure) return null;

  const trimmedDate = date.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    return trimmedDate;
  }

  const match = trimmedDate.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match) return null;

  const [, monthName, day, year] = match;
  const month = MONTHS[monthName.toLowerCase()];
  if (!month) return null;

  return `${year}-${month}-${day.padStart(2, "0")}`;
}

function formatDateLabel(payload: LeadPayload) {
  if (payload.dateUnsure) return "Flexible / TBD";
  const iso = toIsoDate(payload.date, payload.dateUnsure);
  return iso ?? payload.date.trim() ?? "Not specified";
}

function validatePayload(payload: LeadPayload) {
  if (!payload.firstName.trim()) return "Missing first name";
  if (!EMAIL_REGEX.test(payload.email.trim())) return "Invalid email";
  if (!payload.eventType || (payload.eventType === "other" && !payload.eventTypeOther.trim())) {
    return "Missing event type";
  }
  if (!payload.dateUnsure && !toIsoDate(payload.date, payload.dateUnsure)) {
    return "Invalid event date";
  }
  if (!payload.location.trim()) return "Missing location";
  if (payload.phone.trim() && !isValidPhoneNumber(payload.phone.trim())) {
    return "Invalid phone number";
  }
  if (!payload.whatsappSameAsPhone && payload.whatsapp.trim() && !isValidPhoneNumber(payload.whatsapp.trim())) {
    return "Invalid WhatsApp number";
  }
  if (payload.contactPreference === "whatsapp") {
    const preferredNumber = payload.whatsappSameAsPhone
      ? payload.phone.trim()
      : payload.whatsapp.trim();
    if (!preferredNumber) return "Missing WhatsApp number";
  }
  if (!payload.bookerRole) return "Missing role";
  if (payload.bookerRole === "other" && !payload.bookerRoleOther.trim()) {
    return "Missing role description";
  }
  if (!Number.isFinite(payload.performanceMinutes) || payload.performanceMinutes <= 0) {
    return "Invalid performance length";
  }

  return null;
}

function getWhatsappNumber(payload: LeadPayload) {
  return payload.whatsappSameAsPhone
    ? payload.phone.trim()
    : payload.whatsapp.trim();
}

export async function POST(req: Request) {
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!isLeadPayload(payload)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const whatsappNumber = getWhatsappNumber(payload);
  // Normalise rather than strip non-digits: "082 123 4567" is a real number
  // that a naive strip turns into wa.me/0821234567, a link that opens a chat
  // with nobody. A number we cannot make canonical stays null: the lead is
  // still stored, the alert simply renders without availability buttons.
  const phoneE164 = normalizePhoneE164(whatsappNumber);
  const whatsappDigits = toWaMeDigits(whatsappNumber);

  const lead = {
    source: "lead_form" as const,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim() || null,
    email: payload.email.trim(),
    phone: payload.phone.trim() || null,
    whatsapp: whatsappNumber || null,
    whatsappDigits,
    phoneE164,
    contactPreference: payload.contactPreference,
    eventType: getEventType(payload),
    eventDateText: formatDateLabel(payload),
    eventDateIso: toIsoDate(payload.date, payload.dateUnsure),
    dateFlexible: payload.dateUnsure,
    location: payload.location.trim() || null,
    guestCount: payload.guestCount,
    performanceMinutes: payload.performanceMinutes,
    bookerRole: getBookerRole(payload),
    message: payload.message.trim() || null,
    notes: payload.notes.trim() || null,
    payload: payload as unknown as Record<string, unknown>,
    sessionId: payload.sessionId?.trim() || null,
  };

  // Supabase is the system of record. Without a row there is no enquiry, so
  // this is the one step that fails the request.
  let leadId: string;
  try {
    ({ leadId } = await createWebsiteLead(lead));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Website lead persistence failed:", error);
    await logAdminEvent({
      level: "error",
      source: "supabase",
      kind: "lead_persist_failed",
      message: `Booking form submission could not be stored: ${message}`,
      context: {
        source: "lead_form",
        email: lead.email,
        eventType: lead.eventType,
        eventDateText: lead.eventDateText,
      },
    });
    return NextResponse.json({ error: SAVE_FAILED_MESSAGE }, { status: 500 });
  }

  // Telegram is best-effort: the outcome is recorded on the row and in
  // admin_events, and the retry sweep picks up anything that failed.
  await deliverWebsiteLeadAlert({
    id: leadId,
    source: lead.source,
    first_name: lead.firstName,
    last_name: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    whatsapp: lead.whatsapp,
    whatsapp_digits: lead.whatsappDigits,
    contact_preference: lead.contactPreference,
    event_type: lead.eventType,
    event_date_text: lead.eventDateText,
    location: lead.location,
    guest_count: lead.guestCount,
    performance_minutes: lead.performanceMinutes,
    booker_role: lead.bookerRole,
    message: lead.message,
  });

  return NextResponse.json({ success: true, leadId });
}
