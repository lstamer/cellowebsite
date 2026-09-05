"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { ToggleButton, ToggleButtonGroup, type Key } from "react-aria-components";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { cn } from "@/lib/utils";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";
import {
  ALL_FILTER_DESCRIPTOR,
  GALLERY_CATEGORIES,
  GALLERY_ITEMS,
  filterGalleryItems,
  getGalleryCategory,
  type GalleryFilter,
  type GalleryItem,
} from "@/lib/gallery";

const FILTERS: { id: GalleryFilter; label: string }[] = [
  { id: "all", label: "All" },
  ...GALLERY_CATEGORIES.map((category) => ({ id: category.id, label: category.label })),
];

function isGalleryFilter(value: Key): value is GalleryFilter {
  return FILTERS.some((filter) => filter.id === value);
}

const REDUCED_MOTION_MQ = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_MQ).matches;
}

/* ------------------------------------------------------------------ */
/* Dock                                                                */
/* ------------------------------------------------------------------ */

interface GalleryDockProps {
  value: GalleryFilter;
  onChange: (next: GalleryFilter) => void;
  counts: Record<GalleryFilter, number>;
}

function GalleryDock({ value, onChange, counts }: GalleryDockProps) {
  const dockRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  const positionIndicator = useCallback(
    (animate: boolean) => {
      const dock = dockRef.current;
      const indicator = indicatorRef.current;
      if (!dock || !indicator) return;

      const active = dock.querySelector<HTMLElement>(`[data-filter="${value}"]`);
      if (!active) return;

      const vars = { x: active.offsetLeft, width: active.offsetWidth, autoAlpha: 1 };

      if (!animate || prefersReducedMotion()) {
        gsap.set(indicator, vars);
        return;
      }

      gsap.to(indicator, { ...vars, duration: 0.55, ease: "power3.out", overwrite: "auto" });
    },
    [value]
  );

  useGSAP(
    () => {
      positionIndicator(true);
    },
    { scope: dockRef, dependencies: [positionIndicator] }
  );

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;

    const observer = new ResizeObserver(() => positionIndicator(false));
    observer.observe(dock);
    return () => observer.disconnect();
  }, [positionIndicator]);

  const handleSelectionChange = (keys: Set<Key>) => {
    const next = keys.values().next().value;
    if (next !== undefined && isGalleryFilter(next)) onChange(next);
  };

  return (
    <div
      ref={dockRef}
      className="relative inline-flex max-w-full rounded-full border border-primary/15 bg-background p-1"
    >
      <span
        ref={indicatorRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-1 h-[calc(100%-0.5rem)] rounded-full bg-primary opacity-0"
      />
      <ToggleButtonGroup
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[value]}
        onSelectionChange={handleSelectionChange}
        aria-label="Filter the library by event type"
        className="relative flex max-w-full gap-0 overflow-x-auto"
      >
        {FILTERS.map((filter) => (
          <ToggleButton
            key={filter.id}
            id={filter.id}
            data-filter={filter.id}
            className={({ isSelected, isHovered, isFocusVisible }) =>
              cn(
                "relative z-[1] flex shrink-0 cursor-pointer items-center gap-[0.5em] whitespace-nowrap rounded-full px-[1em] py-[0.7em] font-sans text-xs outline-none sm:px-[1.15em] sm:py-[0.6em] sm:text-sm",
                "transition-colors duration-300",
                isSelected
                  ? "text-on-dark"
                  : isHovered
                    ? "text-foreground"
                    : "text-foreground/70",
                isFocusVisible && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )
            }
          >
            {({ isSelected }) => (
              <>
                <span>{filter.label}</span>
                <span
                  className={cn(
                    "hidden font-mono text-[0.6875rem] tabular-nums transition-colors duration-300 sm:inline",
                    isSelected ? "text-on-dark/70" : "text-foreground/40"
                  )}
                >
                  {String(counts[filter.id]).padStart(2, "0")}
                </span>
              </>
            )}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tile                                                                */
/* ------------------------------------------------------------------ */

interface GalleryTileProps {
  item: GalleryItem;
  index: number;
}

function GalleryTile({ item, index }: GalleryTileProps) {
  const category = getGalleryCategory(item.category);

  return (
    <Link
      href={`/gallery/${item.slug}`}
      data-gallery-tile
      aria-label={`${item.title}, ${item.composer}. Watch the ${category.label.toLowerCase()} performance.`}
      className={cn(
        "group flex flex-col rounded-[1.25rem] border border-primary/15 bg-background p-1.5",
        "shadow-card outline-none transition-[transform,border-color] duration-300",
        "hover:-translate-y-1 hover:border-primary/40",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      {/* Media: sharp rectangle inside the rounded chrome */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-none bg-surface-dark sm:aspect-[4/3]">
        <Image
          src={item.poster}
          alt={item.posterAlt}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          priority={index < 3}
          className={cn(
            "object-cover grayscale-[15%] transition-transform duration-700 ease-out",
            "group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100",
            item.posterPosition
          )}
        />

        {/* Index + duration, mono metadata */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="bg-background px-[0.6em] py-[0.35em] font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-foreground">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <span className="absolute bottom-3 right-3 bg-background px-[0.6em] py-[0.35em] font-mono text-[0.6875rem] tabular-nums tracking-[0.12em] text-foreground">
          {item.duration}
        </span>

        {/* Play badge: solid ebony green, rises on hover */}
        <span
          aria-hidden
          className={cn(
            "absolute bottom-3 left-3 flex h-[44px] w-[44px] items-center justify-center rounded-full bg-primary text-on-dark",
            "translate-y-2 opacity-0 transition-[transform,opacity] duration-300 ease-out",
            "group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
            "motion-reduce:translate-y-0 motion-reduce:opacity-100"
          )}
        >
          <Play className="ml-[2px] h-[18px] w-[18px]" strokeWidth={1.75} fill="currentColor" />
        </span>
      </div>

      {/* Inline title + composer */}
      <div className="flex flex-col gap-1 px-3 pb-3 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary md:text-2xl">
            {item.title}
          </h2>
          <span className="shrink-0 font-jost text-[0.6875rem] uppercase tracking-[0.22em] text-primary/70">
            {category.label}
          </span>
        </div>
        <p className="font-mono text-xs tracking-[0.02em] text-foreground/60">{item.composer}</p>

        {/* Hover reveal: where it lands */}
        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr] motion-reduce:grid-rows-[1fr]">
          <p className="overflow-hidden font-sans text-sm leading-relaxed text-foreground/75">
            <span className="block pt-2">Best for {item.bestFor.toLowerCase()}.</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Library                                                             */
/* ------------------------------------------------------------------ */

export function GalleryLibrary() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const hasMountedRef = useRef(false);

  const items = useMemo(() => filterGalleryItems(filter), [filter]);

  const counts = useMemo<Record<GalleryFilter, number>>(
    () => ({
      all: GALLERY_ITEMS.length,
      weddings: filterGalleryItems("weddings").length,
      celebrations: filterGalleryItems("celebrations").length,
      corporate: filterGalleryItems("corporate").length,
    }),
    []
  );

  const descriptor =
    filter === "all" ? ALL_FILTER_DESCRIPTOR : getGalleryCategory(filter).descriptor;

  // Header reveal on load
  useGSAP(
    () => {
      const reduce = prefersReducedMotion();
      gsap.fromTo(
        "[data-gallery-header]",
        { y: reduce ? 0 : 32, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: reduce ? 0.2 : 0.9, stagger: reduce ? 0 : 0.1, ease: "power3.out" }
      );
    },
    { scope: containerRef }
  );

  // Grid reveal: stagger on first paint, and again whenever the filter changes
  useGSAP(
    () => {
      const grid = gridRef.current;
      if (!grid) return;

      const tiles = gsap.utils.toArray<HTMLElement>("[data-gallery-tile]", grid);
      const reduce = prefersReducedMotion();
      const firstPaint = !hasMountedRef.current;
      hasMountedRef.current = true;

      gsap.fromTo(
        tiles,
        { y: reduce ? 0 : firstPaint ? 40 : 20, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: reduce ? 0.2 : firstPaint ? 1 : 0.6,
          stagger: reduce ? 0 : firstPaint ? 0.1 : 0.06,
          ease: "power3.out",
          delay: firstPaint ? 0.25 : 0,
          overwrite: "auto",
        }
      );

      gsap.fromTo(
        "[data-gallery-descriptor]",
        { y: reduce ? 0 : 8, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: reduce ? 0.2 : 0.5, ease: "power3.out", overwrite: "auto" }
      );
    },
    { scope: containerRef, dependencies: [filter] }
  );

  return (
    <div ref={containerRef}>
      <SectionWrapper id="library" surface="background" maxWidth="max-w-7xl" className="pt-32 md:pt-36 lg:pt-40">
        {/* Header: left aligned, asymmetric */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            <p
              data-gallery-header
              className="gsap-reveal relative mb-4 pl-4 font-jost text-sm font-semibold tracking-widest text-foreground/70 before:absolute before:left-0 before:top-1/2 before:h-[6px] before:w-[6px] before:-translate-y-1/2 before:rounded-full before:bg-accent"
            >
              The library
            </p>
            <h1
              data-gallery-header
              className="gsap-reveal font-serif text-5xl italic leading-[0.95] tracking-tight text-primary text-balance md:text-6xl lg:text-7xl"
            >
              Hear it{" "}
              <HandDrawnUnderline variant={3} underlineClassName="text-accent">
                before you book it
              </HandDrawnUnderline>
              .
            </h1>
          </div>
          <div className="flex flex-col justify-end lg:col-span-4">
            <p data-gallery-header className="gsap-reveal font-sans text-base leading-relaxed text-foreground/75 text-pretty md:text-lg">
              Nine songs, three kinds of room. Pick the day you&apos;re planning and press play. Every
              clip is live, one cello, no backing track.
            </p>
          </div>
        </div>

        {/* Dock + descriptor */}
        <div
          data-gallery-header
          className="gsap-reveal mt-12 flex flex-col gap-4 border-t border-primary/15 pt-6 md:mt-16 md:flex-row md:items-center md:justify-between md:gap-8"
        >
          <GalleryDock value={filter} onChange={setFilter} counts={counts} />
          <p
            data-gallery-descriptor
            className="font-sans text-sm leading-relaxed text-foreground/60 md:max-w-sm md:text-right"
            aria-live="polite"
          >
            {descriptor}
          </p>
        </div>

        {/* Grid: thin skeleton between rounded tiles */}
        <div
          ref={gridRef}
          className="mt-8 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Performance videos"
        >
          {items.map((item, index) => (
            <GalleryTile key={item.slug} item={item} index={index} />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 flex flex-col gap-3 border-t border-primary/15 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="font-sans text-sm text-foreground/60">
            Don&apos;t see your song? I arrange on request. Most things work on a cello, honestly.
          </p>
          <Link
            href="/book"
            className="link-hover inline-flex items-center gap-2 font-sans text-sm font-medium text-primary"
          >
            Tell me about the moment you&apos;re planning
            <span aria-hidden className="font-mono text-xs">&rarr;</span>
          </Link>
        </div>
      </SectionWrapper>
    </div>
  );
}
