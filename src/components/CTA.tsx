import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import Image from "next/image";

export function CTA() {
  return (
    <SectionWrapper
      id="booking-cta"
      className="relative isolate flex min-h-[34rem] items-center overflow-hidden bg-surface-dark text-on-dark"
      maxWidth="max-w-none"
    >
      <Image
        src="/images/cta-image.jpeg"
        alt="Close-up of a violin with warm wood tones against a dark background"
        fill
        sizes="100vw"
        className="absolute inset-0 -z-30 object-cover object-right grayscale-[15%]"
      />

      <div className="pointer-events-none absolute inset-0 -z-20 bg-surface-dark/40" />
      <div className="pointer-events-none absolute inset-y-0 left-0 -z-20 w-[85%] bg-gradient-to-r from-surface-dark via-surface-dark/80 to-surface-dark/10 md:w-[68%]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[-3rem] -z-10 h-[12rem] bg-surface-dark/80 blur-[3rem]" />
      <div className="pointer-events-none absolute bottom-[-7rem] left-[-10rem] -z-10 h-[24rem] w-[30rem] rounded-full bg-surface-dark/80 blur-[5rem]" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-start">
        <p className="mb-2 font-serif text-4xl italic leading-none tracking-tight text-on-dark md:text-5xl">
          Got an event in mind &mdash;
        </p>

        <h2 className="max-w-4xl font-display text-[2.75rem] font-bold leading-[0.95] tracking-tight text-on-dark text-balance md:text-[4.5rem] lg:text-[5.25rem]">
          Add a cello
        </h2>

        <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed text-on-dark/80 md:text-xl">
          Tell me about the moment you&apos;re planning, and I&apos;ll help shape the music around it.
        </p>

        <div className="mt-8 flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:items-center">
          <Button href="/book" variant="primary" size="sm" className="w-full min-w-[8.5rem] sm:w-auto">
            Book a call
          </Button>
          <Button href="#contact" variant="secondary" size="sm" className="w-full min-w-[9.5rem] sm:w-auto">
            Send a message
          </Button>
        </div>
      </div>
    </SectionWrapper>
  );
}
