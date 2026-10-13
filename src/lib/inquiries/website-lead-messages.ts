export interface WebsiteLeadManualMessageContext {
  firstName: string;
  eventType: string | null;
  eventDateText: string | null;
  dateFlexible: boolean | null;
  location: string | null;
}

function firstNameOrThere(firstName: string): string {
  return firstName.trim() || "there";
}

function eventOrEvent(input: WebsiteLeadManualMessageContext): string {
  return input.eventType?.trim() || "your event";
}

function nearbyOpening(input: WebsiteLeadManualMessageContext): string {
  if (!input.location?.trim()) return "";

  const event = eventOrEvent(input).toLowerCase();
  const article = /^[aeiou]/.test(event) ? "an" : "a";
  return `I just did ${article} ${event} quite close to ${input.location.trim()}; it’s a lovely area.`;
}

function formatDateForMessage(input: WebsiteLeadManualMessageContext): string {
  const raw = input.eventDateText?.trim();
  if (input.dateFlexible || !raw) return "the date you mentioned";

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, , month, day] = isoMatch;
    const monthName = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ][Number(month) - 1];

    if (monthName) return `the ${ordinal(Number(day))} of ${monthName}`;
  }

  const humanMatch = raw.match(/^(\d{1,2})\s+([A-Za-z]+)(?:\s+\d{4})?$/);
  if (humanMatch) return `the ${ordinal(Number(humanMatch[1]))} of ${humanMatch[2]}`;

  return raw;
}

function ordinal(value: number): string {
  const suffix =
    value % 100 >= 11 && value % 100 <= 13
      ? "th"
      : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[value % 10] ??
        "th";
  return `${value}${suffix}`;
}

/** Short first-contact message for the Telegram card's direct WhatsApp link. */
export function buildWebsiteLeadFirstContactMessage(
  input: WebsiteLeadManualMessageContext,
): string {
  return [
    `Hi ${firstNameOrThere(input.firstName)}, thanks for getting in touch.`,
    "I've received your event enquiry and I'm checking my availability.",
    "I'll get back to you as soon as I can.",
    "",
    "Luke",
  ].join("\n");
}

export function buildWebsiteLeadAvailabilityMessage(
  input: WebsiteLeadManualMessageContext,
  availability: "available" | "unavailable",
): string {
  const firstName = firstNameOrThere(input.firstName);
  const date = formatDateForMessage(input);

  if (availability === "available") {
    const nearby = nearbyOpening(input);
    const weddingSpecific = eventOrEvent(input).toLowerCase() === "wedding";
    const placementQuestion = weddingSpecific
      ? "Do you have any ideas about where you see the cello fitting in? Processional/ceremony, guest arrival, cocktail hour etc? Most couples do ceremony and guest arrival, but everyone’s different."
      : "Do you have any ideas about where you see the cello fitting in? Guest arrival, drinks reception, dinner, speeches etc? Every event is different.";

    return [
      `Hi ${firstName}, thanks for reaching out!${nearby ? ` ${nearby}` : ""}`,
      `I am available on ${date}, and I have three main packages I offer depending on how elaborate the event is.`,
      placementQuestion,
      "Once I know that I can come back with pricing and any other questions you may have ☺️",
      "Best regards\nLuke",
    ].join("\n\n");
  }

  return [
    `Hi ${firstName}, thanks for getting in touch. I'm sorry, but I'm not available on ${date}. My bookings are particularly busy around then, and I don't want to promise something I can't give properly.`,
    "If another date could work, send it through and I'll gladly check. And if you plan another event in future, mention this enquiry and I'll see what I can do to make up for the inconvenience.",
    "Wishing you the best with it,\nLuke",
  ].join("\n\n");
}
