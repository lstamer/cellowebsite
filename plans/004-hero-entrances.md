# 004 — Stop the hero flashing, hiding, then replaying on every visit; land the CTA in ~0.5s; respect reduced motion on all four heros and the parallax

- **Status**: TODO
- **Commit**: e834e03
- **Severity**: HIGH
- **Category**: Purpose & frequency + Accessibility + Easing & duration
- **Estimated scope**: 4 files — `src/components/Hero.tsx`, `src/components/weddings/WeddingHero.tsx`, `src/components/private-events/PrivateEventsHero.tsx`, `src/components/corporate-functions/CorporateFunctionsHero.tsx`. Small, repetitive.

## Problem

The four page heros are server-rendered and their copy has **no pre-hide rule** (`src/app/globals.css:52-55` only pre-hides `.gsap-reveal` and `[data-about-reveal]`). So on every visit the headline and CTAs paint fully visible, hydration yanks them to `opacity: 0, y: 40`, and they replay — a visible flash-hide-reveal on the primary conversion surface. The CTA row is the 4th staggered element, so it starts at 0.24s and, at `duration: 1.2`, does not settle until ~1.4s. None of the four has a reduced-motion branch (DESIGN.md line 201 requires one), and the homepage scrub parallax is gated only by viewport width.

```ts
// src/components/Hero.tsx:15-35 — current
gsap.from(".hero-elem", {
  y: 40,
  opacity: 0,
  duration: 1.2,
  ease: "power3.out",
  stagger: 0.08,
});

const media = gsap.matchMedia();
media.add("(min-width: 768px)", () => {
  gsap.to(videoBgRef.current, {
    yPercent: -18,
    ease: "none",
    scrollTrigger: {
      trigger: containerRef.current,
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
});
return () => media.revert();
```
```tsx
// src/components/Hero.tsx:68,71,76,81 — current (the 5 .hero-elem elements; the 5th is inside the CTA row)
<span className="hero-elem block text-on-dark font-jost font-bold uppercase tracking-widest text-sm md:text-base">
<span className="hero-elem block text-on-dark font-serif italic text-display leading-[0.85] pr-4">
<p className="hero-elem mb-8 max-w-2xl text-balance font-sans text-lg leading-relaxed text-on-dark/80 md:text-xl">
<div className="hero-elem flex flex-wrap gap-4">
```
```ts
// src/components/weddings/WeddingHero.tsx:14-24 and src/components/private-events/PrivateEventsHero.tsx:14-24 — current (identical)
gsap.fromTo(
  ".hero-elem",
  { y: 40, autoAlpha: 0 },
  {
    y: 0,
    autoAlpha: 1,
    duration: 1.2,
    ease: "power3.out",
    stagger: 0.08,
  }
);
```
```ts
// src/components/corporate-functions/CorporateFunctionsHero.tsx:15-25 — current (same, selector ".corp-hero-elem"; elements at lines 52, 55, 60, 66)
```

## Target

Opt every hero element into the existing `.gsap-reveal` convention (pre-hide at `opacity: 0`, `<noscript>` fallback in `src/app/layout.tsx:70`, reduced-motion `!important` override in `globals.css:57-64`), then use an explicit `fromTo` so the end state is `opacity: 1` regardless of the pre-hide.

```ts
// src/components/Hero.tsx:15-21 — target
gsap.fromTo(
  ".hero-elem",
  { y: 32, opacity: 0 },
  { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.06, delay: 0.05 }
);
```
```ts
// src/components/Hero.tsx:23-24 — target (gate the parallax)
media.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
```
```ts
// WeddingHero.tsx / PrivateEventsHero.tsx / CorporateFunctionsHero.tsx — target (keep autoAlpha; only values change)
gsap.fromTo(
  ".hero-elem",              // ".corp-hero-elem" in CorporateFunctionsHero
  { y: 32, autoAlpha: 0 },
  {
    y: 0,
    autoAlpha: 1,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.06,
    delay: 0.05,
  }
);
```
```tsx
// every element carrying hero-elem / corp-hero-elem — target: add gsap-reveal, e.g.
<span className="hero-elem gsap-reveal block text-on-dark font-jost font-bold uppercase tracking-widest text-sm md:text-base">
```

