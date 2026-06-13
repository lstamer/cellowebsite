"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Handshake,
  ListChecks,
  MapPinned,
  Music2,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
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
    title: "Ceremony-ready setup",
    description:
      "I arrive early, set up quietly, and make sure the cello is ready before your guests take their seats.",
    icon: PackageCheck,
  },
  {
    title: "Music for each moment",
    description:
      "Aisle entrance, signing, exit, drinks reception, and wedding breakfast are shaped around you and your guests.",
    icon: Music2,
  },
  {
    title: "Fully insured",
    description:
      "Public liability insurance is included as standard, so your venue has what it needs ahead of the wedding.",
    icon: ShieldCheck,
  },
  {
    title: "Venue & supplier liaison",
    description:
      "I coordinate with your venue, planner, celebrant, or photographer so the music fits the running order.",
    icon: Handshake,
  },
  {
    title: "Minimal space needed",
    description:
      "Just a chair and a compact performance space; aisle-side, outdoors, or tucked neatly into the reception.",
    icon: MapPinned,
  },
  {
    title: "A planned wedding run sheet",
    description:
      "We confirm entrances, signing music, exits, and reception sets in advance, so no one is guessing on the day.",
    icon: ListChecks,
  },
];

function LogisticsBlock({ item, idx }: { item: LogisticsItem; idx: number }) {
  const titleId = `wedding-logistics-title-${idx}`;
  const Icon = item.icon;

  return (
    <li className="wedding-logistics-card gsap-reveal outline-none">
      <article
        tabIndex={0}
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

export function WeddingLogistics() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".wedding-logistics-intro",
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
        ".wedding-logistics-card",
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
      className="bg-cream"
    >
      <div className="wedding-logistics-intro gsap-reveal">
        <SectionHeader
          label="Handled"
          heading="What I handle, so you can stay in the moment."
          alignment="left"
          className="!mb-10 md:!mb-14"
        />
      </div>

      <ul
        role="list"
        className="m-0 grid list-none grid-cols-1 gap-x-12 gap-y-10 p-0 md:grid-cols-2 md:gap-y-12"
      >
        {logisticsItems.map((item, idx) => (
          <LogisticsBlock key={`wedding-logistics-${idx}`} item={item} idx={idx} />
        ))}
      </ul>
    </SectionWrapper>
  );
}
