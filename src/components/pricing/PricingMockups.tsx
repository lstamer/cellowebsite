"use client";

import type { ComponentType } from "react";
import Image from "next/image";
import {
  AudioLines,
  Clock3,
  Gift,
  MapPinned,
  MessageCircleMore,
  Music4,
  Sparkles,
} from "lucide-react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { cn } from "@/lib/utils";

type PackageFeature = {
  icon: ComponentType<{ className?: string }>;
  label: string;
};

type PricingPackage = {
  id: string;
  packageLabel: string;
  badge?: string;
  name: string;
  price: string;
  description: string;
  features: PackageFeature[];
  bestFor: string;
  visual: "photo" | "cello";
  imageClassName?: string;
};

const packages: PricingPackage[] = [
  {
    id: "essential",
    packageLabel: "Package 01",
    name: "The Essential",
    price: "R4,500",
    description: "Focused live cello for the key ceremonial moments, handled with calm precision and no unnecessary extras.",
    features: [
      { icon: Clock3, label: "1 hour of playing for one beautifully defined event window." },
      { icon: AudioLines, label: "Acoustic-only setup for a natural, intimate sound." },
      { icon: Music4, label: "Curated repertoire selected from existing performance pieces." },
      { icon: MapPinned, label: "Travel within 30km of Cape Town included." },
      { icon: MessageCircleMore, label: "Planning and coordination via WhatsApp and email." },
    ],
    bestFor:
      "Ceremonies, elopements, vow renewals, and events where you want one polished live-music moment without all-day coverage.",
    visual: "photo",
    imageClassName: "object-[76%_34%] scale-[1.08]",
  },
  {
    id: "signature",
    packageLabel: "Package 02",
    badge: "Most chosen",
    name: "The Signature",
    price: "R8,500",
    description: "A fuller music journey for clients who want the ceremony to flow naturally into the celebration that follows.",
    features: [
      { icon: Clock3, label: "2 hours of performance split across up to 2 event moments." },
      { icon: AudioLines, label: "Microphone and amplification available for larger or outdoor venues." },
      { icon: Music4, label: "Curated setlist with 2 custom song requests." },
      { icon: MapPinned, label: "Travel anywhere in the Western Cape." },
      { icon: MessageCircleMore, label: "30-minute planning call with priority WhatsApp coordination." },
      { icon: Gift, label: "Post-event audio recording of selected songs." },
    ],
    bestFor:
      "Ceremony plus cocktails, private celebrations with multiple phases, and venues that need stronger planning and audio support.",
    visual: "photo",
    imageClassName: "object-[76%_34%] scale-[1.08]",
  },
  {
    id: "concierge",
    packageLabel: "Package 03",
    name: "Concierge",
    price: "R15,000",
    description: "A bespoke, high-touch booking for luxury events, destination weddings, and clients who want music woven through the day.",
    features: [
      { icon: Clock3, label: "3+ hours of live performance with venue movement and surprise moments." },
      { icon: AudioLines, label: "Full PA integration and sound engineer coordination." },
      { icon: Sparkles, label: "Tailored setlist with custom arrangements for signature songs." },
      { icon: MapPinned, label: "Available anywhere in South Africa." },
      { icon: MessageCircleMore, label: "In-person consultation, venue walkthrough, and priority coordination." },
      { icon: Gift, label: "Studio recording of one signature song plus a post-event audio mix." },
    ],
    bestFor:
      "Destination weddings, luxury celebrations, and complex event timelines where the music needs to feel fully bespoke from first arrival to final toast.",
    visual: "cello",
  },
];

function DetailIcon({ icon: Icon }: { icon: PackageFeature["icon"] }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-foreground text-on-dark">
      <Icon className="h-[1.125rem] w-[1.125rem]" />
    </div>
  );
}

