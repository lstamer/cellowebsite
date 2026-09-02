# 002 — Make the four booking-form popovers open from their trigger, exit with ease-out, survive rapid toggling, and respect reduced motion

- **Status**: TODO
- **Commit**: e834e03
- **Severity**: HIGH
- **Category**: Physicality & origin + Easing & duration + Interruptibility + Accessibility
- **Estimated scope**: 4 files — `src/components/booking/EventTypeDropdown.tsx`, `CalendarPicker.tsx`, `PhoneInput.tsx`, `LocationAutocomplete.tsx`. Medium (same edit ×3, plus one class-only change).
- **Depends on**: 001 (uses the `ease-out-strong` utility it introduces; if 001 is not applied, substitute `ease-[cubic-bezier(0.23,1,0.32,1)]`).

## Problem

Every user of the enquiry form opens these. Four separate defects share one fix pattern:

1. **Two of three animated popovers scale from their centre, not their trigger.** `EventTypeDropdown.tsx:124` uses the class `transform-origin-top`, which is not a Tailwind utility (the real one is `origin-top`) and is defined nowhere, so the `scaleY: 0.95 → 1` tween grows the panel upward into its own button. `PhoneInput.tsx:250` has no origin class at all. (`CalendarPicker.tsx:171` correctly has `origin-top`.)

   ```tsx
   // src/components/booking/EventTypeDropdown.tsx:121-124 — current
   <div
     ref={dropdownRef}
     role="listbox"
     aria-labelledby={labelId}
     className="absolute z-50 top-full left-0 right-0 mt-2 p-2 bg-background border border-foreground/10 rounded-input shadow-card hidden transform-origin-top"
   ```
   ```tsx
   // src/components/booking/PhoneInput.tsx:248-250 — current
   <div
     ref={dropdownRef}
     className="absolute z-20 top-full left-0 w-[320px] max-w-[calc(100vw-2rem)] mt-2 bg-background border border-foreground/10 rounded-input shadow-card hidden flex-col"
   ```

2. **Exits use `power2.in`** (starts slow — delays the frame the user is watching). The playbook rule: entering *or* exiting → ease-out.

3. **Open/close are two competing tweens with no `overwrite`, and open is a `fromTo` that restarts from `opacity: 0`.** Click-outside then re-click within 200ms snaps the panel to invisible and replays it.

   ```ts
   // src/components/booking/EventTypeDropdown.tsx:60-73 — current (CalendarPicker.tsx:60-78 and PhoneInput.tsx:184-197 are identical apart from display:"flex" in PhoneInput)
   useGSAP(() => {
     if (!dropdownRef.current) return;
     if (isOpen) {
       gsap.fromTo(
         dropdownRef.current,
         { opacity: 0, scaleY: 0.95, y: -8 },
         { opacity: 1, scaleY: 1, y: 0, duration: 0.25, ease: "power3.out", display: "block" }
       );
     } else {
       gsap.to(dropdownRef.current, {
         opacity: 0, scaleY: 0.95, y: -8, duration: 0.2, ease: "power2.in", display: "none"
       });
     }
   }, [isOpen]);
   ```

4. **No reduced-motion branch** — `scaleY`/`y` movement runs regardless of the OS setting. (DESIGN.md line 201 requires a reduced-motion alternative for every GSAP animation.)

5. **The "Something else" text field is revealed by tweening `height: 0 → "auto"`** — a layout property relaid out every frame for 350ms, and collapsed with `power2.in`:

   ```ts
   // src/components/booking/EventTypeDropdown.tsx:75-89 — current
   useGSAP(() => {
     if (!otherInputRef.current) return;
     if (value === "something-else") {
       gsap.fromTo(
         otherInputRef.current,
         { height: 0, opacity: 0 },
         { height: "auto", opacity: 1, duration: 0.35, ease: "power3.out" }
       );
     } else {
       gsap.to(otherInputRef.current, {
         height: 0, opacity: 0, duration: 0.3, ease: "power2.in"
       });
     }
   }, [value]);
   ```
   ```tsx
   // src/components/booking/EventTypeDropdown.tsx:155-159 — current
   <div
     ref={otherInputRef}
     aria-hidden={value !== "something-else"}
     className="overflow-hidden h-0 opacity-0"
   >
   ```

6. **`LocationAutocomplete` is the only popover with no entrance at all** — it is conditionally mounted and teleports in under the cursor while the user types:

   ```tsx
   // src/components/booking/LocationAutocomplete.tsx:267-268 — current
   {shouldShowDropdown && (
     <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-card">
   ```

## Target

### 2a. Shared GSAP pattern for EventTypeDropdown / CalendarPicker / PhoneInput

Replace each popover's single `useGSAP(..., [isOpen])` with **two** `useGSAP` calls: one that sets the closed state once on mount, and one that retargets with `gsap.to` + `overwrite: "auto"` in both directions.

```ts
// target — identical in all three files; DISPLAY is "block" for EventTypeDropdown and CalendarPicker, "flex" for PhoneInput
const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Closed resting state, applied once so the first open retargets from it.
useGSAP(() => {
  if (!dropdownRef.current) return;
  gsap.set(
    dropdownRef.current,
    reduceMotion ? { opacity: 0 } : { opacity: 0, scaleY: 0.95, y: -8 }
  );
});

useGSAP(() => {
  const el = dropdownRef.current;
  if (!el) return;
  if (isOpen) {
    gsap.to(el, {
      display: DISPLAY,           // non-"none" display values apply at tween start
      opacity: 1,
      scaleY: 1,
      y: 0,
      duration: reduceMotion ? 0.15 : 0.2,
      ease: "power3.out",
      overwrite: "auto",
    });
  } else {
    gsap.to(el, {
      opacity: 0,
      ...(reduceMotion ? {} : { scaleY: 0.95, y: -8 }),
      duration: reduceMotion ? 0.1 : 0.15,
      ease: "power2.out",
      overwrite: "auto",
      display: "none",            // GSAP applies display:"none" at tween END (CSSPlugin _renderNonTweeningValueOnlyAtEnd)
    });
  }
}, [isOpen]);
```

