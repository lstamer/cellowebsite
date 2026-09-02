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
    title: "Arrival and seamless setup",
    description:
      "I arrive early, set up discreetly, and slip out at the end without disrupting the flow of your evening.",
    icon: PackageCheck,
  },
  {
    title: "Sound and volume adjusted to the guests",
    description:
      "I'm constantly scanning the room and seeing what guests respond to. I balance the sounds so they can easily converse over the music while clearly contributing to the atmosphere of the event.",
    icon: Volume2,
  },
  {
    title: "Nothing left to chance",
    description:
      "Spare strings, a second bow, backup gear in the car. I've never missed an event, and I plan every one so a hiccup never becomes your problem.",
    icon: ShieldCheck,
  },
  {
    title: "Repertoire and special requests",
    description:
      "From classical to contemporary, I create a set list that makes your big day flow while seamlessly weaving in any special requests you may have.",
    icon: Handshake,
  },
  {
    title: "Self-contained and adaptable",
    description:
      "A chair and a bit of floor, that's it. I handled my own setup entirely with no staging, rigging, or rearranging of your home or venue needed.",
    icon: Ruler,
  },
  {
    title: "Structuring key moments",
    description:
      "The music is planned around the trajectory of the event: arrivals, speeches, toasts, all considered so the music complements them instead of clashing.",
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
