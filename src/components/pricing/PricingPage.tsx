"use client";

import {
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import Image from "next/image";
import {
  AudioLines,
  Clock3,
  MessageCircleMore,
  MapPinned,
  Music4,
  Sparkles,
  Waves,
} from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-client";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";
import { FAQAccordion } from "@/components/ui/FAQAccordion";
import { Button } from "@/components/ui/Button";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import {
  pricingComparisonRows,
  pricingFaqs,
  pricingPackages,
  type PricingFeature,
  type PricingPackage,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

const featureIcons: Record<PricingFeature["icon"], ComponentType<{ className?: string; strokeWidth?: number }>> = {
  clock: Clock3,
  sound: AudioLines,
  music: Music4,
  map: MapPinned,
  message: MessageCircleMore,
  recording: Waves,
  sparkles: Sparkles,
};

function PricingHero() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".pricing-hero-copy",
        { y: 36, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 1,
          stagger: 0.08,
          ease: "power3.out",
        }
      );
      gsap.fromTo(
        ".pricing-hero-image",
        { autoAlpha: 0, scale: 1.04 },
        { autoAlpha: 1, scale: 1, duration: 1.2, ease: "power3.out" }
      );
    },
    { scope: sectionRef }
  );

  return (
    <SectionWrapper
      ref={sectionRef}
      maxWidth="max-w-none"
      className="px-0 py-0"
      surface="background"
    >
      <div className="grid w-full lg:min-h-[100dvh] lg:grid-cols-[62%_38%]">
        <div className="flex w-full flex-col justify-center px-section-x-sm pb-16 pt-32 md:px-section-x-md md:pb-20 md:pt-36 lg:px-section-x-lg lg:pb-24 lg:pt-40">
          <p className="pricing-hero-copy gsap-reveal mb-8 font-jost text-sm font-semibold uppercase tracking-widest text-primary">
            Packages
          </p>
          <h1 className="pricing-hero-copy gsap-reveal max-w-4xl font-serif text-[clamp(3.7rem,7.2vw,7.8rem)] italic leading-[0.88] tracking-tight text-primary text-balance">
            Choose how the room should{" "}
            <HandDrawnUnderline variant={2} underlineClassName="text-accent">
              feel.
            </HandDrawnUnderline>
          </h1>
          <p className="pricing-hero-copy gsap-reveal mt-8 max-w-2xl font-sans text-lg leading-relaxed text-foreground/80 md:text-xl">
            One focused hour. Two parts of the day. Or music that moves with the whole event. Start with the moment, then choose how far the atmosphere should travel.
          </p>
          <div className="pricing-hero-copy gsap-reveal mt-9 flex w-full flex-col items-stretch gap-4 sm:w-auto sm:flex-row sm:items-center">
            <Button href="#packages" size="lg" className="w-full sm:w-auto">
              Compare the packages
            </Button>
            <Button
              href={buildWhatsAppHref({ source: "pricing-hero" })}
              target="_blank"
              rel="noopener noreferrer"
              variant="white"
              size="lg"
              className="w-full sm:w-auto"
            >
              Tell me about your event
            </Button>
          </div>
        </div>

        <div className="pricing-hero-image gsap-reveal relative min-h-[42dvh] w-full overflow-hidden lg:min-h-0">
          <Image
            src="/images/pricing-reference.png"
            alt="Luke Stamer playing cello beneath a large tree in a cream suit"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 38vw"
            className="object-cover object-[52%_44%] grayscale-[15%]"
          />
        </div>
      </div>
    </SectionWrapper>
  );
}

function PackageFeatureRow({ feature, dark }: { feature: PricingFeature; dark: boolean }) {
  const Icon = featureIcons[feature.icon];

  return (
    <li className="pricing-feature flex gap-4 border-t border-current/10 py-5 first:border-t-0">
      <span
        className={cn(
          "flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-none",
          dark ? "bg-background text-primary" : "bg-foreground text-on-dark"
        )}
        aria-hidden
      >
        <Icon className="h-[20px] w-[20px]" strokeWidth={1.75} />
      </span>
      <div>
        <h3 className={cn(featureItemTitleClass, dark && "text-on-dark")}>{feature.title}</h3>
        <p className={cn(featureItemBodyClass, "mt-1", dark && "text-on-dark/70")}>{feature.description}</p>
      </div>
    </li>
  );
}

