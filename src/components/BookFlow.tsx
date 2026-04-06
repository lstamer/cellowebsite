"use client";

import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import clsx from "clsx";
import { CalEmbed } from "@/components/CalEmbed";

type EventType = "wedding" | "private-event" | "corporate-event" | "fundraiser" | "other" | "";

interface BookingData {
  // Step 1: Essentials
  eventType: EventType;
  location: string;
  date: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // Step 2: Optional
  guestCount: string;
  amplification: string;
  theme: string;
  packageInterest: string;
  notes: string;
}

const EVENT_OPTIONS: { value: EventType; label: string }[] = [
  { value: "wedding", label: "Wedding" },
  { value: "private-event", label: "Private event" },
  { value: "corporate-event", label: "Corporate event" },
  { value: "fundraiser", label: "Fundraiser" },
  { value: "other", label: "Other" },
];

export function BookFlow({ calLink }: { calLink: string }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BookingData>({
    eventType: "",
    location: "",
    date: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    guestCount: "",
    amplification: "",
    theme: "",
    packageInterest: "",
    notes: "",
  });

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

  function update(field: keyof BookingData, value: string) {
    setData((d) => ({ ...d, [field]: value }));
  }

  const isStep0Valid =
    data.eventType !== "" &&
    data.location.trim() !== "" &&
    data.date.trim() !== "" &&
    data.firstName.trim() !== "" &&
    data.email.trim() !== "" &&
    data.email.includes("@");

  const buildCalConfig = () => {
    return {
      name: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      "metadata[phone]": data.phone,
      "metadata[location]": data.location,
      "metadata[eventType]": data.eventType,
      "metadata[date]": data.date,
      "metadata[guestCount]": data.guestCount,
      "metadata[amplification]": data.amplification,
      "metadata[theme]": data.theme,
      "metadata[packageInterest]": data.packageInterest,
      "metadata[notes]": data.notes,
    };
  };

  return (
    <div ref={containerRef} className="w-full max-w-xl mx-auto">
      {/* Step indicator */}
      {step < 2 && (
        <div className="flex items-center gap-2 mb-12">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={clsx(
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

            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                Event Type
              </label>
              <div className="flex flex-wrap gap-2">
                {EVENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => update("eventType", opt.value)}
                    className={clsx(
                      "px-4 py-2 rounded-full border text-sm font-sans font-medium transition-colors",
                      data.eventType === opt.value
                        ? "border-primary bg-primary text-background"
                        : "border-foreground/20 text-foreground/70 hover:border-foreground/40"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Date(s)
                </label>
                <input
                  type="text"
                  value={data.date}
                  onChange={(e) => update("date", e.target.value)}
                  placeholder="e.g. Oct 14, 2026"
                  className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Location / Venue
                </label>
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="City or Venue"
                  className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  First name
                </label>
                <input
                  type="text"
                  value={data.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="Yo-Yo"
                  className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Last name
                </label>
                <input
                  type="text"
                  value={data.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Ma"
                  className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Email
                </label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="you@example.com"
                  className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Phone
                </label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="(555) 000-0000"
                  className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <button
              onClick={goNext}
              disabled={!isStep0Valid}
              className={clsx(
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Guest Count
                </label>
                <input
                  type="text"
                  value={data.guestCount}
                  onChange={(e) => update("guestCount", e.target.value)}
                  placeholder="e.g. 150"
                  className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Amplification Needed?
                </label>
                <select
                  value={data.amplification}
                  onChange={(e) => update("amplification", e.target.value)}
                  className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                  <option value="" disabled hidden>Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Not sure">Not sure yet</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Theme / Style
                </label>
                <input
                  type="text"
                  value={data.theme}
                  onChange={(e) => update("theme", e.target.value)}
                  placeholder="e.g. Black tie, rustic"
                  className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Package Interest
                </label>
                <input
                  type="text"
                  value={data.packageInterest}
                  onChange={(e) => update("packageInterest", e.target.value)}
                  placeholder="e.g. Ceremony + Cocktail"
                  className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                Extra Notes
              </label>
              <textarea
                rows={3}
                value={data.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Any other details you want to share upfront?"
                className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors resize-none"
              />
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