function MetaLine({ pkg }: { pkg: PricingPackage }) {
  if (pkg.badge) {
    return (
      <div className="flex items-center gap-4">
        <span className="rounded-full border border-accent/30 bg-foreground px-[1.1em] py-[0.45em] font-jost text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-on-dark">
          {pkg.badge}
        </span>
        <div className="h-px flex-1 bg-accent/60" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="font-jost text-[0.76rem] font-semibold uppercase tracking-[0.28em] text-foreground/70">
        {pkg.packageLabel}
      </span>
      <div className="h-px flex-1 bg-accent/60" />
    </div>
  );
}

function ConciergeCello() {
  return (
    <div className="relative h-full min-h-[36rem] w-full">
      <svg
        viewBox="0 0 560 920"
        className="absolute inset-0 h-full w-full text-foreground"
        aria-hidden
      >
        <defs>
          <linearGradient id="celloBody" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="color-mix(in srgb, var(--color-foreground) 90%, white)" />
            <stop offset="100%" stopColor="color-mix(in srgb, var(--color-foreground) 96%, black)" />
          </linearGradient>
        </defs>
        <ellipse cx="280" cy="465" rx="118" ry="265" fill="url(#celloBody)" />
        <rect x="263" y="138" width="34" height="398" rx="16" fill="color-mix(in srgb, var(--color-foreground) 92%, black)" />
        <rect x="240" y="96" width="80" height="54" rx="26" fill="color-mix(in srgb, var(--color-foreground) 88%, white)" />
        <rect x="221" y="526" width="118" height="48" rx="18" fill="color-mix(in srgb, var(--color-background) 84%, var(--color-accent))" />
        <rect x="250" y="564" width="9" height="182" rx="4" fill="color-mix(in srgb, var(--color-foreground) 92%, black)" />
        <rect x="272" y="564" width="7" height="182" rx="4" fill="var(--color-on-dark)" />
        <rect x="287" y="564" width="7" height="182" rx="4" fill="var(--color-on-dark)" />
        <rect x="301" y="564" width="9" height="182" rx="4" fill="color-mix(in srgb, var(--color-foreground) 92%, black)" />
        <path
          d="M208 432c-34 10-44 44-22 86c9 17 9 40-1 55"
          stroke="var(--color-on-dark)"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M352 432c34 10 44 44 22 86c-9 17-9 40 1 55"
          stroke="var(--color-on-dark)"
          strokeWidth="20"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M188 424c22 0 42 12 48 28"
          stroke="color-mix(in srgb, var(--color-foreground) 92%, black)"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M372 424c-22 0-42 12-48 28"
          stroke="color-mix(in srgb, var(--color-foreground) 92%, black)"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-x-[17%] bottom-[4%] h-px bg-accent/50" />
    </div>
  );
}

function PackageArtboard({ pkg }: { pkg: PricingPackage }) {
  return (
    <article
      id={pkg.id}
      className="relative aspect-[4/5] w-full overflow-hidden border border-foreground/10 bg-background shadow-card"
    >
      <div className="grid h-full grid-cols-1 md:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-between px-[6.5%] py-[6.5%]">
          <div className="rounded-[2rem] bg-foreground px-[7%] py-[7.5%] text-on-dark shadow-card">
            <p className="font-jost text-[0.76rem] font-semibold uppercase tracking-[0.24em] text-on-dark/55">
              {pkg.packageLabel}
            </p>
            <h2 className="mt-5 font-display text-[clamp(2.8rem,4.2vw,4.4rem)] font-semibold leading-[0.92] tracking-[-0.05em] text-balance text-on-dark">
              {pkg.name}
            </h2>
            <div className="mt-4 h-[0.1875rem] w-20 rounded-full bg-accent" />
            <p className="mt-6 font-display text-[2.35rem] font-semibold leading-none tracking-[-0.04em] text-on-dark">
              {pkg.price}
            </p>
            <p className="mt-5 max-w-[30rem] font-sans text-[1.02rem] leading-relaxed text-on-dark/72">
              {pkg.description}
            </p>

            <div className="mt-8 space-y-3.5">
              {pkg.features.map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-start gap-4 rounded-[1.3rem] bg-background px-4 py-3.5 text-foreground"
                >
                  <DetailIcon icon={feature.icon} />
                  <p className="pt-0.5 font-sans text-[0.98rem] leading-relaxed text-foreground/85">{feature.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-[1.8rem] border border-foreground/12 bg-background px-[7%] py-[6%]">
            <p className="font-jost text-[0.78rem] font-semibold uppercase tracking-[0.24em] text-foreground/40">
              Best for
            </p>
            <p className="mt-3 font-sans text-[1rem] leading-relaxed text-foreground/78">{pkg.bestFor}</p>
          </div>
        </div>

        <div className="relative min-h-[26rem] overflow-hidden px-[7%] pb-[6.5%] pt-[6.5%]">
          <MetaLine pkg={pkg} />

          <div className="relative mt-8 h-[calc(100%-4rem)] overflow-hidden border border-foreground/10 bg-background">
            <div className="absolute inset-x-[8%] top-[5%] h-28 rounded-full bg-accent/10 blur-3xl" />

            {pkg.visual === "photo" ? (
              <div className="absolute inset-0">
                <Image
                  src="/images/pricing-reference.png"
                  alt="Cellist in a cream suit performing"
                  fill
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className={cn("object-cover object-center saturate-[0.82] contrast-[1.05] grayscale-[0.08]", pkg.imageClassName)}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-background/15 via-transparent to-background/80" />
                <div className="absolute inset-y-0 left-0 w-[18%] bg-gradient-to-r from-background via-background/70 to-transparent" />
                <div className="absolute inset-y-0 right-0 w-[14%] bg-gradient-to-l from-background via-background/65 to-transparent" />
              </div>
            ) : (
              <div className="absolute inset-0">
                <ConciergeCello />
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-b from-transparent to-background" />
          </div>
        </div>
      </div>
    </article>
  );
}

export function PricingMockups() {
  return (
    <main className="bg-background">
      <SectionWrapper maxWidth="max-w-7xl" className="flex flex-col gap-12 md:gap-16">
        <header className="max-w-3xl">
          <p className="font-jost text-sm font-semibold uppercase tracking-[0.28em] text-foreground/40">
            Pricing mockups
          </p>
          <h1 className="mt-5 font-display text-[clamp(3rem,6vw,5.8rem)] font-semibold leading-[0.92] tracking-[-0.06em] text-foreground">
            Editorial package cards for Stamer Cello
          </h1>
          <p className="mt-5 max-w-2xl font-sans text-lg leading-relaxed text-foreground/72">
            Cream and black artboards with coral detailing, built to export cleanly for pricing presentations and
            social assets.
          </p>
        </header>

        <div className="flex flex-col gap-10 md:gap-14">
          {packages.map((pkg) => (
            <PackageArtboard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </SectionWrapper>
    </main>
  );
}