function PackageColumn({ pkg }: { pkg: PricingPackage }) {
  const dark = pkg.id === "signature";

  return (
    <article
      id={pkg.id}
      aria-labelledby={`${pkg.id}-title`}
      className={cn(
        "flex h-full scroll-mt-24 flex-col px-6 py-9 sm:px-8 md:px-7 lg:px-9",
        dark
          ? "bg-primary text-on-dark shadow-card md:py-12 lg:-translate-y-6"
          : "border-y border-primary/20 bg-background text-foreground",
      )}
    >
      <div className="flex items-center justify-between gap-5">
        <p className={cn("font-mono text-xs uppercase tracking-widest", dark ? "text-on-dark/60" : "text-foreground/60")}>
          Package {pkg.number}
        </p>
        {pkg.mostChosen ? (
          <p className="border-b border-accent pb-1 font-jost text-xs font-semibold uppercase tracking-widest text-on-dark">
            Most chosen
          </p>
        ) : null}
      </div>

      <h2
        id={`${pkg.id}-title`}
        className={cn("mt-8 font-serif text-5xl italic leading-none tracking-tight md:text-6xl", dark ? "text-on-dark" : "text-primary")}
      >
        {pkg.name}
      </h2>
      <p className={cn("mt-5 font-display text-3xl font-semibold tracking-tight md:text-4xl", dark ? "text-on-dark" : "text-foreground")}>
        {pkg.price}
      </p>
      <p className={cn("mt-6 min-h-[4.5rem] font-display text-xl font-semibold leading-snug tracking-tight md:text-2xl", dark ? "text-on-dark" : "text-foreground")}>
        {pkg.shortDescription}
      </p>
      <p className={cn("mt-5 min-h-[7.25rem] font-sans text-base leading-relaxed text-pretty", dark ? "text-on-dark/70" : "text-foreground/75")}>
        {pkg.positioning}
      </p>

      <ul className="mt-5">
        {pkg.features.map((feature) => (
          <PackageFeatureRow key={feature.title} feature={feature} dark={dark} />
        ))}
      </ul>

      <div className={cn("mt-auto border-t pt-7", dark ? "border-on-dark/20" : "border-primary/20")}>
        <p className={cn("font-jost text-xs font-semibold uppercase tracking-widest", dark ? "text-on-dark/60" : "text-foreground/60")}>
          Best for
        </p>
        <p className={cn("mt-3 font-sans text-base leading-relaxed", dark ? "text-on-dark/80" : "text-foreground/80")}>
          {pkg.bestFor}
        </p>
      </div>

      <Button
        href={buildWhatsAppHref({ packageName: pkg.name, source: `pricing-${pkg.id}` })}
        target="_blank"
        rel="noopener noreferrer"
        variant={dark ? "ghost" : "primary"}
        size="md"
        className="mt-8 w-full"
      >
        Ask about {pkg.name}
      </Button>
    </article>
  );
}

