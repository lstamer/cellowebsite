"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Handshake,
  Mic2,
  PartyPopper,
  Rocket,
  Trophy,
} from "lucide-react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";

interface Occasion {
  title: string;
  description: string;
  icon: LucideIcon;
  hideOnMobile?: boolean;
}

const occasions: Occasion[] = [
  {
    title: "Awards & gala dinners",
    description:
      "Arrivals, dinner, and the moment a winner stands up — given a sense of ceremony, without making the room stiff.",
    icon: Trophy,
  },
  {
    title: "Conferences & summits",
    description:
      "A composed reset between sessions, keynote arrivals, and networking blocks, for when you need the room to settle.",
    icon: Mic2,
  },
  {
    title: "Product launches",
    description:
      "Live music that carries the reveal and makes the launch feel hosted, rather than simply scheduled.",
    icon: Rocket,
  },
  {
    title: "Client & VIP receptions",
    description:
      "A warm, low-key atmosphere for the guests, partners, and executives you most want to look after.",
    icon: Handshake,
  },
  {
    title: "Year-end celebrations",
    description:
      "A more considered welcome than the usual background playlist, before the speeches or the DJ takes over.",
    icon: PartyPopper,
  },
  {
    title: "Hotel & expo activations",
    description:
      "Compact, self-contained live cello for lounges, stands, arrivals, and the premium spaces you want to feel hosted.",
    icon: Building2,
    hideOnMobile: true,
  },
];

function OccasionCard({ occasion, idx }: { occasion: Occasion; idx: number }) {
  const titleId = `corp-occasion-title-${idx}`;
  const Icon = occasion.icon;

  return (
    <li
      className={cn(
        "corp-occasion-card gsap-reveal list-none outline-none",
        occasion.hideOnMobile && "hidden sm:list-item"
      )}
    >
      <article
        tabIndex={0}
        aria-labelledby={titleId}
        className="flex h-full flex-col gap-5 rounded-card border border-primary/10 bg-background p-7 text-left md:p-8"
      >
        <div
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-none bg-foreground text-on-dark"
          aria-hidden
        >
          <Icon className="h-[20px] w-[20px]" strokeWidth={1.75} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 id={titleId} className={featureItemTitleClass}>
            {occasion.title}
          </h3>
          <p className={cn(featureItemBodyClass, "mt-2")}>{occasion.description}</p>
        </div>
      </article>
    </li>
  );
}

export function CorporateFunctionsOccasions() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".corp-occasions-intro",
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
        ".corp-occasion-card",
        { y: 32, autoAlpha: 0 },
        {
          scrollTrigger: { trigger: containerRef.current, start: "top 75%", once: true },
          y: 0,
          autoAlpha: 1,
          duration: 0.75,
          stagger: { each: 0.1, from: "start" },
          ease: "power3.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <SectionWrapper
      id="occasions"
      ref={containerRef}
      className="bg-background"
    >
      <div className="corp-occasions-intro gsap-reveal">
        <SectionHeader
          label="Where it fits"
          heading="For the events that carry your name."
        />
      </div>

      <ul
        role="list"
        className="m-0 grid grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
      >
        {occasions.map((occasion, idx) => (
          <OccasionCard key={occasion.title} occasion={occasion} idx={idx} />
        ))}
      </ul>
    </SectionWrapper>
  );
}
