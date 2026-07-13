"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  PackageCheck,
  Volume2,
  ShieldCheck,
  Handshake,
  Ruler,
  ListChecks,
} from "lucide-react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import {
  featureItemBodyClass,
  featureItemTitleClass,
} from "@/lib/typography-classes";


interface LogisticsItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

const logisticsItems: LogisticsItem[] = [
  {
    title: "Self-contained setup & quiet load-in",
    description:
      "I arrive early, keep the movement discreet, and pack down on my own — without pulling your team away from guests.",
    icon: PackageCheck,
  },
  {
    title: "Works around your run-of-show",
    description:
      "Arrivals, awards, dinner, speeches, and handovers are agreed up front, so the music carries the flow rather than fighting it.",
    icon: Volume2,
  },
  {
    title: "Public liability cover",
    description:
      "Insurance is in place, with a certificate on request for venues, hotels, and corporate procurement.",
    icon: ShieldCheck,
  },
  {
    title: "Venue, AV & event-team liaison",
    description:
      "I deal directly with your venue manager, planner, DJ, MC, or front-of-house technician — so you do not have to relay it.",
    icon: Handshake,
  },
  {
    title: "Minimal space needed",
    description:
      "A compact footprint keeps your sightlines, service routes, and floor plans exactly as you drew them.",
    icon: Ruler,
  },
  {
    title: "Agreed cue sheet",
    description:
      "We map the key moments before the night, so entrances, holds, and transitions all land where they should.",
    icon: ListChecks,
  },
];

function LogisticsBlock({ item, idx }: { item: LogisticsItem; idx: number }) {
  const titleId = `corp-logistics-title-${idx}`;
  const Icon = item.icon;

  return (
    <li className="corp-logistics-card gsap-reveal">
      <article
        aria-labelledby={titleId}
        className="flex gap-5 text-left"
      >
        <div
          className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-none bg-foreground text-on-dark"
          aria-hidden
        >
          <Icon className="h-[20px] w-[20px]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className={featureItemTitleClass}>
            {item.title}
          </h3>
          <p className={cn(featureItemBodyClass, "mt-2")}>{item.description}</p>
        </div>
      </article>
    </li>
  );
}

export function CorporateFunctionsLogistics() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".corp-logistics-intro",
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
        ".corp-logistics-card",
        { y: 32, autoAlpha: 0 },
        {
          scrollTrigger: { trigger: containerRef.current, start: "top 75%", once: true },
          y: 0,
          autoAlpha: 1,
          duration: 0.75,
          stagger: { each: 0.08, from: "start" },
          ease: "power3.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper
      id="logistics"
      ref={containerRef}
      maxWidth="max-w-7xl"
      className="bg-background"
    >
      <div className="corp-logistics-intro gsap-reveal">
        <SectionHeader
          label="Handled"
          heading="What I take off your plate."
          alignment="left"
          className="!mb-10 md:!mb-14"
        />
      </div>

      <ul
        role="list"
        className="m-0 grid list-none grid-cols-1 gap-x-12 gap-y-10 p-0 md:grid-cols-2 md:gap-y-12"
      >
        {logisticsItems.map((item, idx) => (
          <LogisticsBlock key={`corp-logistics-${idx}`} item={item} idx={idx} />
        ))}
      </ul>
    </SectionWrapper>
  );
}
