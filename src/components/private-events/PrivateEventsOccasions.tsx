"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";
import { Cake, Heart, Gem, Wine, Home, Flower2 } from "lucide-react";
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
    title: "Milestone birthdays",
    description:
      "A 40th, a 60th, the surprise party nobody saw coming: cello marks the moment without making it stuffy.",
    icon: Cake,
  },
  {
    title: "Anniversaries",
    description:
      "An intimate, romantic tone for the evening that's just about the two of you.",
    icon: Heart,
  },
  {
    title: "Engagement parties",
    description:
      "Music as memorable as the news you're all there to celebrate.",
    icon: Gem,
  },
  {
    title: "Dinner parties",
    description:
      "Background atmosphere that lets the conversation breathe instead of fighting it.",
    icon: Wine,
  },
  {
    title: "At-home gatherings",
    description:
      "Concert-quality cello, played in your own living room or garden.",
    icon: Home,
  },
  {
    title: "Celebrations of life",
    description:
      "A gentle, dignified presence for remembering someone with the care it deserves.",
    icon: Flower2,
    hideOnMobile: true,
  },
];

function OccasionCard({ occasion, idx }: { occasion: Occasion; idx: number }) {
  const titleId = `occasion-title-${idx}`;
  const Icon = occasion.icon;

  return (
    <li
      className={cn(
        "occasion-card gsap-reveal list-none",
        occasion.hideOnMobile && "hidden sm:list-item"
      )}
    >
      <article
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

export function PrivateEventsOccasions() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".occasions-intro",
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
        ".occasion-card",
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
      surface="cream"
    >
      <div className="occasions-intro gsap-reveal">
        <SectionHeader
          label="The occasions"
          heading="Music for the moments worth marking."
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
