"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { cn } from "@/lib/utils";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";
import { getGalleryCategory, primaryArtist, type GalleryItem } from "@/lib/gallery";

interface GalleryDetailProps {
  item: GalleryItem;
  /** Same-category items only (see `getRelatedItems`) */
  related: GalleryItem[];
}

export function GalleryDetail({ item, related }: GalleryDetailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const category = getGalleryCategory(item.category);
  const sameCategoryRelated = related.filter((candidate) => candidate.category === item.category);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.fromTo(
        "[data-detail-reveal]",
        { y: reduce ? 0 : 32, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: reduce ? 0.2 : 0.9,
          stagger: reduce ? 0 : 0.1,
          ease: "power3.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef}>
      <SectionWrapper surface="background" maxWidth="max-w-7xl" className="pt-28 md:pt-32 lg:pt-36">
        <h1 className="sr-only">{item.title}</h1>

        <Link
          href="/gallery"
          data-detail-reveal
          className="gsap-reveal link-hover inline-flex items-center gap-2 font-sans text-sm text-foreground/70 hover:text-primary"
        >
          <ArrowLeft className="h-[16px] w-[16px]" strokeWidth={1.75} />
          Back to the library
        </Link>

        {/* Player: rounded container, solid play badge */}
        <div
          data-detail-reveal
          className="gsap-reveal relative mt-8 aspect-[4/5] overflow-hidden rounded-card bg-surface-dark sm:aspect-video md:mt-10"
        >
          <Image
            src={item.poster}
            alt={item.posterAlt}
            fill
            priority
            sizes="(min-width: 1280px) 1152px, 100vw"
            className={cn("object-cover grayscale-[15%]", item.posterPosition)}
          />
          <button
            type="button"
            aria-label={`Play ${item.title}`}
            className={cn(
              "btn-magnetic absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-on-dark md:h-[88px] md:w-[88px]",
              "outline-none transition-colors duration-300 hover:bg-primary/90",
              "focus-visible:ring-2 focus-visible:ring-on-dark focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            )}
          >
            <Play className="ml-[3px] h-[26px] w-[26px]" strokeWidth={1.75} fill="currentColor" />
          </button>
          <span className="absolute bottom-5 left-5 rounded-full bg-background px-[0.9em] py-[0.45em] font-jost text-[0.6875rem] uppercase tracking-[0.18em] text-foreground">
            {item.videoSrc ? "Live recording" : "Clip on its way"}
          </span>
          <span className="absolute bottom-5 right-5 rounded-full bg-background px-[0.9em] py-[0.45em] font-sans text-xs tabular-nums text-foreground">
            {item.duration}
          </span>
        </div>

        {/* Title, composer, notes */}
        <div className="mt-10 grid grid-cols-1 gap-10 md:mt-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <h2 data-detail-reveal className={cn("gsap-reveal", featureItemTitleClass)}>
              {item.title}
            </h2>
            <p
              data-detail-reveal
              className="gsap-reveal mt-5 max-w-2xl font-sans text-base leading-relaxed text-foreground/75 text-pretty md:text-lg"
            >
              {item.blurb}
            </p>
            <p data-detail-reveal className="gsap-reveal mt-6 font-sans text-base text-foreground/75">
              Written by {item.composer}.
              <span className="block mt-1 text-foreground/60">You know it from {item.knownFrom}.</span>
            </p>
          </div>

          <aside data-detail-reveal className="gsap-reveal lg:col-span-5 lg:pl-8">
            <div className="rounded-card border border-primary/10 bg-cream p-8">
              <h2 className={featureItemTitleClass}>Want this one at yours?</h2>
              <p className={cn(featureItemBodyClass, "mt-3")}>
                Tell me the date and the room. I&apos;ll tell you where in the day it lands best.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="/book" size="sm">
                  Tell me about your day
                </Button>
                <Button href={category.serviceHref} variant="white" size="sm">
                  {category.label} with me
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </SectionWrapper>

      {/* Related: same category only */}
      {sameCategoryRelated.length > 0 && (
        <SectionWrapper surface="cream" maxWidth="max-w-7xl">
          <SectionHeader
            label="Keep exploring"
            heading="A few more for your occasion."
            alignment="left"
            className="mb-10 md:mb-12"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
            {sameCategoryRelated.map((relatedItem) => (
              <Link
                key={relatedItem.slug}
                href={`/gallery/${relatedItem.slug}`}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-card border border-primary/15 bg-background shadow-card outline-none",
                  "transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-primary/40",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
                )}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-dark">
                  <Image
                    src={relatedItem.poster}
                    alt={relatedItem.posterAlt}
                    fill
                    sizes="(min-width: 1024px) 45vw, 90vw"
                    className={cn(
                      "object-cover grayscale-[15%] transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100",
                      relatedItem.posterPosition
                    )}
                  />
                  <span className="absolute bottom-4 right-4 rounded-full bg-background px-[0.9em] py-[0.45em] font-sans text-xs tabular-nums text-foreground">
                    {relatedItem.duration}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 px-6 pb-6 pt-5">
                  <div>
                    <h3 className="font-display text-xl font-semibold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary md:text-2xl">
                      {relatedItem.title}
                    </h3>
                    <p className="mt-1 font-sans text-sm text-foreground/60">{primaryArtist(relatedItem)}</p>
                  </div>
                  <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-primary text-on-dark">
                    <Play className="ml-[2px] h-[14px] w-[14px]" strokeWidth={1.75} fill="currentColor" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 border-t border-primary/15 pt-6">
            <Link href="/gallery" className="link-hover inline-flex font-sans text-sm font-medium text-primary">
              Everything in the library
            </Link>
          </div>
        </SectionWrapper>
      )}
    </div>
  );
}
