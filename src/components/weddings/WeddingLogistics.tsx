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
    title: "Set up before anyone arrives",
    description:
      "I arrive early and set up quietly, so the cello is ready and waiting long before your first guest takes their seat.",
    icon: PackageCheck,
  },
  {
    title: "Music for every moment",
    description:
      "Aisle entrance, signing, exit, drinks reception, the wedding breakfast — each one shaped around you and the room it's happening in.",
    icon: Music2,
  },
  {
    title: "Nothing left to chance",
    description:
      "Spare strings, a second bow, backup equipment — it all travels with me. Twelve years in, I've never missed an event, and I'm not about to start at yours.",
    icon: ShieldCheck,
  },
  {
    title: "I'll talk to your suppliers",
    description:
      "I coordinate with your venue, planner, celebrant, or photographer directly, so the music slots into the running order without you in the middle.",
    icon: Handshake,
  },
  {
    title: "Barely any space needed",
    description:
      "Just a chair and a small corner — aisle-side, out on the lawn, or tucked neatly into the reception. I don't take over the room.",
    icon: MapPinned,
  },
  {
    title: "A run sheet we agree on",
    description:
      "We pin down entrances, signing music, exits, and reception sets in advance — so on the day, nobody is guessing what comes next.",
    icon: ListChecks,
  },
];

function LogisticsBlock({ item, idx }: { item: LogisticsItem; idx: number }) {
  const titleId = `wedding-logistics-title-${idx}`;
  const Icon = item.icon;

  return (
    <li className="wedding-logistics-card gsap-reveal">
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
      surface="cream"
    >
      <div className="wedding-logistics-intro gsap-reveal">
        <SectionHeader
          label="Handled"
          heading="The bits I quietly take care of, so you don't have to."
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
