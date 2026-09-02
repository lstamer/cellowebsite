# 006 — Make the desktop nav dropdowns interruptible, ease-out on exit, settle within ~250ms, and respect reduced motion

- **Status**: TODO
- **Commit**: e834e03
- **Severity**: MEDIUM (desktop hover, tens of times per session; includes a real bug — a stale close can hide an open panel)
- **Category**: Interruptibility + Easing & duration + Accessibility
- **Estimated scope**: 1 file — `src/components/Navbar.tsx` (`DropdownPanel`, lines ~236–290). Small.

## Problem

```ts
// src/components/Navbar.tsx:250-287 — current
useGSAP(() => {
  if (!cardRef.current || !panelRef.current) return;

  const items = cardRef.current.querySelectorAll("[data-dropdown-item]");
  const cta = cardRef.current.querySelector("[data-dropdown-cta]");

  if (open) {
    hasAnimated.current = true;
    gsap.set(panelRef.current, { visibility: "visible", pointerEvents: "auto" });

    gsap.fromTo(
      cardRef.current,
      { opacity: 0, scale: 0.96, y: -4 },
      { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: "power3.out" }
    );

    gsap.fromTo(
      items,
      { opacity: 0, filter: "blur(4px)", x: -8 },
      { opacity: 1, filter: "blur(0px)", x: 0, stagger: 0.07, duration: 0.45, ease: "power3.out", delay: 0.06 }
    );

    if (cta) {
      gsap.fromTo(cta, { opacity: 0, x: 8 }, { opacity: 1, x: 0, duration: 0.45, delay: 0.2, ease: "power3.out" });
    }
  } else if (hasAnimated.current) {
    gsap.to(cardRef.current, {
      opacity: 0,
      scale: 0.96,
      y: -4,
      duration: 0.15,
      ease: "power2.in",
      onComplete() {
        gsap.set(panelRef.current, { visibility: "hidden", pointerEvents: "none" });
      },
    });
  }
}, { dependencies: [open] });
```

- **Non-interruptible**: no `overwrite`, `useGSAP` has no `revertOnUpdate`, and open is a `fromTo` that restarts from 0. Sweeping About → Services → About within ~300ms leaves the old close tween alive; its `onComplete` then sets `visibility: hidden` on a panel React considers open.
- **Exit uses `power2.in`** (should be ease-out).
- **Contents overrun the dropdown budget**: `0.06 delay + 4×0.07 stagger + 0.45` ≈ 790ms for the last item, CTA at ~650ms, while the card lands at 250ms. Per AUDIT a dropdown should be 150–250ms.
- **No reduced-motion branch** for the `x`/`scale`/`y`/`blur` motion (the reduced-motion check at `Navbar.tsx:61` belongs to the scroll-hide hook, not this block).

## Target

Set the closed resting state once, then retarget with `gsap.to` + `overwrite: "auto"` in both directions. Drop the blur (paint cost, no benefit at these durations). Keep a ref mirroring `open` so a completed close can never hide an open panel.

```ts
// target — replaces lines 247-287 (the `hasAnimated` ref is removed; add `openRef`)
const panelRef = useRef<HTMLDivElement>(null);
const cardRef = useRef<HTMLDivElement>(null);
const openRef = useRef(open);
openRef.current = open;

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Closed resting state, applied once.
useGSAP(() => {
  const card = cardRef.current;
  if (!card) return;
  const items = card.querySelectorAll("[data-dropdown-item]");
  const cta = card.querySelector("[data-dropdown-cta]");
  gsap.set(card, reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 });
  gsap.set(items, reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 });
  if (cta) gsap.set(cta, reduceMotion ? { opacity: 0 } : { opacity: 0, x: 8 });
});

useGSAP(() => {
  const card = cardRef.current;
  const panel = panelRef.current;
  if (!card || !panel) return;
  const items = card.querySelectorAll("[data-dropdown-item]");
  const cta = card.querySelector("[data-dropdown-cta]");

  if (open) {
    gsap.set(panel, { visibility: "visible", pointerEvents: "auto" });
    gsap.to(card, { opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "power3.out", overwrite: "auto" });
    gsap.to(items, {
      opacity: 1, x: 0,
      duration: reduceMotion ? 0.15 : 0.18,
      stagger: reduceMotion ? 0 : 0.02,
      ease: "power3.out",
      overwrite: "auto",
    });
    if (cta) {
      gsap.to(cta, { opacity: 1, x: 0, duration: 0.18, delay: reduceMotion ? 0 : 0.04, ease: "power3.out", overwrite: "auto" });
    }
  } else {
    gsap.to(items, { opacity: 0, ...(reduceMotion ? {} : { x: -8 }), duration: 0.1, ease: "power2.out", overwrite: "auto" });
    if (cta) gsap.to(cta, { opacity: 0, ...(reduceMotion ? {} : { x: 8 }), duration: 0.1, ease: "power2.out", overwrite: "auto" });
    gsap.to(card, {
      opacity: 0,
      ...(reduceMotion ? {} : { scale: 0.96, y: -4 }),
      duration: 0.15,
      ease: "power2.out",
      overwrite: "auto",
      onComplete() {
        if (!openRef.current) {
          gsap.set(panel, { visibility: "hidden", pointerEvents: "none" });
        }
      },
    });
  }
}, { dependencies: [open] });
```

Resulting open: card 200ms; with 5 items, last item starts at 80ms and settles at ~260ms. Close: everything gone in 150ms, ease-out.

## Repo conventions to follow

- `useGSAP` from `@gsap/react`, `gsap` from `@/lib/gsap-client` — already imported in this file.
- Exemplar of interruptible retargeting in this same file: the scroll-hide tweens at `Navbar.tsx:69-89` use `overwrite: "auto"` in both directions.
- Reduced-motion idiom: `window.matchMedia("(prefers-reduced-motion: reduce)").matches` as at `Navbar.tsx:61`.

## Steps

1. In `DropdownPanel` (starts ~line 236): delete `const hasAnimated = useRef(false);` (line 248) and add `openRef` + `reduceMotion` as in the target.
2. Replace the single `useGSAP` block (lines 250–287) with the two target blocks.
3. Leave the JSX (lines 293–330: `panelRef` wrapper with inline `visibility: hidden`, `cardRef` with `origin-top`) unchanged.

## Boundaries

- Do NOT change the hover-intent timers / `CLOSE_DELAY` logic in the parent, the mobile menu, or the scroll-hide hook.
- Do NOT touch the `style={{ visibility: "hidden", pointerEvents: "none" }}` on the panel wrapper — it is the SSR-safe initial state.
- If the code at a cited line differs (drift since `e834e03`), STOP and report.

## Verification

- **Mechanical**: `npm run typecheck`, `npm run lint` exit 0; `grep -n "hasAnimated\|blur(4px)\|power2.in" src/components/Navbar.tsx` returns nothing.
- **Feel check** at ≥1024px on `http://localhost:3000`:
  - Hover About, then Services, then About again as fast as you can, 10 times: the final panel is always visible and clickable (never stuck hidden).
  - Hover in and out once: the panel fades out starting immediately, ~150ms, no "hesitation" before it moves.
  - Animations panel at 10%: all items and the CTA have finished moving by the time the card has — roughly a quarter of a second, not most of a second.
  - Rendering → `prefers-reduced-motion: reduce`: panel and items only fade.
- **Done when**: all four checks pass.
