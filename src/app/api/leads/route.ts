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

function getEventType(payload: LeadPayload) {
  if (payload.eventType === "something-else") {
    return payload.eventTypeOther.trim() || "Other event";
  }

  return payload.eventType || "Event inquiry";
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

function toPostgresDate(date: string, dateUnsure: boolean) {
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

function validatePayload(payload: LeadPayload) {
  if (!payload.firstName.trim()) return "Missing first name";
  if (!EMAIL_REGEX.test(payload.email.trim())) return "Invalid email";
  if (!payload.eventType) return "Missing event type";
  if (payload.eventType === "something-else" && !payload.eventTypeOther.trim()) {
    return "Missing event type";
  }
  if (!payload.dateUnsure && !toPostgresDate(payload.date, payload.dateUnsure)) {
    return "Invalid event date";
  }
  if (!payload.location.trim()) return "Missing location";
  if (!Number.isFinite(payload.performanceMinutes) || payload.performanceMinutes <= 0) {
    return "Invalid performance length";
  }

  return null;
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

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const row = {
    first_name: payload.firstName.trim(),
    last_name: payload.lastName.trim() || null,
    email: payload.email.trim(),
    phone_number: payload.phone.trim() || null,
    whatsapp_number: payload.whatsappSameAsPhone
      ? payload.phone.trim() || null
      : payload.whatsapp.trim() || null,
    lead_source: "website-book-form",
    pipeline_stage: "new",
    intent_temperature: "warm",
    event_type: getEventType(payload),
    event_date: toPostgresDate(payload.date, payload.dateUnsure),
    event_duration: `${payload.performanceMinutes} minutes`,
    venue_address: payload.location.trim(),
    notes: payload.notes.trim() || payload.message.trim() || null,
    tags: ["website", "book-form"],
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/leads`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Supabase lead insert error:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
