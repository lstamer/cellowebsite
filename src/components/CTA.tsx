import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import { buildMailtoHref } from "@/lib/email";
import Image from "next/image";

export function CTA() {
  return (
    <SectionWrapper
      id="booking-cta"
      className="relative isolate flex min-h-[34rem] items-center overflow-hidden bg-surface-dark text-on-dark"
      maxWidth="max-w-none"
    >
      <Image
        src="/images/ig_02228f620a8885c6016a198847d6588191afe15305377b86c3.jpeg"
        alt="Close-up of a cello with warm golden light streaming through a window"
        fill
        sizes="(max-width: 48rem) 100vw, 52vw"
        className="absolute inset-0 -z-30 object-cover object-right"
      />

      <div className="pointer-events-none absolute inset-y-0 left-0 -z-20 w-[74%] bg-gradient-to-r from-surface-dark/90 via-surface-dark/60 to-surface-dark/10 md:w-[64%]" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-start">
        <p className="mb-2 font-serif text-4xl italic leading-none tracking-tight text-on-dark md:text-5xl">
          Got a date in mind?
        </p>

        <h2 className="max-w-4xl font-display text-[2.75rem] font-bold leading-[0.95] tracking-tight text-on-dark text-balance md:text-[4.5rem] lg:text-[5.25rem]">
          Add a cello
        </h2>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-on-dark/80 md:text-xl">
          Tell me about the moment you&apos;re planning, and I&apos;ll build the music around it. Popular weekends go early, so sooner is easier.
        </p>

        <div className="mt-8 flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:items-center">
          <Button href="/book" variant="primary" size="sm" className="w-full min-w-[8.5rem] sm:w-auto">
            Check my date
          </Button>
          <Button
            href={buildWhatsAppHref({ source: "cta-banner" })}
            variant="secondary"
            size="sm"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-w-[9.5rem] sm:w-auto"
          >
            WhatsApp me
          </Button>
          <Button
            href={buildMailtoHref({ source: "cta-banner" })}
            variant="secondary"
            size="sm"
            className="w-full min-w-[9.5rem] sm:w-auto"
          >
            Email me
          </Button>
        </div>
      </div>
    </SectionWrapper>
  );
}
