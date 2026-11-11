import {
  formatDateForHumans,
  getEventLabel,
  type BookingMessageData,
} from "./build-message";

export const BOOKING_DRAFT_DEADLINE_MS = 3_000;

export type BookingContactDraftInput = Pick<
  BookingMessageData,
  | "eventType"
  | "eventTypeOther"
  | "date"
  | "dateUnsure"
  | "location"
  | "guestCount"
  | "performanceMinutes"
  | "bookerRole"
  | "bookerRoleOther"
  | "message"
  | "bookingOnBehalf"
  | "organisation"
> & { fullName: string };

export type BookingContactDrafts = {
  whatsapp: string;
  email: { subject: string; body: string };
};

export type BookingDraftProse = {
  city?: string;
  company?: string;
  notes: string;
};

const ROLE_DETAILS = {
  bride: "I'm the bride",
  groom: "I'm the groom",
  partner: "I'm one of the partners getting married",
  "event-planner": "I'm the event planner",
  "corporate-organiser": "I'm organising the event for my company",
  "executive-assistant": "I'm the executive assistant helping with the booking",
  host: "I'm hosting the event",
  "family-or-friend": "I'm helping with the booking as family or a friend",
} satisfies Record<Exclude<BookingMessageData["bookerRole"], "" | "other">, string>;

// Free-text labels can come in as short phrases. Keep names and acronyms
// intact, and remove boundary punctuation before joining the generated prose.
function inlineLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim().replace(/[.!?,;:]+$/, "");
}

function venueForDraft(value: string, inferredCity?: string): string {
  const venue = inlineLabel(value);
  if (!venue) return "";
  const name = /^CTICC\b/i.test(venue) ? `the ${venue}` : venue;
  const parts = name.split(",").map((part) => part.trim());

  // South African Places addresses end with a postcode and the country.
  // Shorten these in the draft only; leave less structured input as written.
  if (parts.length >= 3 && /^South Africa$/i.test(parts.at(-1) ?? "")) {
    const address = parts.slice(0, -1);
    const last = address.pop() ?? "";
    const city = /^\d{4}$/.test(last)
      ? address.pop()
      : last.match(/^(.+?)\s+\d{4}$/)?.[1];
    if (city && /^[\p{L}][\p{L}\p{M} .'’-]*$/u.test(city) && address.length && address.every(Boolean)) {
      const locality = city.toLowerCase();
      const venueParts = address.filter((part, i) =>
        i === 0 || ![locality, `${locality} city centre`].includes(part.toLowerCase()),
      );
      return venueParts.length === 1 ? `${venueParts[0]} in ${city}` : `${venueParts.join(", ")}, ${city}`;
    }
  }

  return inferredCity ? `${name} in ${inferredCity}` : name;
}

function withArticle(label: string): string {
  if (/^(?:a|an|the|my|our|their)\s/i.test(label)) return label;
  const initialism = /^[A-Z]{2,}\b/.test(label);
  const vowelSound = initialism
    ? /^[AEFHILMNORSX]/.test(label)
    : /^(?:hour|honest|honour|heir)/i.test(label) ||
      (/^[aeiou]/i.test(label) && !/^(?:one\b|uni(?:vers|form|que|on)|eu|use|user)/i.test(label));
  return `${vowelSound ? "an" : "a"} ${label}`;
}

function eventDetails(data: BookingContactDraftInput): { label: string; phrase: string } {
  if (!data.eventType || (data.eventType === "other" && !inlineLabel(data.eventTypeOther))) {
    return { label: "Live cello enquiry", phrase: "an event" };
  }
  const label = data.eventType === "exposition" ? "Trade show" : inlineLabel(getEventLabel(data));
  const phrase = data.eventType === "other"
    ? label.replace(/^(Product launch|Awards evening|Anniversary|Birthday dinner|Gala dinner)\b/i, (part) => part.toLowerCase())
    : label.toLowerCase();
  return { label: `Live cello enquiry: ${label}`, phrase: withArticle(phrase) };
}

function roleDetails(data: BookingContactDraftInput, company?: string): string {
  const role = data.bookerRole === "other"
    ? inlineLabel(data.bookerRoleOther)
    : "";
  if (role) return `I'm handling the enquiry as ${withArticle(role)}`;
  if (!data.bookerRole || data.bookerRole === "other") return "";
  if (data.bookerRole === "corporate-organiser" && data.bookingOnBehalf) return "I'm organising the event";
  if (data.bookerRole === "corporate-organiser" && company) return `I'm organising the event for ${company}`;
  if (data.bookerRole === "executive-assistant" && company) return `I'm an executive assistant at ${company} and I'm helping with the booking`;
  if (data.bookerRole === "partner" && data.eventType !== "wedding") return "I'm one of the partners";
  return ROLE_DETAILS[data.bookerRole];
}

function performanceLength(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [
    hours ? `${hours} ${hours === 1 ? "hour" : "hours"}` : "",
    remainder ? `${remainder} ${remainder === 1 ? "minute" : "minutes"}` : "",
  ].filter(Boolean).join(" and ");
}

function guestEstimate(count: number | null): string {
  if (count === null || count <= 0) return "";
  if (count === 1) return "I'm expecting 1 guest.";
  if (count >= 200) return "I'm expecting 200 or more guests.";
  const lower = Math.floor(count / 10) * 10;
  const upper = Math.ceil(count / 10) * 10;
  const estimate = count < 20 || lower === upper ? String(count) : `${lower} to ${upper}`;
  return `I'm expecting about ${estimate} guests.`;
}

export function buildBookingContactDrafts(
  data: BookingContactDraftInput,
  prose?: BookingDraftProse,
): BookingContactDrafts {
  const event = eventDetails(data);
  const date = data.dateUnsure ? "" : inlineLabel(formatDateForHumans(data.date));
  const place = venueForDraft(data.location, prose?.city);
  const role = roleDetails(data, prose?.company);
  const organisation = inlineLabel(data.organisation);
  const minutes = data.performanceMinutes;
  const description = `${event.phrase}${date ? ` on ${date}` : ""}${place ? ` at ${place}` : ""}`;
  const eventParagraph = (opening: string) => [
    opening,
    data.dateUnsure ? "The date is still flexible." : "",
    role ? `${role}.` : "",
    data.bookingOnBehalf
      ? `I'm enquiring on behalf of ${organisation || "a client or company"}.`
      : "",
  ].filter(Boolean).join(" ");
  const performanceParagraph = [
    Number.isInteger(minutes) && minutes > 0
      ? `We're looking for about ${performanceLength(minutes)} of live music.`
      : "",
    guestEstimate(data.guestCount),
  ].filter(Boolean).join(" ");
  const notes = prose?.notes ?? data.message.trim();
  const name = data.fullName.trim();
  const body = (intro: string, closing: string) =>
    ["Hi Luke,", intro, performanceParagraph, notes, closing].filter(Boolean).join("\n\n");

  return {
    whatsapp: body(
      eventParagraph(`I'd love some live cello for ${description}.`),
      name ? `Thanks,\n${name}` : "Thanks!",
    ),
    email: {
      subject: event.label,
      body: body(
        eventParagraph(`I'd like to enquire about live cello for ${description}.`),
        name ? `Kind regards,\n${name}` : "Kind regards",
      ),
    },
  };
}
