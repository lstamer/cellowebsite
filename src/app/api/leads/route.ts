import {
  createAttioNote,
  patchAttioPersonOptional,
  upsertAttioPerson,
} from "@/lib/attio";
import {
  completeWebsiteLeadAlert,
  createWebsiteLead,
} from "@/lib/inquiries/supabase";
import { normalizePhoneE164, toWaMeDigits } from "@/lib/inquiries/phone";
import { sendTelegramLeadAlert } from "@/lib/inquiries/telegram";
import {
  EVENT_TYPES as FORM_EVENT_TYPES,
  getEventLabel,
  type EventType,
} from "@/lib/booking/build-message";
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
    typeof candidate.notes === "string"
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

function formatGuestCount(count: number | null) {
  if (count === null) return "Not specified";
  if (count >= 200) return "200+";
  return String(count);
}

function formatWhatsapp(payload: LeadPayload) {
  if (payload.whatsappSameAsPhone) {
    return payload.phone.trim() ? `${payload.phone.trim()} (same as phone)` : "Same as phone";
  }
  return payload.whatsapp.trim() || "Not provided";
}

function validatePayload(payload: LeadPayload) {
  if (!payload.firstName.trim()) return "Missing first name";
  if (!EMAIL_REGEX.test(payload.email.trim())) return "Invalid email";
  if (!payload.eventType) return "Missing event type";
  if (payload.eventType === "other" && !payload.eventTypeOther.trim()) {
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

function buildNoteMarkdown(payload: LeadPayload) {
  const fullName = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();
  const lines = [
    `## Website inquiry`,
    ``,
    `**Submitted:** ${new Date().toISOString()}`,
    ``,
    `### Contact`,
    ``,
    `- **Name:** ${fullName || "Not provided"}`,
    `- **Email:** ${payload.email.trim()}`,
    `- **Phone:** ${payload.phone.trim() || "Not provided"}`,
    `- **WhatsApp:** ${formatWhatsapp(payload)}`,
    `- **Preferred contact:** ${payload.contactPreference === "email" ? "Email" : "WhatsApp"}`,
    `- **Role:** ${getBookerRole(payload)}`,
    ``,
    `### Event details`,
    ``,
    `- **Type:** ${getEventType(payload)}`,
    `- **Date:** ${formatDateLabel(payload)}`,
    `- **Location:** ${payload.location.trim() || "Not provided"}`,
    `- **Guest count:** ${formatGuestCount(payload.guestCount)}`,
    `- **Performance length:** ${payload.performanceMinutes} minutes`,
    ``,
    `### Message`,
    ``,
    payload.message.trim() || "_Not provided_",
  ];

  return lines.join("\n");
}

function buildInquiryDetailsText(payload: LeadPayload) {
  const fullName = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();
  const lines = [
    `Website inquiry — ${getEventType(payload)}`,
    `Submitted: ${new Date().toISOString()}`,
    ``,
    `Name: ${fullName || "Not provided"}`,
    `Email: ${payload.email.trim()}`,
    `Phone: ${payload.phone.trim() || "Not provided"}`,
    `WhatsApp: ${formatWhatsapp(payload)}`,
    `Preferred contact: ${payload.contactPreference === "email" ? "Email" : "WhatsApp"}`,
    `Role: ${getBookerRole(payload)}`,
    ``,
    `Event type: ${getEventType(payload)}`,
    `Date: ${formatDateLabel(payload)}`,
    `Location: ${payload.location.trim() || "Not provided"}`,
    `Guest count: ${formatGuestCount(payload.guestCount)}`,
    `Performance length: ${payload.performanceMinutes} minutes`,
    ``,
    `Message:`,
    payload.message.trim() || "Not provided",
  ];

  return lines.join("\n");
}

function buildAttioPersonValues(payload: LeadPayload): Record<string, unknown> {
  const firstName = payload.firstName.trim();
  const lastName = payload.lastName.trim();
  const fullName = `${firstName} ${lastName}`.trim();

  const values: Record<string, unknown> = {
    description: `Website inquiry — ${getEventType(payload)}`,
    pipeline_stage: "inquired",
    from_website: "true",
  };

  if (firstName || lastName) {
    values.name = [
      {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName || firstName || lastName,
      },
    ];
  }

  const phoneNumbers: string[] = [];
  if (payload.phone.trim()) phoneNumbers.push(payload.phone.trim());
  if (!payload.whatsappSameAsPhone && payload.whatsapp.trim()) {
    phoneNumbers.push(payload.whatsapp.trim());
  }
  if (phoneNumbers.length > 0) {
    values.phone_numbers = phoneNumbers;
  }

  if (payload.location.trim()) {
    values.primary_location = payload.location.trim();
  }

  return values;
}

function getWhatsappNumber(payload: LeadPayload) {
  return payload.whatsappSameAsPhone
    ? payload.phone.trim()
    : payload.whatsapp.trim();
}

// Best-effort persistence into Supabase so the Telegram alert can carry
// Available / Unavailable buttons. A failure only costs the buttons: the form
// response, Attio, and the plain alert are unaffected.
async function persistWebsiteLead(payload: LeadPayload): Promise<string | undefined> {
  const whatsappNumber = getWhatsappNumber(payload);
  // Normalise rather than strip non-digits: "082 123 4567" is a real number
  // that a naive strip turns into wa.me/0821234567, a link that opens a chat
  // with nobody. A number we cannot make canonical stays null, which keeps the
  // existing contract that the alert then renders without availability buttons.
  const phoneE164 = normalizePhoneE164(whatsappNumber);
  const whatsappDigits = toWaMeDigits(whatsappNumber);

  if (!whatsappDigits) return undefined;

  try {
    const { leadId } = await createWebsiteLead({
      source: "lead_form",
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
    });

    return leadId;
  } catch (error) {
    console.error("Website lead persistence failed:", error);
    return undefined;
  }
}

async function sendTelegramNotification(payload: LeadPayload, leadId?: string) {
  const fullName =
    `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim() || "Unknown";

  const whatsappNumber = getWhatsappNumber(payload);

  const lines = [
    "🎻 New inquiry from stamer.co.za",
    "",
    `👤 Name: ${fullName}`,
    `👋 Role: ${getBookerRole(payload)}`,
    `🎉 Event: ${getEventType(payload)}`,
    `📅 Date: ${formatDateLabel(payload)}`,
    `📍 Location: ${payload.location.trim() || "Not provided"}`,
    `✉️ Email: ${payload.email.trim()}`,
  ];

  if (payload.phone.trim()) {
    lines.push(`📞 Phone: ${payload.phone.trim()}`);
  }
  if (whatsappNumber) {
    lines.push(`💬 WhatsApp: ${whatsappNumber}`);
  }
  lines.push(
    `📨 Preferred contact: ${payload.contactPreference === "email" ? "Email" : "WhatsApp"}`,
  );
  if (payload.guestCount !== null) {
    lines.push(`👥 Guests: ${formatGuestCount(payload.guestCount)}`);
  }
  lines.push(`⏱ Performance: ${payload.performanceMinutes} min`);
  if (payload.message.trim()) {
    lines.push("", `💬 Message: ${payload.message.trim()}`);
  }

  const replyDigits = toWaMeDigits(whatsappNumber);

  const alert = await sendTelegramLeadAlert({
    text: lines.join("\n"),
    replyUrl: replyDigits ? `https://wa.me/${replyDigits}` : undefined,
    replyLabel: `Message ${payload.firstName.trim() || "them"} on WhatsApp`,
    availabilityLeadId: leadId,
  });

  // Remember which Telegram card belongs to this lead so button taps and
  // edits can find it later. Best-effort, same as the alert itself.
  if (leadId && alert.ok && alert.chatId && alert.messageId) {
    try {
      await completeWebsiteLeadAlert({
        leadId,
        chatId: alert.chatId,
        messageId: alert.messageId,
      });
    } catch (error) {
      console.error("Failed to store lead alert card ids:", error);
    }
  }
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

  const attioApiKey = process.env.ATTIO_API_KEY ?? process.env.ATTIO_CRM_KEY;
  if (!attioApiKey) {
    console.error("ATTIO_API_KEY / ATTIO_CRM_KEY missing");
    return NextResponse.json({ error: "Attio not configured" }, { status: 500 });
  }

  let personId: string;
  try {
    personId = await upsertAttioPerson(
      buildAttioPersonValues(payload),
      payload.email,
      attioApiKey,
    );
  } catch (error) {
    console.error("Attio person upsert error:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }

  await patchAttioPersonOptional(
    personId,
    { inquiry_details: buildInquiryDetailsText(payload) },
    attioApiKey,
  );
  await createAttioNote(
    personId,
    `Website inquiry — ${getEventType(payload)}`,
    buildNoteMarkdown(payload),
    attioApiKey,
  );
  const leadId = await persistWebsiteLead(payload);
  await sendTelegramNotification(payload, leadId);

  return NextResponse.json({ success: true });
}
