"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "react-aria-components";
import { gsap, ScrollTrigger } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { TestimonialData } from "@/lib/testimonials";

/** Distance (px) the quote travels; the slide follows the arrow pressed. */
const QUOTE_SLIDE = 40;

/** Thickness of the white marker that sweeps under the highlighted phrase. */
const MARKER_HEIGHT = "0.34em";

interface AboutTestimonialsProps {
  items: TestimonialData[];
  /** Supplying a header uses the wider split layout. Omit it to embed the card and arrows. */
  header?: ReactNode;
  /** The about page owns these scroll reveals; other pages can render the content directly. */
  revealOnScroll?: boolean;
}

function QuoteText({ quote, highlight }: Pick<TestimonialData, "quote" | "highlight">) {
  const at = highlight ? quote.indexOf(highlight) : -1;
  if (!highlight || at < 0) return <>{quote}</>;
  return (
    <>
      {quote.slice(0, at)}
      <mark className="quote-emphasis bg-transparent text-foreground box-decoration-clone bg-[linear-gradient(var(--color-background),var(--color-background))] bg-no-repeat bg-size-[0%_0.34em] bg-position-[0_92%]">
        {highlight}
      </mark>
      {quote.slice(at + highlight.length)}
    </>
  );
}

const CONTROL_BUTTON_CLASS =
  "flex h-[48px] w-[48px] items-center justify-center rounded-full border border-primary/15 bg-background text-primary transition-colors duration-300 focus:outline-none";

