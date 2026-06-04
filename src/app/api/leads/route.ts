import { createAttioNote, upsertAttioPerson } from "@/lib/attio";
import { NextResponse } from "next/server";

type EventType =
  | "wedding"
  | "private-event"
  | "corporate-event"
  | "fundraiser"
  | "something-else"
  | "";

interface LeadPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  whatsappSameAsPhone: boolean;
  eventType: EventType;
  eventTypeOther: string;
  date: string;
  dateUnsure: boolean;
  location: string;
  guestCount: number | null;
  performanceMinutes: number;
  message: string;
  notes: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EVENT_TYPES: EventType[] = [
  "wedding",
  "private-event",
  "corporate-event",
  "fundraiser",
  "something-else",
  "",
];
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

const WASENDER_ENDPOINT = "https://wasenderapi.com/api/send-message";
const DEFAULT_NOTIFY_NUMBER = "+27822306983";

function getEventType(payload: LeadPayload) {
  if (payload.eventType === "something-else") {
    return payload.eventTypeOther.trim() || "Other event";
  }

  if (!payload.eventType) return "Event inquiry";

  return payload.eventType
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
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
    typeof candidate.eventType === "string" &&
    EVENT_TYPES.includes(candidate.eventType as EventType) &&
    typeof candidate.eventTypeOther === "string" &&
    typeof candidate.date === "string" &&
    typeof candidate.dateUnsure === "boolean" &&
    typeof candidate.location === "string" &&
    (typeof candidate.guestCount === "number" || candidate.guestCount === null) &&
    typeof candidate.performanceMinutes === "number" &&
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
  if (payload.eventType === "something-else" && !payload.eventTypeOther.trim()) {
    return "Missing event type";
  }
  if (!payload.dateUnsure && !toIsoDate(payload.date, payload.dateUnsure)) {
    return "Invalid event date";
  }
  if (!payload.location.trim()) return "Missing location";
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

function buildAttioPersonValues(payload: LeadPayload): Record<string, unknown> {
  const firstName = payload.firstName.trim();
  const lastName = payload.lastName.trim();
  const fullName = `${firstName} ${lastName}`.trim();

  const values: Record<string, unknown> = {
    description: `Website inquiry — ${getEventType(payload)}`,
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

async function sendWhatsappNotification(payload: LeadPayload) {
  const apiKey = process.env.WASENDER_API_KEY;
  if (!apiKey) {
    console.warn("WASENDER_API_KEY missing — skipping WhatsApp notification");
    return;
  }

  const to = process.env.WASENDER_NOTIFY_TO?.trim() || DEFAULT_NOTIFY_NUMBER;
  const fullName =
    `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim() || "Unknown";

  const whatsappNumber = payload.whatsappSameAsPhone
    ? payload.phone.trim()
    : payload.whatsapp.trim();

  const lines = [
    "🎻 New inquiry from stamer.co.za",
    "",
    `👤 Name: ${fullName}`,
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
  if (payload.guestCount !== null) {
    lines.push(`👥 Guests: ${formatGuestCount(payload.guestCount)}`);
  }
  lines.push(`⏱ Performance: ${payload.performanceMinutes} min`);
  if (payload.message.trim()) {
    lines.push("", `💬 Message: ${payload.message.trim()}`);
  }

  try {
    const res = await fetch(WASENDER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, text: lines.join("\n") }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("WaSender send-message failed:", res.status, errorBody);
    }
  } catch (error) {
    console.error("WaSender request error:", error);
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

  await createAttioNote(
    personId,
    `Website inquiry — ${getEventType(payload)}`,
    buildNoteMarkdown(payload),
    attioApiKey,
  );
  await sendWhatsappNotification(payload);

  return NextResponse.json({ success: true });
}
