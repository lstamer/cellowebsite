"use client";

import { useState, useRef, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { isValidPhoneNumber } from "libphonenumber-js";
import { cn } from "@/lib/utils";

import { EventTypeDropdown } from "@/components/booking/EventTypeDropdown";
import { CalendarPicker } from "@/components/booking/CalendarPicker";
import { LocationAutocomplete } from "@/components/booking/LocationAutocomplete";
import { PhoneInput } from "@/components/booking/PhoneInput";
import { GuestSlider } from "@/components/booking/GuestSlider";

type EventType = "wedding" | "private-event" | "corporate-event" | "fundraiser" | "something-else" | "";
type Step0Field =
  | "eventType"
  | "eventTypeOther"
  | "date"
  | "location"
  | "fullName"
  | "email"
  | "phone"
  | "whatsapp";
type Status = "idle" | "submitting" | "success" | "error";

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
  guestCount: number | null;
  performanceMinutes: number;
  message: string;
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

export function BookFlow() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<BookingData>({
    eventType: "",
    eventTypeOther: "",
    date: "",
    dateUnsure: false,
    location: "",
    fullName: "",
    email: "",
    phone: "",
    whatsappSameAsPhone: true,
    whatsapp: "",
    guestCount: null,
    performanceMinutes: 60,
    message: "",
  });
  const [touchedFields, setTouchedFields] = useState<Partial<Record<Step0Field, boolean>>>({});
  const [didAttemptStep0Submit, setDidAttemptStep0Submit] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const lastGuestCountRef = useRef(50);

  // Animate step in on mount
  useGSAP(() => {
    if (!stepRef.current) return;
    gsap.fromTo(
      stepRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }
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

  function goNext() {
    animateOut(() => setStep((s) => s + 1));
  }

  function goBack() {
    animateOut(() => setStep((s) => s - 1));
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
    phone: trimmedPhone && !phoneIsValid ? "Enter a valid phone number." : "",
    whatsapp:
      !data.whatsappSameAsPhone && trimmedWhatsapp && !whatsappIsValid
        ? "Enter a valid WhatsApp number."
        : "",
  };

  const isStep0Valid = Object.values(step0Errors).every((error) => error === "");
  const shouldShowError = (field: Step0Field) =>
    Boolean(step0Errors[field]) && (didAttemptStep0Submit || touchedFields[field]);

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

  function getEventLabel() {
    if (data.eventType === "something-else") return data.eventTypeOther.trim() || "Other event";
    if (!data.eventType) return "Event inquiry";
    return data.eventType
      .split("-")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  }

  function splitName(fullName: string) {
    const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
    };
  }

  function buildMessage() {
    const whatsappNumber = data.whatsappSameAsPhone
      ? data.phone || "Same as phone"
      : data.whatsapp || "Not provided";

    return [
      `Event type: ${getEventLabel()}`,
      `Date: ${data.dateUnsure ? "Flexible / TBD" : data.date}`,
      `Location: ${data.location}`,
      `Phone: ${data.phone || "Not provided"}`,
      `WhatsApp: ${whatsappNumber}`,
      `Guest count: ${
        data.guestCount === null
          ? "Not specified"
          : data.guestCount >= 200
            ? "200+"
            : data.guestCount
      }`,
      `Performance length: ${data.performanceMinutes} minutes`,
      "",
      "Message:",
      data.message.trim() || "Not provided",
    ].join("\n");
  }

  async function handleSubmit() {
    setStatus("submitting");

    const { firstName, lastName } = splitName(data.fullName);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: data.email,
          phone: data.phone,
          inquiryType: data.eventType === "something-else" ? "other" : data.eventType,
          message: buildMessage(),
        }),
      });

      if (!res.ok) throw new Error("Request failed");
      animateOut(() => setStatus("success"));
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-primary/10 bg-primary/5 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <h3 className="font-display text-3xl font-semibold text-foreground">
            Message received
          </h3>
          <p className="mt-2 max-w-sm font-sans text-foreground/60">
            Thank you, {splitName(data.fullName).firstName}. I&apos;ll be in touch shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-12">
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
              <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
                Step 1 of 2
              </p>
              <h3 className="font-display text-3xl font-semibold text-foreground">
                The essentials.
              </h3>
              <p className="mt-2 font-sans text-foreground/60">
                Share the basics so I can understand the event and reply with
                the right next step.
              </p>
            </div>

            <div className="flex flex-col gap-6">
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

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Full name
                </label>
                <input
                  type="text"
                  value={data.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  onBlur={() => markTouched("fullName")}
                  placeholder="Yo-Yo Ma"
                  aria-invalid={shouldShowError("fullName")}
                  className={cn(
                    "bg-transparent border rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none transition-colors w-full",
                    shouldShowError("fullName")
                      ? "border-accent text-foreground focus:border-accent"
                      : "border-foreground/20 focus:border-primary"
                  )}
                />
                {shouldShowError("fullName") && (
                  <p className="font-sans text-sm text-accent">{step0Errors.fullName}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Email
                </label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => update("email", e.target.value)}
                  onBlur={() => markTouched("email")}
                  placeholder="you@example.com"
                  aria-invalid={shouldShowError("email")}
                  className={cn(
                    "bg-transparent border rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none transition-colors w-full",
                    shouldShowError("email")
                      ? "border-accent text-foreground focus:border-accent"
                      : "border-foreground/20 focus:border-primary"
                  )}
                />
                {shouldShowError("email") && (
                  <p className="font-sans text-sm text-accent">{step0Errors.email}</p>
                )}
              </div>

              <PhoneInput 
                value={data.phone}
                onChange={(v) => update("phone", v)}
                onBlur={() => markTouched("phone")}
                error={shouldShowError("phone") ? step0Errors.phone : undefined}
              />

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-foreground/10 bg-foreground/5 p-4">
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
            </div>

            <button
              onClick={handleStep0Continue}
              aria-disabled={!isStep0Valid}
              className={cn(
                "mt-4 w-full rounded-full font-semibold px-8 py-4 transition-all duration-300",
                isStep0Valid
                  ? "bg-primary text-background hover:bg-primary/90 cursor-pointer"
                  : "bg-foreground/10 text-foreground/30 cursor-not-allowed"
              )}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 1: Optional details */}
        {step === 1 && (
          <div className="flex flex-col gap-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
                Step 2 of 2
              </p>
              <h3 className="font-display text-3xl font-semibold text-foreground">
                A few more details.
              </h3>
              <p className="mt-2 font-sans text-foreground/60">
                These help shape the reply. Feel free to skip anything
                you don&apos;t know yet.
              </p>
            </div>

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-foreground/10 bg-foreground/5 p-4">
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
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Your message
                </label>
                <textarea
                  rows={5}
                  value={data.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="We want cello as guests arrive and at cocktail hour. The dress code is all white. There will be some speeches in between. A sound technician will be present. We want a mix of classical and modern music. My daughter loves Robbie Williams. "
                  className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors resize-none w-full"
                />
              </div>
            </div>

            {status === "error" && (
              <p className="font-sans text-sm text-accent">
                Something went wrong. Please try again or email directly.
              </p>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={goBack}
                disabled={status === "submitting"}
                className="rounded-full font-semibold px-6 py-4 border border-foreground/20 text-foreground/60 hover:border-foreground/40 transition-colors disabled:opacity-40"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={status === "submitting"}
                className="flex-1 rounded-full bg-primary px-8 py-4 font-semibold text-background transition-all duration-300 hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-foreground/10 disabled:text-foreground/30"
              >
                {status === "submitting" ? "Sending..." : "Send inquiry"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DetailSliderProps {
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
      <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
        {label} <span className="normal-case tracking-normal text-foreground/30">(optional)</span>
      </label>

      <div className="relative pt-6 pb-2">
        <div
          className="pointer-events-none absolute top-0 min-w-16 -translate-x-1/2 rounded-md border border-foreground/10 bg-background/90 px-3 py-1 text-center font-sans text-sm font-medium text-foreground shadow-card backdrop-blur-sm"
          style={{ left: `${percent}%` }}
        >
          {displayValue}
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="guest-slider-range h-2 w-full cursor-pointer appearance-none rounded-full bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <div className="mt-2 flex justify-between font-sans text-xs text-foreground/50">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
    </div>
  );
}
