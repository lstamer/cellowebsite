/**
 * Pure helpers for the booking form's human-readable summary.
 *
 * `buildMessage()` produces the `notes` field of the /api/leads payload. That
 * text is stored in Supabase and rendered into the AI drafting prompt, so its
 * shape is part of the inquiry pipeline contract and is snapshot-tested.
 */

export type EventType =
  | "wedding"
  | "private-event"
  | "corporate-event"
  | "fundraiser"
  | "something-else"
  | "";

export type BookerRole =
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

export type ContactPreference = "whatsapp" | "email";

export const BOOKER_ROLES: { value: Exclude<BookerRole, "">; label: string }[] = [
  { value: "bride", label: "Bride" },
  { value: "groom", label: "Groom" },
  { value: "partner", label: "Partner" },
  { value: "event-planner", label: "Event planner" },
  { value: "corporate-organiser", label: "Corporate organiser" },
  { value: "executive-assistant", label: "Executive assistant" },
  { value: "host", label: "Host" },
  { value: "family-or-friend", label: "Family or friend" },
  { value: "other", label: "Other" },
];

export interface BookingMessageData {
  eventType: EventType;
  eventTypeOther: string;
  date: string;
  dateUnsure: boolean;
  location: string;
  phone: string;
  whatsappSameAsPhone: boolean;
  whatsapp: string;
  contactPreference: ContactPreference;
  guestCount: number | null;
  performanceMinutes: number;
  message: string;
  bookingOnBehalf: boolean;
  organisation: string;
  bookerRole: BookerRole;
  bookerRoleOther: string;
}

export function getEventLabel(
  data: Pick<BookingMessageData, "eventType" | "eventTypeOther">,
): string {
  if (data.eventType === "something-else") return data.eventTypeOther.trim() || "Other event";
  if (!data.eventType) return "Event inquiry";
  return data.eventType
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function buildMessage(data: BookingMessageData): string {
  const whatsappNumber = data.whatsappSameAsPhone
    ? data.phone || "Same as phone"
    : data.whatsapp || "Not provided";

  const lines = [
    `Event type: ${getEventLabel(data)}`,
    `Date: ${data.dateUnsure ? "Flexible / TBD" : data.date}`,
    `Location: ${data.location}`,
    `Phone: ${data.phone || "Not provided"}`,
    `WhatsApp: ${whatsappNumber}`,
    `Preferred contact: ${data.contactPreference === "email" ? "Email" : "WhatsApp"}`,
    `Role: ${
      data.bookerRole === "other"
        ? data.bookerRoleOther.trim()
        : BOOKER_ROLES.find((role) => role.value === data.bookerRole)?.label ?? "Not provided"
    }`,
    `Guest count: ${
      data.guestCount === null
        ? "Not specified"
        : data.guestCount >= 200
          ? "200+"
          : data.guestCount
    }`,
    `Performance length: ${data.performanceMinutes} minutes`,
  ];

  // Fold the optional "booking on behalf of a client/company" detail into the
  // notes text — the /api/leads payload shape stays untouched.
  if (data.bookingOnBehalf) {
    lines.push(
      `Booking on behalf of a client/company: ${data.organisation.trim() || "Yes (organisation not specified)"}`
    );
  }

  lines.push("", "Message:", data.message.trim() || "Not provided");

  return lines.join("\n");
}
