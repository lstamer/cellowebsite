# Animation plans — Stamer Cello website

Produced by the `improve-animations` audit at commit `e834e03` (2026-08-22). Each plan is self-contained; an executor needs no other context. Plans never modify files outside what they list.

| # | Plan | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Press feedback + fix `.btn-magnetic` clobbering Button colour transitions + gate raw `:hover` transforms](001-press-feedback-and-button-transitions.md) | HIGH | TODO |
| 002 | [Booking popovers: origin, ease-out exits, interruptible, reduced motion, LocationAutocomplete entrance](002-booking-popovers.md) | HIGH | TODO |
| 003 | [BookFlow step transition: ~750ms → ~400ms, ease-out, double-tap guard, progress bar](003-bookflow-step-transition.md) | HIGH | TODO |
| 004 | [Hero entrances: no flash-hide-replay, CTA at ~0.5s, reduced motion, parallax gate](004-hero-entrances.md) | HIGH | TODO |
| 005 | [Accordion 20px margin snap + ease-out (FAQ, About, mobile nav submenu)](005-accordion-margin-snap-and-easing.md) | MEDIUM | TODO |
| 006 | [Desktop nav dropdown: interruptible, ease-out exit, ≤250ms, reduced motion](006-desktop-nav-dropdown.md) | MEDIUM | TODO |

## Recommended execution order

1. **001** first — it introduces the `--ease-out-strong` / `--ease-in-out-strong` theme tokens (and the `ease-out-strong` utility) that 002, 003 and 005 reference.
2. **005** (tiny, high frequency), then **002**, **003** (the `/book` funnel — verify together on one pass through the form).
3. **004** (heros; includes an LCP guard step).
4. **006** (desktop-only).

004 and 006 are independent of 001.

## Dependencies

- 002, 003, 005 → 001 (token/utility). Each plan names the arbitrary-value fallback to use if 001 is skipped.

## Audited but not planned (select to turn into plans)

- **Reduced-motion coverage is piecemeal** (MEDIUM; WCAG 2.2 AA is a stated requirement in PRODUCT.md). Motion that escapes the `.gsap-reveal` CSS override: the wedding marquee (`weddings/WeddingValue.tsx:86-89`, infinite, hover-only pause — WCAG 2.2.2 needs a keyboard/touch-reachable pause or a reduced-motion stop), stat counters duplicated without the Testimonials fallback (`WeddingBenefits.tsx:167`, `CorporateFunctionsBenefits.tsx:195`, `PrivateEventsBenefits.tsx:194`), `BookingSuccess.tsx:33`, the About carousel (`About.tsx:131`), `Problem.tsx:110` pivot line, `Solution.tsx:58/95` stroke draws, `HandDrawnUnderline.tsx:63`. Structural fix: give `scrollRevealFromTo` in `src/lib/gsap-scroll-reveal.ts` a reduced-motion branch and add a shared `prefersReducedMotion()` helper; the four existing idioms (`globals.css:57`, `Testimonials.tsx:298`, `WhyMeBowlineHeading.tsx:54`, `WhatsAppFab.tsx:18`) collapse into one.
- **Hover card cohesion** (LOW/MEDIUM): image zoom at `duration-1000` vs backing plate at `duration-700` on the same hover (`AboutBioContent.tsx:238/246`, `PrivateEventsImportance.tsx:51/59`, `WeddingBenefits.tsx:235/244`); `Services.tsx:118` lifts with `hover:-translate-y-1` but `transform` is not in its `transition-[box-shadow,border-color,color]` list so the lift snaps; `CorporateFunctionsImportance.tsx:59` lost the image zoom its siblings have. Suggested: `duration-500 ease-out` on both layers, add `transform` to the Services list, restore the corporate image class.
- **WhatsApp FAB entrance** (LOW): `scale: 0.6` + `delay: 0.8` (`WhatsAppFab.tsx:23-30`) — a permanent affordance arriving ~1.3s late as a pop. Suggested: `scale: 0.92, y: 8, duration: 0.35, delay: 0.3`.
- **BookFlow validation errors appear with no transition and shove the layout** (missed opportunity): `BookFlow.tsx:590-594` and siblings. Suggested: wrap in the same `grid-rows-[0fr]/[1fr]` pattern as plan 005 with `duration-200 ease-out-strong`.
- **BookingSuccess gets the generic reveal** (missed opportunity, rare + high emotion): `BookingSuccess.tsx:33-37`. Candidates: a `HandDrawnUnderline` draw on the headline, a slightly longer stagger — the one place the delight budget is allowed.
- **Motion token consolidation** (LOW): 27 distinct GSAP durations and 6 Tailwind duration steps for the same reveal pattern; home-page staggers at 0.14–0.15s vs 0.08s on sub-pages (AUDIT target 30–80ms). Worth a pass once the above land.
- **FAQ double reveal** (LOW): `WeddingFAQ.tsx:16-26` fades the wrapper, then `FAQAccordion.tsx:44-59` staggers every item again (last of 11 items ≈1.6s). Drop one of the two.
- **Minor perf** (LOW): permanent `will-change-transform` on 33 letter spans (`WhyMeBowlineHeading.tsx:181`); undebounced `resize` re-measure in `WeddingValue.tsx:120-134`; hamburger bars use `transition-all` (`Navbar.tsx:541/547` → `transition-transform`).

## Deliberately not reported

- Mobile menu panel shows/hides instantly — changed on purpose in commit `9a5538b` ("drops down from header" → "instant show/hide"). Respected as a settled decision; note only that the hamburger bars still animate 300ms beside it.
- Testimonials pinned scrub section length — it is the section's designed centrepiece and one coherent timeline.
- `HandDrawnUnderline` `attr` clip tween — documented, intentional, and the cheapest way to draw the filtered path.
- `transform-origin: center` on modal-like surfaces; Tailwind `hover:` / `group-hover:` transforms (already gated by `@media (hover: hover)` in v4).