Notes for the executor:
- `reduceMotion` must be computed inside the component body (or inside the callbacks) — never at module scope (SSR has no `window`).
- `useGSAP(cb)` with no dependency argument runs once on mount — that is intended for the `gsap.set` call.
- Do not reintroduce `fromTo` — the whole point is retargeting from the current value.

### 2b. Origins

```tsx
// src/components/booking/EventTypeDropdown.tsx:124 — target (transform-origin-top → origin-top)
className="absolute z-50 top-full left-0 right-0 mt-2 p-2 bg-background border border-foreground/10 rounded-input shadow-card hidden origin-top"
```
```tsx
// src/components/booking/PhoneInput.tsx:250 — target (add origin-top)
className="absolute z-20 top-full left-0 w-[320px] max-w-[calc(100vw-2rem)] mt-2 bg-background border border-foreground/10 rounded-input shadow-card hidden flex-col origin-top"
```

### 2c. "Something else" field: CSS grid-rows reveal instead of a height tween

Delete the second `useGSAP` (lines 75–89) and the `otherInputRef` ref entirely; drive it with classes (same mechanism `src/components/ui/FAQAccordion.tsx:104-111` already uses):

```tsx
// src/components/booking/EventTypeDropdown.tsx:155-159 — target
<div
  aria-hidden={value !== "something-else"}
  className={cn(
    "grid transition-[grid-template-rows,opacity] duration-200 ease-out-strong motion-reduce:transition-[opacity]",
    value === "something-else" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
  )}
>
  <div className="overflow-hidden">
    {/* existing <input …> and the {otherError && …} block move inside this wrapper, unchanged */}
  </div>
</div>
```
The `<input>` keeps its `mt-2`; because the inner wrapper is `overflow-hidden` the margin is part of the clipped content and animates with the track.

### 2d. LocationAutocomplete: CSS entrance via `@starting-style`

```tsx
// src/components/booking/LocationAutocomplete.tsx:268 — target (classes only; markup unchanged)
<div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 origin-top overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-card transition-[opacity,transform] duration-200 ease-out-strong starting:opacity-0 starting:scale-y-95 motion-reduce:starting:scale-y-100">
```
(`starting:` is Tailwind v4's `@starting-style` variant; it animates the first paint after mount. Exit stays instant — acceptable for a list that unmounts on selection.)

## Repo conventions to follow

- GSAP is imported from `@/lib/gsap-client`, animations live inside `useGSAP` from `@gsap/react` — keep that (see `src/components/ui/MobileStickyCTA.tsx:23-57` for a paused/retargeting tween done right).
- Reduced-motion check pattern to copy: `src/components/ui/WhatsAppFab.tsx:18-21` (`window.matchMedia("(prefers-reduced-motion: reduce)").matches`).
- Tailwind only; `cn()` from `@/lib/utils` for conditional classes.

## Steps

1. `EventTypeDropdown.tsx`: replace lines 60–73 with the 2a pattern (`DISPLAY = "block"`). Replace lines 75–89 (second `useGSAP`) by deleting them; delete the `otherInputRef` declaration (line ~37) and its import usage if now unused. Apply 2b to line 124. Apply 2c to lines 155–159, wrapping the `<input>` and the `{otherError && …}` block in the new inner `<div className="overflow-hidden">`.
2. `CalendarPicker.tsx`: replace lines 60–78 with the 2a pattern (`DISPLAY = "block"`). Line 171 already has `origin-top` — leave it.
3. `PhoneInput.tsx`: replace lines 184–197 with the 2a pattern (`DISPLAY = "flex"`). Apply 2b to line 250.
4. `LocationAutocomplete.tsx`: apply 2d to line 268.

## Boundaries

- Do NOT change any ARIA attributes, ids, click-outside/escape handlers, or option rendering.
- Do NOT touch `BookFlow.tsx` (plan 003) or `GuestSlider.tsx`.
- Do NOT add dependencies.
- If the code at a cited line differs from the excerpt (drift since `e834e03`), STOP and report.

## Verification

- **Mechanical**: `npm run typecheck`, `npm run lint` exit 0; `grep -rn "transform-origin-top" src` returns nothing; `grep -n "otherInputRef\|height: \"auto\"" src/components/booking/EventTypeDropdown.tsx` returns nothing.
- **Feel check** on `http://localhost:3000/book`:
  - Open Event Type and the phone country list: the panel visibly grows *down from the trigger* (DevTools → Animations panel at 10% speed makes the origin obvious). Calendar unchanged.
  - Click the Event Type trigger three times quickly: the panel never flashes to invisible mid-motion; it reverses from wherever it was.
  - Close any popover: it fades out starting immediately (no "hesitation" at the start), gone in ~150ms; the element has `display:none` afterwards (Elements panel).
  - Pick "Something else": the text field unfolds over 200ms with no jump; pick another option: it folds closed.
  - Type "Cape Town" in the venue field: the suggestions list fades/scales in rather than popping.
  - Rendering → `prefers-reduced-motion: reduce`: popovers only fade; no scale or vertical travel.
- **Done when**: all of the above hold at 1440px and 375px widths.
