"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ContactPreference } from "@/components/BookFlow";

interface BookingSuccessProps {
  firstName: string;
  contactPreference?: ContactPreference;
}

const CHANNEL_COPY: Record<ContactPreference, { reach: string; artifact: string }> = {
  whatsapp: { reach: "via WhatsApp", artifact: "A WhatsApp message" },
  email: { reach: "via email", artifact: "An email" },
  either: { reach: "via WhatsApp or email", artifact: "A message" },
};

export function BookingSuccess({ firstName, contactPreference = "whatsapp" }: BookingSuccessProps) {
  const channel = CHANNEL_COPY[contactPreference];
  const nextSteps = [
    `${channel.artifact} confirming availability for your date.`,
    "A tailored quote and package recommendation.",
    "A short call (optional) to lock in the details.",
  ];
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const els = containerRef.current?.querySelectorAll(".reveal-item");
      if (!els?.length) return;
      gsap.fromTo(
        els,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.1, ease: "power3.out" }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto pt-4 pb-12">
      {/* Eyebrow */}
      <p className="reveal-item font-jost text-xs uppercase tracking-widest text-accent-ink mb-5">
        Inquiry received
      </p>

      {/* Headline */}
      <h2 className="reveal-item font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
        Thanks, {firstName}.
      </h2>

      {/* Reassurance */}
      <p className="reveal-item mt-5 font-sans text-lg leading-relaxed text-foreground/60 max-w-lg">
        I will reach out personally {channel.reach} — usually within 24 hours
        on weekdays.
      </p>

      {/* Next steps */}
      <div className="reveal-item mt-10">
        <p className="font-jost text-xs uppercase tracking-widest text-foreground/70 mb-5">
          What happens next
        </p>
        <ol className="flex flex-col gap-4">
          {nextSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full border border-primary/20 font-jost text-xs font-medium text-primary">
                {i + 1}
              </span>
              <span className="font-sans text-base leading-relaxed text-foreground/70 pt-0.5">
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* CTAs */}
      <div className="reveal-item mt-12 flex flex-wrap gap-3">
        <Link
          href="/"
          className={cn(
            "inline-flex items-center justify-center rounded-full font-semibold transition-colors duration-300",
            "bg-primary text-on-dark hover:bg-primary/90",
            "text-base px-[1.75em] py-[0.875em]"
          )}
        >
          Back to site
        </Link>
        <Link
          href="/services/weddings"
          className={cn(
            "inline-flex items-center justify-center rounded-full font-semibold transition-colors duration-300",
            "border border-foreground/20 text-foreground/70 hover:border-foreground/40 hover:text-foreground",
            "text-base px-[1.75em] py-[0.875em]"
          )}
        >
          Explore wedding services
        </Link>
      </div>
    </div>
  );
}