Why these values: `power3.out` at 0.9s reaches ~85% of its travel by 0.4s, so with `stagger: 0.06` the CTA row (index 3) is readable ~0.5s after hydration instead of ~1.4s. Reduced-motion users get instant, static copy via the CSS override (the tween still runs but its inline styles lose to `!important`).

**Important**: `gsap.from(...)` in `Hero.tsx` MUST become `gsap.fromTo(...)`. With `.gsap-reveal { opacity: 0 }` applied, `from` would read the current (0) opacity as the destination and the hero would stay invisible.

## Repo conventions to follow

- The `.gsap-reveal` + `scrollRevealFromTo` convention is the house pattern for everything below the fold (e.g. `src/components/ui/FAQAccordion.tsx:44-59` + the `faq-item gsap-reveal` class at line 84). Heros do not use ScrollTrigger, so only the class and a plain `fromTo` are needed.
- `gsap.matchMedia()` with a media string is the existing way to gate the parallax (`Hero.tsx:23`); just extend the string.

## Steps

1. `src/components/Hero.tsx`: change lines 15–21 to the target `fromTo`; change the `media.add` query on line 24; add `gsap-reveal` to the four `hero-elem` elements at lines 68, 71, 76, 81 (and any fifth `hero-elem` inside the CTA row — `grep -n hero-elem` to be sure).
2. `src/components/weddings/WeddingHero.tsx`: lines 14–24 → target values; add `gsap-reveal` to every `hero-elem` element (`grep -n "hero-elem" src/components/weddings/WeddingHero.tsx`).
3. `src/components/private-events/PrivateEventsHero.tsx`: same as step 2.
4. `src/components/corporate-functions/CorporateFunctionsHero.tsx`: lines 15–25 → target values; add `gsap-reveal` to every `corp-hero-elem` element (lines 52, 55, 60, 66 — verify with grep).

## Boundaries

- Do NOT touch the `<video>`, poster, gradients, or layout classes.
- Do NOT change copy.
- Do NOT add a reduced-motion JS branch here — the `.gsap-reveal` CSS override is the mechanism; keep it single-sourced.
- If a cited line no longer matches (drift since `e834e03`), STOP and report.

## Verification

- **Mechanical**: `npm run typecheck`, `npm run lint` exit 0. `grep -n "gsap.from(" src/components/Hero.tsx` returns nothing. Each hero file's `hero-elem`/`corp-hero-elem` count equals its `gsap-reveal` count on those same lines.
- **Feel check**:
  - Hard-reload `/`, `/services/weddings`, `/services/private-events`, `/services/corporate-functions` with DevTools Network throttled to "Slow 4G": the hero copy must never be visible before it animates in (no flash-then-hide).
  - At normal speed the primary CTA is fully readable ≈0.5s after the page becomes interactive.
  - Rendering → `prefers-reduced-motion: reduce`: hero copy is static and fully visible immediately; on `/` at ≥768px the background no longer parallaxes on scroll.
  - Disable JavaScript (DevTools → Settings → Debugger) and reload `/`: hero copy is visible (the `<noscript>` rule).
- **Perf guard**: run Lighthouse (mobile) on `/` before and after. If LCP regresses by more than ~200ms because the `<h1>` span is now pre-hidden, remove `gsap-reveal` from the headline span only (line 71 in `Hero.tsx`, and the equivalent headline span in each service hero) and exclude it from the tween by giving it a different class — report that you did so.
- **Done when**: no flash on any of the four routes, CTA settles ≈0.5s, reduced-motion checks pass, LCP within guard.
