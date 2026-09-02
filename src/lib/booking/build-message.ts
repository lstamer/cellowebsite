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
  | "celebration"
  | "corporate-function"
  | "fundraiser"
  | "concert"
  | "party"
  | "exposition"
  | "other"
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

/**
 * The booking form's event types. This list is the single source of truth: the
 * dropdown, the `?type=` funnel param, and the /api/leads validator all read it,
 * so adding a type here is the only edit needed.
 */
export const EVENT_TYPE_OPTIONS: { value: Exclude<EventType, "">; label: string }[] = [
  { value: "wedding", label: "Wedding" },
  { value: "private-event", label: "Private event" },
  { value: "celebration", label: "Celebration" },
  { value: "corporate-function", label: "Corporate function" },
  { value: "fundraiser", label: "Fundraiser" },
  { value: "concert", label: "Concert" },
  { value: "party", label: "Party" },
  { value: "exposition", label: "Exposition / trade show" },
  { value: "other", label: "Other" },
];

export const EVENT_TYPES: Exclude<EventType, "">[] = EVENT_TYPE_OPTIONS.map((opt) => opt.value);

const EVENT_TYPE_LABELS: Record<Exclude<EventType, "">, string> = Object.fromEntries(
  EVENT_TYPE_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<Exclude<EventType, "">, string>;

/**
 * Funnel `?type=` values kept working after the event-type rename, so links
 * already in the wild (and any indexed URLs) still pre-select the right option.
 */
export const LEGACY_EVENT_TYPE_ALIASES: Record<string, Exclude<EventType, "">> = {
  "corporate-event": "corporate-function",
  "something-else": "other",
};

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
  if (data.eventType === "other") return data.eventTypeOther.trim() || "Other event";
  if (!data.eventType) return "Event inquiry";
  return EVENT_TYPE_LABELS[data.eventType];
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Renders an ISO `YYYY-MM-DD` date as `30 September 2026` (en-ZA long form).
 * Anything else (legacy `Sep 30, 2026`, empty string) passes through unchanged.
 * Built from numeric parts so the local date never shifts across timezones.
 */
export function formatDateForHumans(date: string): string {
  const match = ISO_DATE.exec(date);
  if (!match) return date;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function buildMessage(data: BookingMessageData): string {
  const whatsappNumber = data.whatsappSameAsPhone
    ? data.phone || "Same as phone"
    : data.whatsapp || "Not provided";

  const lines = [
    `Event type: ${getEventLabel(data)}`,
    `Date: ${data.dateUnsure ? "Flexible / TBD" : formatDateForHumans(data.date)}`,
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
