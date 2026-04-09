"use client";

import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { isValidPhoneNumber } from "libphonenumber-js";
import { cn } from "@/lib/utils";
import { CalEmbed } from "@/components/CalEmbed";

import { EventTypeDropdown } from "@/components/booking/EventTypeDropdown";
import { CalendarPicker } from "@/components/booking/CalendarPicker";
import { LocationAutocomplete } from "@/components/booking/LocationAutocomplete";
import { PhoneInput } from "@/components/booking/PhoneInput";
import { GuestSlider } from "@/components/booking/GuestSlider";
import { PackageCards } from "@/components/booking/PackageCards";

type EventType = "wedding" | "private-event" | "corporate-event" | "fundraiser" | "something-else" | "";
type Step0Field = "eventType" | "eventTypeOther" | "date" | "location" | "fullName" | "email" | "phone";

interface BookingData {
  eventType: EventType;
  eventTypeOther: string;
  date: string;
  dateUnsure: boolean;
  location: string;
  fullName: string;
  email: string;
  phone: string;
  guestCount: number;
  packageInterest: string;
  notes: string;
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
];

export function BookFlow({ calLink }: { calLink: string }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BookingData>({
    eventType: "",
    eventTypeOther: "",
    date: "",
    dateUnsure: false,
    location: "",
    fullName: "",
    email: "",
    phone: "",
    guestCount: 50,
    packageInterest: "",
    notes: "",
  });
  const [touchedFields, setTouchedFields] = useState<Partial<Record<Step0Field, boolean>>>({});
  const [didAttemptStep0Submit, setDidAttemptStep0Submit] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);

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
  const emailIsValid = EMAIL_REGEX.test(trimmedEmail);
  const phoneIsValid = trimmedPhone === "" || isValidPhoneNumber(trimmedPhone);

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

  const buildCalConfig = () => {
    return {
      name: data.fullName.trim(),
      email: data.email,
      "metadata[phone]": data.phone,
      "metadata[location]": data.location,
      "metadata[eventType]": data.eventType === "something-else" ? data.eventTypeOther : data.eventType,
      "metadata[date]": data.dateUnsure ? "Flexible / TBD" : data.date,
      "metadata[guestCount]": String(data.guestCount),
      "metadata[packageInterest]": data.packageInterest,
      "metadata[notes]": data.notes,
    };
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto">
      {/* Step indicator */}
      {step < 2 && (
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
      )}

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
                Just the basics so we can make our time together productive.
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
                These help tailor our conversation. Feel free to skip anything
                you don&apos;t know yet.
              </p>
            </div>

            <div className="flex flex-col gap-8">
              <GuestSlider 
                value={data.guestCount}
                onChange={(v) => update("guestCount", v)}
              />

              {data.eventType === "wedding" && (
                <div className="overflow-hidden">
                  <PackageCards 
                    value={data.packageInterest}
                    onChange={(v) => update("packageInterest", v)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Extra Notes
                </label>
                <textarea
                  rows={3}
                  value={data.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Any other details you want to share upfront?"
                  className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors resize-none w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={goBack}
                className="rounded-full font-semibold px-6 py-4 border border-foreground/20 text-foreground/60 hover:border-foreground/40 transition-colors"
              >
                ← Back
              </button>
              <div className="flex gap-2 flex-1">
                <button
                  onClick={goNext}
                  className="flex-1 rounded-full font-semibold px-4 py-4 bg-transparent border border-primary/20 text-primary hover:bg-primary/5 transition-all duration-300"
                >
                  Skip for now
                </button>
                <button
                  onClick={goNext}
                  className="flex-1 rounded-full font-semibold px-4 py-4 bg-primary text-background hover:bg-primary/90 transition-all duration-300"
                >
                  Choose a time →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Cal Embed */}
        {step === 2 && (
          <div className="flex flex-col gap-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-3xl font-semibold text-foreground">
                  Choose a time.
                </h3>
                <p className="mt-2 font-sans text-foreground/60">
                  Your details are saved. Pick a slot below for our short consult.
                </p>
              </div>
              <button
                onClick={goBack}
                className="text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary/70 transition-colors"
              >
                Edit details
              </button>
            </div>

            <div className="w-full">
              <CalEmbed calLink={calLink} config={buildCalConfig()} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
