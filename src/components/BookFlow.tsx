"use client";

import {
  useState,
  useRef,
  useCallback,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { isValidPhoneNumber } from "libphonenumber-js";
import { cn } from "@/lib/utils";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import { buildMailtoHref, buildGmailComposeHref } from "@/lib/email";

import { EventTypeDropdown } from "@/components/booking/EventTypeDropdown";
import { CalendarPicker } from "@/components/booking/CalendarPicker";
import { LocationAutocomplete } from "@/components/booking/LocationAutocomplete";
import { PhoneInput } from "@/components/booking/PhoneInput";
import { GuestSlider } from "@/components/booking/GuestSlider";
import {
  BOOKER_ROLES,
  buildMessage,
  type BookerRole,
  type ContactPreference,
  type EventType,
} from "@/lib/booking/build-message";

export type BookAudience = "planner" | "expo" | "coordinator" | "self";
export type { ContactPreference };
type Step0Field =
  | "eventType"
  | "eventTypeOther"
  | "date"
  | "location"
  | "fullName"
  | "email"
  | "phone"
  | "whatsapp";
type Status = "idle" | "submitting" | "error";

interface BookingData {
  eventType: EventType;
  eventTypeOther: string;
  date: string;
  dateUnsure: boolean;
  location: string;
  fullName: string;
  email: string;
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STEP0_FIELDS: Step0Field[] = [
  "eventType",
  "eventTypeOther",
  "date",
  "location",
  "fullName",
  "email",
  "phone",
  "whatsapp",
];

/** Human-readable label for a pre-selected event type (used in fast-lane WhatsApp + copy). */
const EVENT_TYPE_LABELS: Record<Exclude<EventType, "">, string> = {
  wedding: "Wedding",
  "private-event": "Private event",
  "corporate-event": "Corporate event",
  fundraiser: "Fundraiser",
  "something-else": "Live cello",
};

interface PersonaCopy {
  heading: string;
  intro: string;
  placeholder: string;
}

/** Default (generic / wedding) Step-0 copy. */
const DEFAULT_PERSONA_COPY: PersonaCopy = {
  heading: "The essentials.",
  intro: "Share the basics so I can understand the event and reply with the right next step.",
  placeholder:
    "We want cello as guests arrive and at cocktail hour. The dress code is all white. There will be some speeches in between. A sound technician will be present. We want a mix of classical and modern music. My daughter loves Robbie Williams. ",
};

/**
 * Persona-tailored Step-0 copy (copy-only — no new backend event types).
 * Resolution order: audience (planner/coordinator/expo) wins, otherwise event type.
 * `self` and `wedding` keep the warm default tone.
 */
function resolvePersonaCopy(
  eventType: EventType,
  audience?: BookAudience
): PersonaCopy {
  if (audience === "planner" || audience === "coordinator") {
    return {
      heading: "The brief.",
      intro:
        "Give me the essentials and I'll come back with availability, a quote, and what I need for the run-of-show. Happy to invoice and slot into your timeline.",
      placeholder:
        "Ceremony at 3pm, drinks reception 4–5pm, then a corporate dinner. I'll need a tax invoice and a PO reference. There's a sound technician on site and a tight run-of-show. Let me know your power and setup needs.",
    };
  }

  if (audience === "expo") {
    return {
      heading: "The stand.",
      intro:
        "Tell me about the exhibition and I'll come back with availability and a quote. I'm used to playing a stand or activation across a show day, happy to invoice.",
      placeholder:
        "We've got a stand at the expo and want live cello to draw people in across the day, say two 45-minute sets either side of lunch. Let me know power and setup needs, plus what you need for invoicing.",
    };
  }

  if (eventType === "corporate-event") {
    return {
      heading: "The brief.",
      intro:
        "Share the basics and I'll come straight back with availability, a quote, and the next steps. Happy to invoice and work to your run-of-show.",
      placeholder:
        "We want live cello as guests arrive and through the awards dinner. There's a sound technician on site and a fixed run-of-show. Let me know power and setup needs, and I'll need a tax invoice.",
    };
  }

  if (eventType === "private-event") {
    return {
      heading: "The essentials.",
      intro:
        "Tell me about the celebration (birthday, anniversary, the moment you're marking) and I'll reply with availability and the right next step.",
      placeholder:
        "It's a 50th birthday at home. We'd love cello as guests arrive and through dinner, a mix of classical and a few songs that mean something to us. There'll be a short speech in the middle.",
    };
  }

  if (eventType === "fundraiser") {
    return {
      heading: "The essentials.",
      intro:
        "Tell me about the evening and I'll come back with availability and the next steps, happy to invoice and work to your programme.",
      placeholder:
        "It's a charity gala with a live auction. We'd love cello through the reception and between speeches. Let me know the run-of-show and what you need for invoicing.",
    };
  }

  return DEFAULT_PERSONA_COPY;
}

const CONTACT_PREFERENCES: { value: ContactPreference; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
];


interface BookFlowProps {
  onSuccess?: (info: { firstName: string; contactPreference: ContactPreference }) => void;
  /** Pre-selects the event type from the funnel URL (`?type=…`). */
  initialEventType?: EventType;
  /** Copy-only tailoring + on-behalf affordance from the funnel URL (`?for=…`). */
  audience?: BookAudience;
}

export function BookFlow({ onSuccess, initialEventType, audience }: BookFlowProps) {
  const personaCopy = resolvePersonaCopy(initialEventType ?? "", audience);
  const showOnBehalf = audience === "planner" || audience === "coordinator";
  const presetEventLabel = initialEventType
    ? EVENT_TYPE_LABELS[initialEventType]
    : undefined;
  const fastLaneHref = buildWhatsAppHref({
    eventType: presetEventLabel,
    source: "book-fastlane",
  });
  const fastMailHref = buildMailtoHref({
    eventType: presetEventLabel,
    source: "book-fastlane",
  });
  const fastGmailHref = buildGmailComposeHref({
    eventType: presetEventLabel,
    source: "book-fastlane",
  });

  // Touch devices have a native mail app, so let the mailto: open it. On desktop
  // a mailto handler is often unset (the link would do nothing), so open Gmail's
  // web compose in a new tab instead — same prefilled draft either way.
  function handleEmailClick(e: ReactMouseEvent<HTMLAnchorElement>) {
    if (typeof window === "undefined") return;
    const prefersNativeMail = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (prefersNativeMail) return;
    e.preventDefault();
    window.open(fastGmailHref, "_blank", "noopener,noreferrer");
  }
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<BookingData>({
    eventType: initialEventType ?? "",
    eventTypeOther: "",
    date: "",
    dateUnsure: false,
    location: "",
    fullName: "",
    email: "",
    phone: "",
    whatsappSameAsPhone: true,
    whatsapp: "",
    contactPreference: "whatsapp",
    guestCount: null,
    performanceMinutes: 60,
    message: "",
    bookingOnBehalf: false,
    organisation: "",
    bookerRole: "",
    bookerRoleOther: "",
  });
  const [touchedFields, setTouchedFields] = useState<Partial<Record<Step0Field, boolean>>>({});
  const [didAttemptStep0Submit, setDidAttemptStep0Submit] = useState(false);
  const [didAttemptStep1Submit, setDidAttemptStep1Submit] = useState(false);

  const [announcement, setAnnouncement] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusHeadingRef = useRef(false);
  const lastGuestCountRef = useRef(50);

  const stepHeadings = [personaCopy.heading, "A few more details."];
  const totalSteps = stepHeadings.length;

  // Animate step in on mount. After a step change the heading receives focus
  // once the enter tween has settled so keyboard and screen-reader users land
  // at the top of the new step instead of on <body>.
  useGSAP(() => {
    if (!stepRef.current) return;
    gsap.fromTo(
      stepRef.current,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: "power3.out",
        onComplete: () => {
          if (!shouldFocusHeadingRef.current) return;
          shouldFocusHeadingRef.current = false;
          headingRef.current?.focus({ preventScroll: true });
        },
      }
    );
  }, [step]);

  function animateOut(callback: () => void) {
    if (!stepRef.current) {
      callback();
      return;
    }
    gsap.to(stepRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      ease: "power2.in",
      onComplete: callback,
    });
  }

  function scrollToFormStart() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!containerRef.current) return;
        const formTop = containerRef.current.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: Math.max(formTop, 0), behavior: "auto" });
      });
    });
  }

  function goToStep(next: number) {
    animateOut(() => {
      shouldFocusHeadingRef.current = true;
      setStep(next);
      setAnnouncement(`Step ${next + 1} of ${totalSteps}: ${stepHeadings[next]}`);
      scrollToFormStart();
    });
  }

  function goNext() {
    goToStep(step + 1);
  }

  function goBack() {
    goToStep(step - 1);
  }

  function update<K extends keyof BookingData>(field: K, value: BookingData[K]) {
    setData((d) => ({ ...d, [field]: value }));
  }

  function markTouched(field: Step0Field) {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  }

  function markAllStep0Touched() {
    setTouchedFields(
      STEP0_FIELDS.reduce<Partial<Record<Step0Field, boolean>>>((fields, field) => {
        fields[field] = true;
        return fields;
      }, {})
    );
  }

  const eventTypeOtherRequired = data.eventType === "something-else";
  const trimmedEmail = data.email.trim();
  const trimmedPhone = data.phone.trim();
  const trimmedWhatsapp = data.whatsapp.trim();
  const emailIsValid = EMAIL_REGEX.test(trimmedEmail);
  const phoneIsValid = trimmedPhone === "" || isValidPhoneNumber(trimmedPhone);
  const whatsappIsValid =
    data.whatsappSameAsPhone || trimmedWhatsapp === "" || isValidPhoneNumber(trimmedWhatsapp);
  const phoneRequiredForWhatsapp =
    data.contactPreference === "whatsapp" && data.whatsappSameAsPhone;
  const separateWhatsappRequired =
    data.contactPreference === "whatsapp" && !data.whatsappSameAsPhone;

  const step0Errors: Record<Step0Field, string> = {
    eventType: data.eventType ? "" : "Select an event type.",
    eventTypeOther:
      eventTypeOtherRequired && !data.eventTypeOther.trim()
        ? "Tell us what kind of event you have in mind."
        : "",
    date: data.dateUnsure || data.date.trim() ? "" : "Choose a date or mark it as flexible.",
    location: data.location.trim() ? "" : "Enter the venue or city.",
    fullName: data.fullName.trim() ? "" : "Enter your full name.",
    email: !trimmedEmail
      ? "Enter your email address."
      : emailIsValid
        ? ""
        : "Enter a valid email address.",
    phone: phoneRequiredForWhatsapp && !trimmedPhone
      ? "Enter a phone number for WhatsApp."
      : trimmedPhone && !phoneIsValid
        ? "Enter a valid phone number."
        : "",
    whatsapp:
      separateWhatsappRequired && !trimmedWhatsapp
        ? "Enter your WhatsApp number."
        : !data.whatsappSameAsPhone && trimmedWhatsapp && !whatsappIsValid
          ? "Enter a valid WhatsApp number."
          : "",
  };

  const isStep0Valid = Object.values(step0Errors).every((error) => error === "");
  const shouldShowError = (field: Step0Field) =>
    Boolean(step0Errors[field]) && (didAttemptStep0Submit || touchedFields[field]);
  const bookerRoleError = data.bookerRole ? "" : "Choose the option that best describes you.";
  const bookerRoleOtherError =
    data.bookerRole === "other" && !data.bookerRoleOther.trim()
      ? "Tell me how you would describe yourself."
      : "";
  const isStep1Valid = !bookerRoleError && !bookerRoleOtherError;

  function handleStep0Continue() {
    setDidAttemptStep0Submit(true);

    if (!isStep0Valid) {
      markAllStep0Touched();
      return;
    }

    goNext();
  }

  function handleWhatsappSameAsPhoneChange(checked: boolean) {
    setData((current) => ({
      ...current,
      whatsappSameAsPhone: checked,
      whatsapp: checked ? "" : current.whatsapp,
    }));
  }

  const handleGuestCountChange = useCallback((count: number) => {
    lastGuestCountRef.current = count;
    setData((d) => ({ ...d, guestCount: count }));
  }, []);

  function handleGuestCountIncludeChange(checked: boolean) {
    if (checked) {
      setData((d) => ({ ...d, guestCount: lastGuestCountRef.current }));
    } else {
      setData((d) => ({ ...d, guestCount: null }));
    }
  }

  function splitName(fullName: string) {
    const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
    };
  }

  async function handleSubmit() {
    setDidAttemptStep1Submit(true);
    if (!isStep1Valid) return;

    setStatus("submitting");
    setAnnouncement("Sending your enquiry...");

    const { firstName, lastName } = splitName(data.fullName);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: trimmedEmail,
          phone: data.phone,
          whatsapp: data.whatsapp,
          whatsappSameAsPhone: data.whatsappSameAsPhone,
          contactPreference: data.contactPreference,
          eventType: data.eventType,
          eventTypeOther: data.eventTypeOther,
          date: data.date,
          dateUnsure: data.dateUnsure,
          location: data.location,
          guestCount: data.guestCount,
          performanceMinutes: data.performanceMinutes,
          bookerRole: data.bookerRole,
          bookerRoleOther: data.bookerRoleOther,
          message: data.message,
          notes: buildMessage(data),
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      const first = splitName(data.fullName).firstName;
      animateOut(() => onSuccess?.({ firstName: first, contactPreference: data.contactPreference }));
    } catch {
      setStatus("error");
      setAnnouncement("Something went wrong. Please try again or email directly.");
    }
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 0) {
      handleStep0Continue();
      return;
    }
    if (status === "submitting") return;
    void handleSubmit();
  }

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-5xl">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {/* Fast lane — one-tap WhatsApp shortcut for hurried leads (kill #4) */}
      {step === 0 && (
        <div className="mb-8 flex flex-col gap-3 rounded-input border border-foreground/10 bg-cream p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="font-jost text-xs uppercase tracking-widest text-accent-ink">
              In a hurry?
            </p>
            <p className="font-sans text-sm leading-relaxed text-foreground/70">
              Skip the form. Send me your date and I&apos;ll check it, usually
              same day.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <a
            href={fastLaneHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-[1.429em] py-[0.714em] font-sans text-sm font-semibold text-on-dark transition-colors duration-300 hover:bg-primary/90"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.477-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            WhatsApp me your date
          </a>
          <a
            href={fastMailHref}
            onClick={handleEmailClick}
            className="inline-block py-2 text-center font-sans text-sm text-foreground/70 underline underline-offset-2 transition-colors hover:text-foreground sm:text-right"
          >
            or email me instead
          </a>
          </div>
        </div>
      )}

      <form noValidate onSubmit={handleFormSubmit}>
      {/* Step indicator */}
      <div
        role="progressbar"
        aria-label="Booking progress"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={step + 1}
        aria-valuetext={`Step ${step + 1} of ${totalSteps}`}
        className="flex items-center gap-2 mb-12"
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              i <= step ? "bg-primary flex-[2]" : "bg-foreground/15 flex-1"
            )}
          />
        ))}
      </div>

      <div ref={stepRef}>
        {/* Step 0: Essentials */}
        {step === 0 && (
          <div className="flex flex-col gap-8">
            <div>
              <p className="font-jost text-xs uppercase tracking-widest text-accent-ink mb-2">
                Step 1 of 2
              </p>
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-3xl font-semibold text-foreground outline-none"
              >
                {personaCopy.heading}
              </h2>
              <p className="mt-2 font-sans text-foreground/60">
                {personaCopy.intro}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col gap-6">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                  Your details
                </h3>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="book-full-name"
                    className="font-jost text-xs uppercase tracking-wider text-foreground/70"
                  >
                    Full name
                  </label>
                  <input
                    id="book-full-name"
                    type="text"
                    value={data.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    onBlur={() => markTouched("fullName")}
                    placeholder="Yo-Yo Ma"
                    aria-invalid={shouldShowError("fullName")}
                    aria-describedby={shouldShowError("fullName") ? "book-full-name-error" : undefined}
                    className={cn(
                      "bg-transparent border rounded-input px-4 py-3 font-sans text-foreground placeholder:text-foreground/60 focus:outline-none transition-colors w-full",
                      shouldShowError("fullName")
                        ? "border-accent text-foreground focus:border-accent"
                        : "border-foreground/20 focus:border-primary"
                    )}
                  />
                  {shouldShowError("fullName") && (
                    <p id="book-full-name-error" role="alert" className="font-sans text-sm text-error">
                      {step0Errors.fullName}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="book-email"
                    className="font-jost text-xs uppercase tracking-wider text-foreground/70"
                  >
                    Email
                  </label>
                  <input
                    id="book-email"
                    type="email"
                    value={data.email}
                    onChange={(e) => update("email", e.target.value)}
                    onBlur={() => markTouched("email")}
                    placeholder="you@example.com"
                    aria-invalid={shouldShowError("email")}
                    aria-describedby={shouldShowError("email") ? "book-email-error" : undefined}
                    className={cn(
                      "bg-transparent border rounded-input px-4 py-3 font-sans text-foreground placeholder:text-foreground/60 focus:outline-none transition-colors w-full",
                      shouldShowError("email")
                        ? "border-accent text-foreground focus:border-accent"
                        : "border-foreground/20 focus:border-primary"
                    )}
                  />
                  {shouldShowError("email") && (
                    <p id="book-email-error" role="alert" className="font-sans text-sm text-error">
                      {step0Errors.email}
                    </p>
                  )}
                </div>

                <PhoneInput
                  label="Phone number"
                  value={data.phone}
                  onChange={(v) => update("phone", v)}
                  onBlur={() => markTouched("phone")}
                  error={shouldShowError("phone") ? step0Errors.phone : undefined}
                />

                <label className="flex cursor-pointer items-start gap-3 rounded-input border border-foreground/10 bg-cream p-4">
                  <input
                    type="checkbox"
                    checked={data.whatsappSameAsPhone}
                    onChange={(e) => handleWhatsappSameAsPhoneChange(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-foreground/20 accent-primary"
                  />
                  <span className="font-sans text-sm leading-relaxed text-foreground/70">
                    My WhatsApp number is the same as my phone number.
                  </span>
                </label>

                {!data.whatsappSameAsPhone && (
                  <PhoneInput
                    label="WhatsApp"
                    value={data.whatsapp}
                    onChange={(v) => update("whatsapp", v)}
                    onBlur={() => markTouched("whatsapp")}
                    placeholder="082 123 4567"
                    error={shouldShowError("whatsapp") ? step0Errors.whatsapp : undefined}
                  />
                )}

                <div className="flex flex-col gap-3">
                  <label className="font-jost text-xs uppercase tracking-wider text-foreground/70">
                    Best way to reach you?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CONTACT_PREFERENCES.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update("contactPreference", opt.value)}
                        aria-pressed={data.contactPreference === opt.value}
                        className={cn(
                          "rounded-input border px-2 py-3 font-sans text-sm transition-colors sm:px-4",
                          data.contactPreference === opt.value
                            ? "border-primary bg-cream text-foreground"
                            : "border-foreground/20 text-foreground/60 hover:border-foreground/40"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {showOnBehalf && (
                  <div className="flex flex-col gap-4">
                    <label className="flex cursor-pointer items-start gap-3 rounded-input border border-foreground/10 bg-cream p-4">
                      <input
                        type="checkbox"
                        checked={data.bookingOnBehalf}
                        onChange={(e) => update("bookingOnBehalf", e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-foreground/20 accent-primary"
                      />
                      <span className="font-sans text-sm leading-relaxed text-foreground/70">
                        I&apos;m booking on behalf of a client or company.
                      </span>
                    </label>

                    {data.bookingOnBehalf && (
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="book-organisation"
                          className="font-jost text-xs uppercase tracking-wider text-foreground/70"
                        >
                          Company / organisation{" "}
                          <span className="normal-case tracking-normal text-foreground/60">
                            (optional)
                          </span>
                        </label>
                        <input
                          id="book-organisation"
                          type="text"
                          value={data.organisation}
                          onChange={(e) => update("organisation", e.target.value)}
                          placeholder="Acme Events / the client's name"
                          className="bg-transparent border border-foreground/20 rounded-input px-4 py-3 font-sans text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-primary transition-colors w-full"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6">
                <h3 className="font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                  Event details
                </h3>

                <EventTypeDropdown
                  value={data.eventType}
                  otherText={data.eventTypeOther}
                  onChange={(v) => update("eventType", v)}
                  onOtherChange={(v) => update("eventTypeOther", v)}
                  error={shouldShowError("eventType") ? step0Errors.eventType : undefined}
                  otherError={shouldShowError("eventTypeOther") ? step0Errors.eventTypeOther : undefined}
                />

                <CalendarPicker
                  value={data.date}
                  isUnsure={data.dateUnsure}
                  onChange={(v) => update("date", v)}
                  onUnsureChange={(v) => update("dateUnsure", v)}
                  error={shouldShowError("date") ? step0Errors.date : undefined}
                />

                <LocationAutocomplete
                  value={data.location}
                  onChange={(v) => update("location", v)}
                  onBlur={() => markTouched("location")}
                  error={shouldShowError("location") ? step0Errors.location : undefined}
                />
              </div>
            </div>

            <button
              type="submit"
              aria-disabled={!isStep0Valid}
              className={cn(
                "mt-4 w-full rounded-full font-semibold px-8 py-4 transition-all duration-300",
                isStep0Valid
                  ? "bg-primary text-on-dark hover:bg-primary/90 cursor-pointer"
                  : "bg-foreground/10 text-foreground/30 cursor-not-allowed"
              )}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 1: Optional details */}
        {step === 1 && (
          <div className="mx-auto flex max-w-2xl flex-col gap-8">
            <div>
              <p className="font-jost text-xs uppercase tracking-widest text-accent-ink mb-2">
                Step 2 of 2
              </p>
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="font-display text-3xl font-semibold text-foreground outline-none"
              >
                {stepHeadings[1]}
              </h2>
              <p className="mt-2 font-sans text-foreground/60">
                Tell me who I&apos;m speaking to, then add whatever else you know.
              </p>
            </div>

            <div className="flex flex-col gap-8">
              <fieldset className="flex flex-col gap-4">
                <legend className="font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                  How would you describe yourself?
                </legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {BOOKER_ROLES.map((role) => (
                    <label
                      key={role.value}
                      className={cn(
                        "flex cursor-pointer items-center justify-center rounded-input border px-[1em] py-[0.75em] text-center font-sans text-sm transition-colors focus-within:border-primary",
                        data.bookerRole === role.value
                          ? "border-primary bg-cream text-foreground"
                          : "border-foreground/20 text-foreground/60 hover:border-foreground/40"
                      )}
                    >
                      <input
                        type="radio"
                        name="booker-role"
                        value={role.value}
                        checked={data.bookerRole === role.value}
                        onChange={() => update("bookerRole", role.value)}
                        aria-describedby={bookerRoleError && didAttemptStep1Submit ? "book-role-error" : undefined}
                        className="sr-only"
                      />
                      <span>{role.label}</span>
                    </label>
                  ))}
                </div>
                {bookerRoleError && didAttemptStep1Submit && (
                  <p id="book-role-error" role="alert" className="font-sans text-sm text-error">
                    {bookerRoleError}
                  </p>
                )}

                {data.bookerRole === "other" && (
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="book-role-other"
                      className="font-jost text-xs uppercase tracking-wider text-foreground/70"
                    >
                      How would you describe yourself?
                    </label>
                    <input
                      id="book-role-other"
                      type="text"
                      value={data.bookerRoleOther}
                      onChange={(event) => update("bookerRoleOther", event.target.value)}
                      placeholder="Venue manager, celebrant, colleague..."
                      aria-invalid={Boolean(bookerRoleOtherError && didAttemptStep1Submit)}
                      aria-describedby={bookerRoleOtherError && didAttemptStep1Submit ? "book-role-other-error" : undefined}
                      className={cn(
                        "w-full rounded-input border bg-transparent px-4 py-3 font-sans text-foreground placeholder:text-foreground/60 focus:outline-none transition-colors",
                        bookerRoleOtherError && didAttemptStep1Submit
                          ? "border-accent focus:border-accent"
                          : "border-foreground/20 focus:border-primary"
                      )}
                    />
                    {bookerRoleOtherError && didAttemptStep1Submit && (
                      <p id="book-role-other-error" role="alert" className="font-sans text-sm text-error">
                        {bookerRoleOtherError}
                      </p>
                    )}
                  </div>
                )}
              </fieldset>

              <div className="flex flex-col gap-4">
                <label className="flex cursor-pointer items-start gap-3 rounded-input border border-foreground/10 bg-cream p-4">
                  <input
                    type="checkbox"
                    checked={data.guestCount !== null}
                    onChange={(e) => handleGuestCountIncludeChange(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-foreground/20 accent-primary"
                  />
                  <span className="font-sans text-sm leading-relaxed text-foreground/70">
                    I have an approximate guest count.
                  </span>
                </label>
                {data.guestCount !== null && (
                  <GuestSlider
                    optional
                    value={data.guestCount}
                    onChange={handleGuestCountChange}
                  />
                )}
              </div>

              <DetailSlider
                id="book-performance-minutes"
                label="Performance length"
                value={data.performanceMinutes}
                min={30}
                max={180}
                step={15}
                displayValue={`${data.performanceMinutes} min`}
                minLabel="30 min"
                maxLabel="3 hours"
                onChange={(v) => update("performanceMinutes", v)}
              />

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="book-message"
                  className="font-jost text-xs uppercase tracking-wider text-foreground/70"
                >
                  Your message
                </label>
                <textarea
                  id="book-message"
                  rows={5}
                  value={data.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder={personaCopy.placeholder}
                  className="bg-transparent border border-foreground/20 rounded-input px-4 py-3 font-sans text-foreground placeholder:text-foreground/60 focus:outline-none focus:border-primary transition-colors resize-none w-full"
                />
              </div>
            </div>

            {status === "error" && (
              <p role="alert" className="font-sans text-sm text-error">
                Something went wrong. Please try again or email directly.
              </p>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={goBack}
                disabled={status === "submitting"}
                className="rounded-full font-semibold px-6 py-4 border border-foreground/20 text-foreground/60 hover:border-foreground/40 transition-colors disabled:opacity-40"
              >
                ← Back
              </button>
              <button
                type="submit"
                aria-disabled={!isStep1Valid || status === "submitting"}
                className={cn(
                  "flex-1 rounded-full px-8 py-4 font-semibold transition-all duration-300",
                  isStep1Valid && status !== "submitting"
                    ? "bg-primary text-on-dark hover:bg-primary/90"
                    : "cursor-not-allowed bg-foreground/10 text-foreground/30"
                )}
              >
                {status === "submitting" ? "Sending..." : "Send inquiry"}
              </button>
            </div>
          </div>
        )}
      </div>
      </form>
    </div>
  );
}

interface DetailSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  minLabel: string;
  maxLabel: string;
  onChange: (value: number) => void;
}

function DetailSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  displayValue,
  minLabel,
  maxLabel,
  onChange,
}: DetailSliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex w-full flex-col gap-4">
      <label
        htmlFor={id}
        className="font-jost text-xs uppercase tracking-wider text-foreground/70"
      >
        {label} <span className="normal-case tracking-normal text-foreground/60">(optional)</span>
      </label>

      <div className="relative pt-6 pb-2">
        <div
          className="pointer-events-none absolute top-0 min-w-16 -translate-x-1/2 rounded-input border border-foreground/10 bg-background px-3 py-1 text-center font-sans text-sm font-medium text-foreground shadow-card"
          style={{ left: `${percent}%` }}
        >
          {displayValue}
        </div>

        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={`${value} minutes`}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="guest-slider-range h-6 w-full cursor-pointer appearance-none rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <div className="mt-2 flex justify-between font-sans text-xs text-foreground/60">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
    </div>
  );
}
