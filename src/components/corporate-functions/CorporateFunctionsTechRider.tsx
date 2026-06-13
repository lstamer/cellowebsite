"use client";

import { useRef } from "react";
import { Cable, Clock, FileCheck2, Plug, Ruler, Shirt, SlidersHorizontal, TimerReset } from "lucide-react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import {
  featureItemBodyClass,
  featureItemTitleClass,
} from "@/lib/typography-classes";

const riderItems = [
  {
    term: "Power",
    detail: "1x standard 220V/13A outlet within roughly 3m of the performance position.",
    icon: Plug,
  },
  {
    term: "Footprint",
    detail: "Approximately 2m x 1.5m, armless chair supplied by venue, no riser required.",
    icon: Ruler,
  },
  {
    term: "Amplification",
    detail: "Acoustic for up to 80 guests; own pickup and DI/XLR balanced feed to FOH for larger rooms.",
    icon: Cable,
  },
  {
    term: "Sound check",
    detail: "30-45 minutes before doors, or at the earliest quiet window your run sheet allows.",
    icon: SlidersHorizontal,
  },
  {
    term: "Load-in/out",
    detail: "Self-managed, approximately 20 minutes each, with a discreet route preferred.",
    icon: TimerReset,
  },
  {
    term: "Insurance",
    detail: "Public liability cover in place. Certificate available on request for venue compliance.",
    icon: FileCheck2,
  },
  {
    term: "Attire",
    detail: "Black tie, business formal, or an agreed dress code to match your event standard.",
    icon: Shirt,
  },
  {
    term: "Integration",
    detail: "Can slot into MC, DJ, AV, and speech cues; can play to a click or hold for live timings.",
    icon: Clock,
  },
];

function RiderRow({ item }: { item: (typeof riderItems)[number] }) {
  const Icon = item.icon;

  return (
    <li className="corp-rider-row gsap-reveal list-none border-t border-on-dark/15">
      <div className="grid gap-4 py-6 md:grid-cols-[12rem_1fr] md:gap-8 md:py-7">
        <div className="flex items-center gap-4">
          <span
            className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-none bg-on-dark text-surface-dark"
            aria-hidden
          >
            <Icon className="h-[20px] w-[20px]" strokeWidth={1.75} />
          </span>
          <h3 className={cn(featureItemTitleClass, "text-on-dark")}>{item.term}</h3>
        </div>
        <p className={cn(featureItemBodyClass, "max-w-3xl text-on-dark/70")}>
          {item.detail}
        </p>
      </div>
    </li>
  );
}

export function CorporateFunctionsTechRider() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".corp-rider-intro",
        { y: 36, autoAlpha: 0 },
        {
          scrollTrigger: { trigger: containerRef.current, start: "top 75%", once: true },
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );

      gsap.fromTo(
        ".corp-rider-row",
        { y: 28, autoAlpha: 0 },
        {
          scrollTrigger: { trigger: containerRef.current, start: "top 70%", once: true },
          y: 0,
          autoAlpha: 1,
          duration: 0.7,
          stagger: { each: 0.07, from: "start" },
          ease: "power3.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper
      id="tech-rider"
      ref={containerRef}
      className="bg-surface-dark text-on-dark"
    >
      <div className="corp-rider-intro gsap-reveal grid gap-8 lg:grid-cols-[0.86fr_1fr] lg:items-end">
        <SectionHeader
          label="Tech Rider"
          heading="Everything your AV team needs."
          alignment="left"
          className="!mb-0"
          labelClassName="border-accent text-on-dark/70"
          headingClassName="text-on-dark"
        />
        <p className="max-w-2xl font-sans text-lg leading-relaxed text-on-dark/70 text-pretty md:text-xl lg:justify-self-end">
          Forward this to facilities, AV, or the venue. The setup is compact,
          practical, and designed to fit around the event rather than dominate it.
        </p>
      </div>

      <ul role="list" className="m-0 mt-14 border-b border-on-dark/15 p-0 md:mt-16">
        {riderItems.map((item) => (
          <RiderRow key={item.term} item={item} />
        ))}
      </ul>

      <div className="corp-rider-row gsap-reveal mt-10 flex flex-col items-start gap-5 border-l-2 border-accent pl-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl font-sans text-base leading-relaxed text-on-dark/70 text-pretty">
          Need the rider confirmed against your floor plan or run sheet? Send the
          date, venue, and schedule and I will reply with availability and setup notes.
        </p>
        <Button href="/book" variant="secondary" size="md" className="w-full sm:w-auto">
          Check availability
        </Button>
      </div>
    </SectionWrapper>
  );
}