function PricingPackages() {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const tabIndicatorRef = useRef<HTMLSpanElement>(null);
  const tabIndicatorLabelsRef = useRef<HTMLSpanElement>(null);
  const packageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const transitionTweenRef = useRef<gsap.core.Tween | null>(null);
  const tabIndicatorTweenRef = useRef<gsap.core.Timeline | null>(null);
  const autoAdvanceRef = useRef<gsap.core.Tween | null>(null);
  const transitionFrameRef = useRef<number | null>(null);
  const hashFrameRef = useRef<number | null>(null);
  const pointerStartXRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);
  const activePackageRef = useRef(0);
  const [activePackage, setActivePackage] = useState(0);

  const clearPackageTransforms = () => {
    packageRefs.current.forEach((panel) => {
      if (panel) gsap.set(panel, { clearProps: "transform", autoAlpha: 1 });
    });
  };

  const moveTabIndicator = (index: number, immediate: boolean) => {
    const indicator = tabIndicatorRef.current;
    const labels = tabIndicatorLabelsRef.current;
    if (!indicator || !labels) return;

    tabIndicatorTweenRef.current?.kill();

    if (immediate) {
      gsap.set(indicator, { xPercent: index * 100 });
      gsap.set(labels, { xPercent: index * (-100 / pricingPackages.length) });
      return;
    }

    tabIndicatorTweenRef.current = gsap.timeline({ defaults: { duration: 0.28, ease: "power3.inOut" } });
    tabIndicatorTweenRef.current
      .to(indicator, { xPercent: index * 100, overwrite: true }, 0)
      .to(labels, { xPercent: index * (-100 / pricingPackages.length), overwrite: true }, 0);
  };

  const moveToPackage = (index: number, immediate = false) => {
    const currentIndex = activePackageRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    moveTabIndicator(index, immediate || reduceMotion || !isMobile);

    if (index === currentIndex) return;

    transitionTweenRef.current?.kill();
    if (transitionFrameRef.current !== null) {
      window.cancelAnimationFrame(transitionFrameRef.current);
      transitionFrameRef.current = null;
    }
    clearPackageTransforms();

    if (immediate || reduceMotion || !isMobile) {
      activePackageRef.current = index;
      setActivePackage(index);
      return;
    }

    const currentPanel = packageRefs.current[currentIndex];
    if (!currentPanel) return;

    const direction = index > currentIndex ? 1 : -1;

    transitionTweenRef.current = gsap.to(currentPanel, {
      xPercent: direction * -14,
      autoAlpha: 0,
      duration: 0.32,
      ease: "power2.in",
      overwrite: true,
      onComplete: () => {
        activePackageRef.current = index;
        setActivePackage(index);

        transitionFrameRef.current = window.requestAnimationFrame(() => {
          transitionFrameRef.current = null;
          const nextPanel = packageRefs.current[index];
          if (!nextPanel) return;

          transitionTweenRef.current = gsap.fromTo(
            nextPanel,
            { xPercent: direction * 14, autoAlpha: 0 },
            {
              xPercent: 0,
              autoAlpha: 1,
              duration: 0.55,
              ease: "power3.out",
              overwrite: true,
              clearProps: "transform",
            }
          );
        });
      },
    });
  };

  const stopAutomaticAdvance = () => {
    userInteractedRef.current = true;
    autoAdvanceRef.current?.kill();
    transitionTweenRef.current?.kill();
    tabIndicatorTweenRef.current?.kill();
    if (transitionFrameRef.current !== null) {
      window.cancelAnimationFrame(transitionFrameRef.current);
      transitionFrameRef.current = null;
    }
    clearPackageTransforms();
  };

  const stopAutomaticAdvanceAndSettle = () => {
    stopAutomaticAdvance();
    moveTabIndicator(activePackageRef.current, false);
  };

  const choosePackage = (index: number, immediate = false) => {
    stopAutomaticAdvance();
    moveToPackage(index, immediate);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % pricingPackages.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + pricingPackages.length) % pricingPackages.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = pricingPackages.length - 1;
    else return;

    event.preventDefault();
    document.getElementById(`package-control-${pricingPackages[nextIndex].id}`)?.focus();
    choosePackage(nextIndex, true);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    stopAutomaticAdvance();
    pointerStartXRef.current = event.clientX;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const startX = pointerStartXRef.current;
    pointerStartXRef.current = null;
    if (startX === null) return;

    const distance = event.clientX - startX;
    if (Math.abs(distance) < 48) {
      moveTabIndicator(activePackageRef.current, false);
      return;
    }

    const nextIndex = distance < 0
      ? Math.min(activePackageRef.current + 1, pricingPackages.length - 1)
      : Math.max(activePackageRef.current - 1, 0);

    choosePackage(nextIndex);
  };

  useGSAP(
    () => {
      gsap.fromTo(
        ".pricing-package",
        { y: 42, autoAlpha: 0 },
        {
          scrollTrigger: { trigger: sectionRef.current, start: "top 72%", once: true },
          y: 0,
          autoAlpha: 1,
          duration: 0.9,
          stagger: 0.1,
          ease: "power3.out",
        }
      );

      const media = gsap.matchMedia();

      const syncPackageHash = () => {
        const hashIndex = pricingPackages.findIndex((pkg) => `#${pkg.id}` === window.location.hash);
        if (hashIndex < 0) return;

        userInteractedRef.current = true;
        autoAdvanceRef.current?.kill();
        moveToPackage(hashIndex, true);

        if (hashFrameRef.current !== null) window.cancelAnimationFrame(hashFrameRef.current);
        hashFrameRef.current = window.requestAnimationFrame(() => {
          hashFrameRef.current = null;
          document.getElementById(pricingPackages[hashIndex].id)?.scrollIntoView({ block: "start" });
        });
      };

      syncPackageHash();
      const handleHashChange = () => syncPackageHash();
      window.addEventListener("hashchange", handleHashChange);

      media.add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
        const autoAdvanceTrigger = ScrollTrigger.create({
          trigger: railRef.current,
          start: "top 75%",
          once: true,
          onEnter: () => {
            if (userInteractedRef.current) return;

            autoAdvanceRef.current = gsap.delayedCall(1.1, () => {
              if (!userInteractedRef.current) moveToPackage(1);
            });
          },
        });

        return () => {
          autoAdvanceRef.current?.kill();
          autoAdvanceTrigger.kill();
        };
      });

      return () => {
        window.removeEventListener("hashchange", handleHashChange);
        media.revert();
        autoAdvanceRef.current?.kill();
        transitionTweenRef.current?.kill();
        tabIndicatorTweenRef.current?.kill();
        if (transitionFrameRef.current !== null) window.cancelAnimationFrame(transitionFrameRef.current);
        if (hashFrameRef.current !== null) window.cancelAnimationFrame(hashFrameRef.current);
      };
    },
    { scope: sectionRef }
  );

  return (
    <SectionWrapper id="packages" ref={sectionRef} surface="background" maxWidth="max-w-7xl">
      <SectionHeader
        label="Three ways to play it"
        heading="A package for the moment you actually need"
        alignment="left"
        className="max-w-3xl"
      />
      <div
        className="relative -mt-8 mb-8 overflow-hidden rounded-full border border-primary/20 md:hidden"
        role="group"
        aria-label="Choose a pricing package"
        onPointerDown={stopAutomaticAdvance}
      >
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3" aria-hidden>
          {pricingPackages.map((pkg) => (
            <span
              key={pkg.id}
              className="flex items-center justify-center px-[0.6em] py-[0.7em] font-jost text-xs font-semibold tracking-wide text-primary"
            >
              {pkg.name}
            </span>
          ))}
        </div>
        <span className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-primary/20" aria-hidden />
        <span className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-primary/20" aria-hidden />
        <span
          ref={tabIndicatorRef}
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 overflow-hidden rounded-full bg-primary"
          aria-hidden
        >
          <span
            ref={tabIndicatorLabelsRef}
            className="grid h-full w-[300%] grid-cols-3"
          >
            {pricingPackages.map((pkg) => (
              <span
                key={pkg.id}
                className="flex items-center justify-center px-[0.6em] py-[0.7em] font-jost text-xs font-semibold tracking-wide text-on-dark"
              >
                {pkg.name}
              </span>
            ))}
          </span>
        </span>
        <div className="relative z-10 grid grid-cols-3">
        {pricingPackages.map((pkg, index) => (
          <button
            key={pkg.id}
            id={`package-control-${pkg.id}`}
            type="button"
            aria-controls={pkg.id}
            aria-pressed={activePackage === index}
            onClick={() => choosePackage(index)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            className="min-h-[44px] px-[0.6em] py-[0.7em] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
          >
            <span className="sr-only">{pkg.name}</span>
          </button>
        ))}
        </div>
      </div>
      <div
        ref={railRef}
        aria-label="Pricing packages"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          pointerStartXRef.current = null;
          moveTabIndicator(activePackageRef.current, false);
        }}
        onFocusCapture={stopAutomaticAdvanceAndSettle}
        onWheelCapture={stopAutomaticAdvanceAndSettle}
        className="overflow-hidden [touch-action:pan-y] md:grid md:grid-cols-2 md:items-stretch md:gap-6 md:overflow-visible lg:grid-cols-[0.95fr_1.1fr_0.95fr]"
      >
        {pricingPackages.map((pkg, index) => (
          <div
            key={pkg.id}
            ref={(panel) => {
              packageRefs.current[index] = panel;
            }}
            className={cn(
              "pricing-package gsap-reveal w-full md:block md:h-full md:w-auto",
              activePackage !== index && "hidden",
              pkg.id === "concierge" && "md:col-span-2 lg:col-span-1"
            )}
          >
            <PackageColumn pkg={pkg} />
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

function PricingComparison() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".comparison-reveal",
        { y: 28, autoAlpha: 0 },
        {
          scrollTrigger: { trigger: sectionRef.current, start: "top 78%", once: true },
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <SectionWrapper id="compare" ref={sectionRef} surface="cream" maxWidth="max-w-7xl">
      <SectionHeader
        label="The details"
        heading="What changes as the music grows"
        alignment="left"
        className="comparison-reveal gsap-reveal max-w-4xl"
      />

      <p className="comparison-reveal gsap-reveal -mt-8 mb-5 font-sans text-sm text-foreground/60 md:hidden">
        Swipe across to compare all three packages.
      </p>
      <div
        className="comparison-reveal gsap-reveal overflow-x-auto pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-cream"
        tabIndex={0}
        role="region"
        aria-label="Package comparison table. Scroll horizontally to compare all packages."
      >
        <table className="w-full min-w-[48rem] border-collapse text-left md:min-w-[56rem]">
          <caption className="sr-only">Detailed comparison of the Essential, Signature, and Concierge cello packages</caption>
          <thead>
            <tr className="border-b border-foreground/20">
              <th scope="col" className="sticky left-0 z-10 w-[22%] bg-cream px-5 py-6 font-jost text-xs font-semibold uppercase tracking-widest text-foreground/60 md:static">
                What is included
              </th>
              {pricingPackages.map((pkg) => (
                <th
                  key={pkg.id}
                  scope="col"
                  className={cn(
                    "w-[26%] px-5 py-6 font-serif text-3xl italic font-normal text-primary",
                    pkg.id === "signature" && "bg-background"
                  )}
                >
                  {pkg.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pricingComparisonRows.map((row) => (
              <tr key={row.label} className="border-b border-foreground/10">
                <th scope="row" className="sticky left-0 z-10 bg-cream px-5 py-6 font-sans text-sm font-semibold text-foreground md:static md:text-base">
                  {row.label}
                </th>
                <td className="px-5 py-6 font-sans text-sm leading-relaxed text-foreground/80 md:text-base">{row.essential}</td>
                <td className="bg-background px-5 py-6 font-sans text-sm font-medium leading-relaxed text-foreground md:text-base">{row.signature}</td>
                <td className="px-5 py-6 font-sans text-sm leading-relaxed text-foreground/80 md:text-base">{row.concierge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="comparison-reveal gsap-reveal mt-10 flex flex-col items-start justify-between gap-6 border-t border-primary/20 pt-8 md:flex-row md:items-center">
        <p className="max-w-2xl font-sans text-lg leading-relaxed text-foreground/80">
          Not sure which column sounds like your day? Tell me what you are planning and I will point you in the right direction.
        </p>
        <Button
          href={buildWhatsAppHref({ source: "pricing-comparison" })}
          target="_blank"
          rel="noopener noreferrer"
          variant="white"
          className="w-full shrink-0 sm:w-auto"
        >
          Help me choose
        </Button>
      </div>
    </SectionWrapper>
  );
}

function PricingFAQ() {
  return (
    <SectionWrapper id="faq" surface="dark" maxWidth="max-w-7xl" className="text-on-dark">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[32%_1fr] lg:gap-20">
        <SectionHeader
          label="Good to know"
          heading="A few things worth asking"
          alignment="left"
          className="mb-0"
          labelClassName="text-on-dark/70"
          headingClassName="text-on-dark"
        />
        <FAQAccordion
          faqs={pricingFaqs}
          className="border-t border-on-dark/20 [&_.faq-single]:divide-on-dark/20 [&_p]:!text-on-dark/70 [&_svg]:!text-on-dark/60"
          questionClassName="font-display text-xl font-semibold tracking-tight text-on-dark transition-colors duration-300 group-hover:text-on-dark md:text-2xl"
        />
      </div>
    </SectionWrapper>
  );
}

function PricingClosingCTA() {
  return (
    <SectionWrapper id="pricing-cta" surface="cream" maxWidth="max-w-7xl">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
        <div>
          <p className="mb-5 font-jost text-sm font-semibold uppercase tracking-widest text-primary">Your turn</p>
          <h2 className="max-w-4xl font-serif text-5xl italic leading-[0.95] tracking-tight text-primary text-balance md:text-6xl lg:text-7xl">
            Your event does not need more noise. Just the right music.
          </h2>
        </div>
        <div className="lg:pb-2">
          <p className="font-sans text-lg leading-relaxed text-foreground/80">
            Send me the date, venue, guest count, and the moments you want covered. I will help you choose without making it complicated.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row lg:flex-col xl:flex-row">
            <Button
              href={buildWhatsAppHref({ source: "pricing-closing" })}
              target="_blank"
              rel="noopener noreferrer"
              size="lg"
              className="w-full sm:w-auto"
            >
              Tell me about your event
            </Button>
            <Button href="#packages" variant="white" size="lg" className="w-full sm:w-auto">
              Compare again
            </Button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

export function PricingPage() {
  return (
    <>
      <PricingHero />
      <PricingPackages />
      <PricingComparison />
      <PricingFAQ />
      <PricingClosingCTA />
    </>
  );
}
