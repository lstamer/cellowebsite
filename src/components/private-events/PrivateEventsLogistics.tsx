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
    title: "Setup & pack-down",
    description:
      "I turn up early, set up quietly, and slip out at the end — no fuss, no disruption to your evening.",
    icon: PackageCheck,
  },
  {
    title: "Sound that fits the space",
    description:
      "Acoustic in intimate rooms, discreet amplification for the bigger ones — all I need is a normal plug socket.",
    icon: Volume2,
  },
  {
    title: "Fully insured",
    description:
      "Public liability insurance as standard, so your venue and guests are covered.",
    icon: ShieldCheck,
  },
  {
    title: "Venue & supplier liaison",
    description:
      "I sort the timings directly with your venue, caterer, or host so nothing slips through the cracks.",
    icon: Handshake,
  },
  {
    title: "Hardly any space needed",
    description:
      "A chair and a bit of floor — that's it. No stage, no rigging, no rearranging the room.",
    icon: Ruler,
  },
  {
    title: "A run sheet we agree together",
    description:
      "We map out the flow of the evening beforehand, so every set lands exactly when it should.",
    icon: ListChecks,
  },
];

function LogisticsBlock({ item, idx }: { item: LogisticsItem; idx: number }) {
  const titleId = `logistics-title-${idx}`;
  const Icon = item.icon;

  return (
    <li className="logistics-card gsap-reveal">
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

export function PrivateEventsLogistics() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".logistics-intro",
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
        ".logistics-card",
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
      <div className="logistics-intro gsap-reveal">
        <SectionHeader
          label="Handled"
          heading="What I handle, so you don't have to."
          alignment="left"
          className="!mb-10 md:!mb-14"
        />
      </div>

      <ul
        role="list"
        className="m-0 grid list-none grid-cols-1 gap-x-12 gap-y-10 p-0 md:grid-cols-2 md:gap-y-12"
      >
        {logisticsItems.map((item, idx) => (
          <LogisticsBlock key={`logistics-${idx}`} item={item} idx={idx} />
        ))}
      </ul>
    </SectionWrapper>
  );
}
