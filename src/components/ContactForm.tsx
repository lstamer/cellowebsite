"use client";

import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import clsx from "clsx";

type InquiryType = "lessons" | "performance" | "event" | "collaboration" | "other";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  inquiryType: InquiryType | "";
  message: string;
  phone: string;
}

const INQUIRY_OPTIONS: { value: InquiryType; label: string; description: string }[] = [
  { value: "lessons", label: "Lessons", description: "Private cello instruction" },
  { value: "performance", label: "Performance", description: "Concert or recital" },
  { value: "event", label: "Event", description: "Wedding, corporate, private event" },
  { value: "collaboration", label: "Collaboration", description: "Recording or ensemble work" },
  { value: "other", label: "Other", description: "Something else entirely" },
];

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    inquiryType: "",
    message: "",
    phone: "",
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
    if (!stepRef.current) { callback(); return; }
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

  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit() {
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Request failed");
      animateOut(() => setStatus("success"));
    } catch {
      setStatus("error");
    }
  }

  const isStep1Valid = form.firstName.trim() && form.email.trim() && form.email.includes("@");
  const isStep2Valid = form.inquiryType !== "";
  const isStep3Valid = form.message.trim().length > 10;

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="font-display text-3xl font-semibold text-foreground">
          Message received
        </h3>
        <p className="font-sans text-foreground/60 max-w-sm">
          Thank you, {form.firstName}. I&apos;ll be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-w-xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={clsx(
              "h-1 rounded-full transition-all duration-500",
              i <= step ? "bg-primary flex-[2]" : "bg-foreground/15 flex-1"
            )}
          />
        ))}
      </div>

      <div ref={stepRef}>
        {/* Step 0: Who are you */}
        {step === 0 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">Step 1 of 3</p>
              <h3 className="font-display text-3xl font-semibold text-foreground">
                Nice to meet you.
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">First name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="Yo-Yo"
                  className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">Last name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Ma"
                  className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button
              onClick={goNext}
              disabled={!isStep1Valid}
              className={clsx(
                "mt-2 rounded-full font-semibold px-8 py-4 transition-all duration-300",
                isStep1Valid
                  ? "bg-primary text-background hover:bg-primary/90 cursor-pointer"
                  : "bg-foreground/10 text-foreground/30 cursor-not-allowed"
              )}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 1: Inquiry type */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">Step 2 of 3</p>
              <h3 className="font-display text-3xl font-semibold text-foreground">
                What brings you here?
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {INQUIRY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => update("inquiryType", opt.value)}
                  className={clsx(
                    "flex items-center justify-between px-5 py-4 rounded-xl border text-left transition-all duration-200",
                    form.inquiryType === opt.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-foreground/15 hover:border-foreground/30 text-foreground/70"
                  )}
                >
                  <div>
                    <span className="font-sans font-medium block">{opt.label}</span>
                    <span className="font-sans text-sm text-foreground/50">{opt.description}</span>
                  </div>
                  <div className={clsx(
                    "w-5 h-5 rounded-full border-2 shrink-0 transition-colors duration-200",
                    form.inquiryType === opt.value ? "border-primary bg-primary" : "border-foreground/20"
                  )} />
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={goBack}
                className="rounded-full font-semibold px-6 py-4 border border-foreground/20 text-foreground/60 hover:border-foreground/40 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={goNext}
                disabled={!isStep2Valid}
                className={clsx(
                  "flex-1 rounded-full font-semibold px-8 py-4 transition-all duration-300",
                  isStep2Valid
                    ? "bg-primary text-background hover:bg-primary/90 cursor-pointer"
                    : "bg-foreground/10 text-foreground/30 cursor-not-allowed"
                )}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Message */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">Step 3 of 3</p>
              <h3 className="font-display text-3xl font-semibold text-foreground">
                Tell me more.
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">Your message</label>
              <textarea
                rows={5}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Share the details — dates, location, what you have in mind..."
                className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                Phone <span className="normal-case text-foreground/30">(optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="bg-transparent border border-foreground/20 rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            {status === "error" && (
              <p className="font-sans text-sm text-accent">
                Something went wrong. Please try again or email directly.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={goBack}
                disabled={status === "submitting"}
                className="rounded-full font-semibold px-6 py-4 border border-foreground/20 text-foreground/60 hover:border-foreground/40 transition-colors disabled:opacity-40"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isStep3Valid || status === "submitting"}
                className={clsx(
                  "flex-1 rounded-full font-semibold px-8 py-4 transition-all duration-300",
                  isStep3Valid && status !== "submitting"
                    ? "bg-primary text-background hover:bg-primary/90 cursor-pointer"
                    : "bg-foreground/10 text-foreground/30 cursor-not-allowed"
                )}
              >
                {status === "submitting" ? "Sending..." : "Send message"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
