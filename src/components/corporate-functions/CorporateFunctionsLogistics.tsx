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
    title: "Arrival & strict setup times",
    description:
      "I arrived precisely when scheduled to set up, respecting your run sheet and preventing delays later on.",
    icon: PackageCheck,
  },
  {
    title: "AV liaison & sound checks",
    description:
      "I liaise directly with your in-house AV or sound team, ensuring sound checks are completed smoothly before doors open and handovers are planned up front.",
    icon: Volume2,
  },
  {
    title: "Backed up, twice over",
    description:
      "Spare strings, a second bow, and a backup microphone travel with me to every booking. In twelve years I have never missed an event.",
    icon: ShieldCheck,
  },
  {
    title: "Dress code & presentation on-brand ",
    description:
      "I present professionally according to the type of event so the music looks as polished as it sounds.",
    icon: Handshake,
  },
  {
    title: "Admin & planning handled headache-free",
    description:
      "From onboarding to invoicing, my response times are sharp, prompt, and keep your accounts department happy.",
    icon: Ruler,
  },
  {
    title: "Run sheets & timing contingencies ",
    description:
      "I follow your run sheet to the minute but remain adaptable enough to stretch or cut music seamlessly if speeches or awards run over.",
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
