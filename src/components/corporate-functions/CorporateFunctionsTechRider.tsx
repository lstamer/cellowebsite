"use client";

import { useRef } from "react";
import { Cable, Clock, FileCheck2, Plug, Ruler, Shirt, SlidersHorizontal, TimerReset } from "lucide-react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import riderContent from "@/content/corporate-functions-tech-rider.json";
import { cn } from "@/lib/utils";
import {
  featureItemBodyClass,
  featureItemTitleClass,
} from "@/lib/typography-classes";

const riderIcons = {
  Power: Plug,
  Footprint: Ruler,
  Amplification: Cable,
  "Sound check": SlidersHorizontal,
  "Load-in/out": TimerReset,
  Insurance: FileCheck2,
  Attire: Shirt,
  Integration: Clock,
} as const;

const riderItems = riderContent.items.map((item) => ({
  ...item,
  icon: riderIcons[item.term as keyof typeof riderIcons],
}));

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
      surface="dark"
      className="text-on-dark"
    >
      <div className="corp-rider-intro gsap-reveal grid gap-8 lg:grid-cols-[0.86fr_1fr] lg:items-end">
        <SectionHeader
          label={riderContent.sectionLabel}
          heading={riderContent.heading}
          alignment="left"
          className="!mb-0"
          labelClassName="border-accent text-on-dark/70"
          headingClassName="text-on-dark"
        />
        <p className="max-w-2xl font-sans text-lg leading-relaxed text-on-dark/70 text-pretty md:text-xl lg:justify-self-end">
          {riderContent.intro}
        </p>
      </div>

      <ul role="list" className="m-0 mt-14 border-b border-on-dark/15 p-0 md:mt-16">
        {riderItems.map((item) => (
          <RiderRow key={item.term} item={item} />
        ))}
      </ul>

      <div className="corp-rider-row gsap-reveal mt-10 flex flex-col items-start gap-5 border-t border-on-dark/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl font-sans text-base leading-relaxed text-on-dark/70 text-pretty">
          {riderContent.supportNote}
        </p>
        <Button
          href={riderContent.downloadHref}
          download
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          size="md"
          className="w-full sm:w-auto"
        >
          {riderContent.downloadLabel}
        </Button>
      </div>
    </SectionWrapper>
  );
}