export function AboutTestimonials({ items, header, revealOnScroll = true }: AboutTestimonialsProps) {
  const isSplit = header != null;
  // `turn` changes on every swap so the incoming animation still runs if rapid
  // clicks land back on the same quote.
  const [{ index, turn }, setView] = useState({ index: 0, turn: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  const direction = useRef<1 | -1>(1);
  const fromHeight = useRef<number | null>(null);
  const item = items[index];
  const total = items.length;

  const show = (next: number) =>
    setView((view) => ({ index: next, turn: view.turn + 1 }));

  // Incoming half: runs after React renders the new quote.
  const { context } = useGSAP(
    () => {
      const card = cardRef.current;
      const body = card?.querySelector<HTMLElement>(".quote-body");
      const slide = card?.querySelector<HTMLElement>(".quote-slide");
      if (!card || !body || !slide) return;

      const marks = slide.querySelectorAll<HTMLElement>(".quote-emphasis");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion) {
        gsap.set(marks, { backgroundSize: `100% ${MARKER_HEIGHT}` });
        return;
      }

      // Marker sweeps under the highlighted phrase once the quote has settled.
      const sweep = (delay: number) =>
        gsap.fromTo(
          marks,
          { backgroundSize: `0% ${MARKER_HEIGHT}` },
          {
            backgroundSize: `100% ${MARKER_HEIGHT}`,
            duration: 0.7,
            delay,
            ease: "power2.out",
          }
        );

      const from = fromHeight.current;

      if (from === null) {
        // First paint: wait for the card to scroll into view before sweeping.
        gsap.set(marks, { backgroundSize: `0% ${MARKER_HEIGHT}` });
        ScrollTrigger.create({
          trigger: card,
          start: "top 80%",
          once: true,
          onEnter: () => {
            sweep(0.6);
          },
        });
        return;
      }

      fromHeight.current = null;
      gsap.killTweensOf(body);
      gsap.set(body, { clearProps: "height" });
      const to = body.offsetHeight;
      if (Math.abs(to - from) > 1) {
        gsap.fromTo(
          body,
          { height: from },
          { height: to, duration: 0.5, ease: "power3.inOut", clearProps: "height" }
        );
      }
      gsap.fromTo(
        slide,
        { x: -direction.current * QUOTE_SLIDE, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" }
      );
      sweep(0.35);
    },
    { dependencies: [turn], scope: cardRef }
  );

  // Outgoing half: slide the current quote away, then swap content.
  const go = (step: 1 | -1) => {
    target.current = (target.current + step + total) % total;
    direction.current = step;

    const card = cardRef.current;
    const body = card?.querySelector<HTMLElement>(".quote-body");
    const slide = card?.querySelector<HTMLElement>(".quote-slide");
    if (
      !body ||
      !slide ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      show(target.current);
      return;
    }

    gsap.killTweensOf(slide);
    context.add(() =>
      gsap.to(slide, {
        x: step * QUOTE_SLIDE,
        autoAlpha: 0,
        duration: 0.28,
        ease: "power2.in",
        onComplete: () => {
          fromHeight.current = body.offsetHeight;
          show(target.current);
        },
      })
    );
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Client testimonials"
      className={cn(
        "grid min-w-0 grid-cols-1",
        isSplit
          ? "mx-auto max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:grid-rows-[auto_1fr] lg:gap-x-[8%] lg:gap-y-10"
          : "gap-4"
      )}
    >
      {isSplit && (
        <div data-about-reveal={revealOnScroll || undefined} className="lg:col-start-1 lg:row-start-1">
          {header}
        </div>
      )}

      <div
        data-about-reveal={revealOnScroll || undefined}
        className={cn(isSplit && "lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start")}
      >
        <div
          ref={cardRef}
          className={cn(
            "rounded-card bg-rose text-foreground shadow-card",
            isSplit ? "px-7 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14" : "px-6 py-7 sm:p-8 xl:p-10"
          )}
        >
          <span
            aria-hidden
            className={cn(
              "block select-none font-serif leading-none text-foreground/20",
              isSplit ? "-mb-6 text-7xl md:-mb-8 md:text-8xl" : "-mb-5 text-7xl"
            )}
          >
            &ldquo;
          </span>

          <div className="quote-body overflow-hidden" aria-live="polite" aria-atomic="true">
            <figure className="quote-slide">
              <blockquote>
                <p className={cn(
                  "font-display leading-snug text-foreground text-pretty",
                  isSplit ? "text-2xl sm:text-3xl lg:text-4xl lg:leading-[1.22]" : "text-[1.375rem] sm:text-2xl xl:text-[1.75rem]"
                )}>
                  <QuoteText quote={item.quote} highlight={item.highlight} />
                </p>
              </blockquote>

              <figcaption className={cn(
                "flex items-center gap-4 border-t border-foreground/15",
                isSplit ? "mt-8 pt-6 md:mt-10" : "mt-6 pt-5"
              )}>
                <Avatar
                  src={item.image}
                  alt=""
                  fallback={item.initials}
                  size="md"
                  className="border border-foreground/20"
                />
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold leading-tight text-foreground">
                    {item.name}
                  </p>
                  <p className="mt-0.5 font-sans text-sm text-foreground/70">{item.descriptor}</p>
                </div>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>

      <div className={cn(
        "flex items-center gap-5",
        isSplit && "lg:col-start-1 lg:row-start-2 lg:self-start"
      )}>
        <div className="flex gap-3">
          <Button
            aria-label="Previous testimonial"
            onPress={() => go(-1)}
            className={({ isHovered, isPressed, isFocusVisible }) =>
              cn(
                CONTROL_BUTTON_CLASS,
                (isHovered || isPressed) && "bg-primary text-on-dark",
                isFocusVisible && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )
            }
          >
            <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={1.75} aria-hidden />
          </Button>
          <Button
            aria-label="Next testimonial"
            onPress={() => go(1)}
            className={({ isHovered, isPressed, isFocusVisible }) =>
              cn(
                CONTROL_BUTTON_CLASS,
                (isHovered || isPressed) && "bg-primary text-on-dark",
                isFocusVisible && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )
            }
          >
            <ArrowRight className="h-[20px] w-[20px]" strokeWidth={1.75} aria-hidden />
          </Button>
        </div>

        {isSplit && (
          <p
            className="font-mono text-sm tracking-[0.12em] text-foreground/60"
            aria-label={`Testimonial ${index + 1} of ${total}`}
          >
            <span className="text-primary">{String(index + 1).padStart(2, "0")}</span>
            <span aria-hidden> / </span>
            {String(total).padStart(2, "0")}
          </p>
        )}
      </div>
    </div>
  );
}
