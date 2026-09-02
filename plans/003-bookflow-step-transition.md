# 003 — Cut the enquiry form's step change from ~750ms to ~400ms, make it ease-out, guard double-taps, and drop `transition-all` on the progress bar

- **Status**: TODO
- **Commit**: e834e03
- **Severity**: HIGH
- **Category**: Easing & duration + Interruptibility + Performance + Accessibility
- **Estimated scope**: 1 file — `src/components/BookFlow.tsx`. Small.
- **Depends on**: 001 (uses `ease-out-strong`; if absent, substitute `ease-[cubic-bezier(0.23,1,0.32,1)]`).

## Problem

Every enquiry passes through Continue → Step 2 → Send. Today each press runs a 300ms `power2.in` fade-out (slowest at exactly the moment the user is waiting on their own tap), an instant scroll jump, then a 450ms fade-in: ~750ms before the next step is readable. Nothing blocks a second tap during the exit, so two `onComplete`s can both run `setStep(s => s + 1)`.

```ts
// src/components/BookFlow.tsx:245-265 — current
// Animate step in on mount
useGSAP(() => {
  if (!stepRef.current) return;
  gsap.fromTo(
    stepRef.current,
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }
  );
}, [step]);

function animateOut(callback: () => void) {
  if (!stepRef.current) {
    callback();
    return;
  }
  gsap.to(stepRef.current, {
    opacity: 0,
    y: -20,
    duration: 0.3,
    ease: "power2.in",
    onComplete: callback,
  });
}
```

```tsx
// src/components/BookFlow.tsx:534-542 — current (step indicator)
<div className="flex items-center gap-2 mb-12">
  {[0, 1].map((i) => (
    <div
      key={i}
      className={cn(
        "h-1 rounded-full transition-all duration-500",
        i <= step ? "bg-primary flex-[2]" : "bg-foreground/15 flex-1"
      )}
    />
  ))}
</div>
```

No reduced-motion branch exists for any of this; `stepRef`'s element (line 545, `<div ref={stepRef}>`) does not carry `.gsap-reveal`, so the CSS override does not cover it.

## Target

```ts
// target — replaces lines 245-265
const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTransitioningRef = useRef(false);

// Animate step in on mount
useGSAP(() => {
  if (!stepRef.current) return;
  gsap.fromTo(
    stepRef.current,
    reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: reduceMotion ? 0.15 : 0.25, ease: "power3.out", overwrite: "auto" }
  );
}, [step]);

function animateOut(callback: () => void) {
  if (!stepRef.current) {
    callback();
    return;
  }
  if (isTransitioningRef.current) return;   // ignore double-taps while the exit is in flight
  isTransitioningRef.current = true;
  gsap.to(stepRef.current, {
    opacity: 0,
    ...(reduceMotion ? {} : { y: -8 }),
    duration: reduceMotion ? 0.1 : 0.15,
    ease: "power2.out",
    overwrite: "auto",
    onComplete: () => {
      isTransitioningRef.current = false;
      callback();
    },
  });
}
```

```tsx
// target — step indicator class at line 538
"h-1 rounded-full transition-[flex-grow,background-color] duration-300 ease-out-strong",
```

Resulting timing: 150ms out + scroll + 250ms in ≈ 400ms, both halves ease-out. (`flex-grow` is still a layout property, but it is a two-element 4px bar; keep it — changing the indicator's structure is out of scope.)

## Repo conventions to follow

- `useRef` is already imported in this file (line ~1-10); `gsap` comes from `@/lib/gsap-client`; animation code sits in `useGSAP` — keep all of that.
- Reduced-motion idiom to copy: `src/components/ui/MobileStickyCTA.tsx:28-44` (keep the fade, drop the travel).
- `cn()` for conditional classes.

## Steps

1. Add `const reduceMotion = …` and `const isTransitioningRef = useRef(false);` next to the existing refs (after `lastGuestCountRef` at line 243).
2. Replace the mount tween (lines 246–252) with the target version.
3. Replace `animateOut` (lines 254–265) with the target version.
4. Change the step-indicator class at line 538 as shown.

## Boundaries

- Do NOT change `goNext` / `goBack` / `scrollToFormStart` / `handleSubmit` logic beyond what `animateOut` now guards.
- Do NOT touch the booking sub-components (plan 002) or button classes (plan 001).
- Do NOT add dependencies.
- If the code at a cited line differs from the excerpt (drift since `e834e03`), STOP and report.

## Verification

- **Mechanical**: `npm run typecheck`, `npm run lint` exit 0. `grep -n "transition-all" src/components/BookFlow.tsx` returns nothing (after plan 001 the button lines are also clean).
- **Feel check** on `http://localhost:3000/book` (fill Step 1 validly first):
  - Press Continue: Step 2 is readable in well under half a second; the outgoing step starts fading immediately (no hesitation).
  - Double-tap Continue as fast as you can: you land on Step 2, never the success screen / never skip.
  - Press Back then Continue rapidly: no stuck invisible step (the `overwrite: "auto"` on both tweens retargets).
  - Progress bar grows over ~300ms with an ease-out curve.
  - Rendering → `prefers-reduced-motion: reduce`: steps cross-fade with no vertical travel.
- **Done when**: the four feel checks pass at 375px and 1440px.
