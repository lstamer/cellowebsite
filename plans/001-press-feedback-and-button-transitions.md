# 001 — Add press feedback to every pressable, and fix the `.btn-magnetic` rule that silently kills Button colour transitions

- **Status**: TODO
- **Commit**: e834e03
- **Severity**: HIGH
- **Category**: Physicality & origin (press feedback) + Performance/Cohesion (transition clobbering) + Accessibility (ungated `:hover` transforms)
- **Estimated scope**: 6 files — `src/app/globals.css`, `src/components/ui/Button.tsx`, `src/components/BookFlow.tsx`, `src/components/ui/MobileStickyCTA.tsx`, `src/components/booking/CalendarPicker.tsx`. Small, mechanical.

## Problem

1. **No pressable element on the site has press feedback.** `grep -rE "active:|:active" src` returns 0 hits. Buttons grow 3% on hover (`.btn-magnetic`) but do nothing when actually pressed. On a WhatsApp-first, mobile-heavy site, the tap is the interaction; it currently feels dead.

2. **`.btn-magnetic` is an unlayered CSS rule, so it beats every Tailwind utility (which live in `@layer utilities`).** Its `transition: transform …` shorthand resets `transition-property` to `transform` only, so the `transition-colors duration-300` on every `Button` never runs — the `hover:bg-primary/90` fade is instant today.

   ```css
   /* src/app/globals.css:66-79 — current */
   /* Micro-Interactions Base Styles */
   .btn-magnetic {
     transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
   }
   .btn-magnetic:hover {
     transform: scale(1.03);
   }

   .link-hover {
     transition: transform 0.2s ease;
   }
   .link-hover:hover {
     transform: translateY(-1px);
   }
   ```

   ```tsx
   // src/components/ui/Button.tsx:26 — current
   const baseStyles = "btn-magnetic inline-flex min-h-11 items-center justify-center rounded-full font-normal transition-colors duration-300";
   ```

3. **Both raw `:hover` transforms are ungated** — on touch devices a tap triggers the hover state and it sticks (the button stays at 1.03 until the user taps elsewhere). Tailwind's `hover:` variant is gated by `@media (hover: hover)` automatically; these hand-written rules are not.

4. Several high-intent pressables use `transition-all` (animates every property, off-GPU) or plain `transition-colors`:

   ```tsx
   // src/components/BookFlow.tsx:756 — current (Continue button)
   "mt-4 w-full rounded-full font-semibold px-8 py-4 transition-all duration-300",
   ```
   ```tsx
   // src/components/BookFlow.tsx:911 — current (Back button)
   className="rounded-full font-semibold px-6 py-4 border border-foreground/20 text-foreground/60 hover:border-foreground/40 transition-colors disabled:opacity-40"
   ```
   ```tsx
   // src/components/BookFlow.tsx:920 — current (Send inquiry button)
   "flex-1 rounded-full px-8 py-4 font-semibold transition-all duration-300",
   ```
   ```tsx
   // src/components/BookFlow.tsx:509 — current (WhatsApp fast-lane link)
   className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-[1.429em] py-[0.714em] font-sans text-sm font-semibold text-on-dark transition-colors duration-300 hover:bg-primary/90"
   ```
   ```tsx
   // src/components/ui/MobileStickyCTA.tsx:63-64 — current
   const actionClass =
     "flex min-h-11 items-center justify-center gap-[0.5em] rounded-full px-[1.143em] py-[0.786em] font-sans text-sm transition-colors duration-300";
   ```
   ```tsx
   // src/components/booking/CalendarPicker.tsx:125 — current (each day button)
   "flex h-10 w-10 items-center justify-center rounded-full font-sans text-sm transition-colors",
   ```

## Target

Introduce two motion tokens and one utility, then use them.

```css
/* src/app/globals.css — inside the existing `@theme inline { … }` block, after --shadow-card */
--ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
```
(Tailwind v4 turns `--ease-*` theme tokens into `ease-out-strong` / `ease-in-out-strong` utility classes automatically. Do NOT name them `--ease-out` / `--ease-in-out` — that would override Tailwind's built-in `ease-out` and change 11 existing usages.)

```css
/* src/app/globals.css — replaces the whole "Micro-Interactions Base Styles" block */
/* Micro-Interactions Base Styles */
.btn-magnetic {
  transition-property: transform, background-color, border-color, color;
  transition-duration: 160ms, 300ms, 300ms, 300ms;
  transition-timing-function: var(--ease-out-strong), ease, ease, ease;
}
@media (hover: hover) and (pointer: fine) {
  .btn-magnetic:hover {
    transform: scale(1.03);
  }
}
.btn-magnetic:active {
  transform: scale(0.97);
}

.link-hover {
  transition: transform 0.2s ease;
}
@media (hover: hover) and (pointer: fine) {
  .link-hover:hover {
    transform: translateY(-1px);
  }
}

/* Press feedback for pressables that are not <Button>. Owns the element's
   transition list, so remove `transition-colors` / `transition-all` when adding it. */
@utility pressable {
  transition-property: transform, background-color, border-color, color, opacity;
  transition-duration: 160ms, 300ms, 300ms, 300ms, 300ms;
  transition-timing-function: var(--ease-out-strong), ease, ease, ease, ease;
  &:active {
    transform: scale(0.97);
  }
}
```

And extend the existing reduced-motion block (keep the press feedback — it is feedback, not decoration — drop the hover lifts):

```css
/* src/app/globals.css — add inside the existing @media (prefers-reduced-motion: reduce) { … } */
.btn-magnetic:hover,
.link-hover:hover {
  transform: none;
}
```

Component targets:

```tsx
// src/components/ui/Button.tsx:26 — target (btn-magnetic now owns the colour transition)
const baseStyles = "btn-magnetic inline-flex min-h-11 items-center justify-center rounded-full font-normal";
```
```tsx
// src/components/BookFlow.tsx:756 — target
"pressable mt-4 w-full rounded-full font-semibold px-8 py-4",
```
```tsx
// src/components/BookFlow.tsx:911 — target
className="pressable rounded-full font-semibold px-6 py-4 border border-foreground/20 text-foreground/60 hover:border-foreground/40 disabled:opacity-40"
```
```tsx
// src/components/BookFlow.tsx:920 — target
"pressable flex-1 rounded-full px-8 py-4 font-semibold",
```
```tsx
// src/components/BookFlow.tsx:509 — target
className="pressable inline-flex items-center justify-center gap-2 rounded-full bg-primary px-[1.429em] py-[0.714em] font-sans text-sm font-semibold text-on-dark hover:bg-primary/90"
```
```tsx
// src/components/ui/MobileStickyCTA.tsx:63-64 — target
const actionClass =
  "pressable flex min-h-11 items-center justify-center gap-[0.5em] rounded-full px-[1.143em] py-[0.786em] font-sans text-sm";
```
```tsx
// src/components/booking/CalendarPicker.tsx:125 — target
"pressable flex h-10 w-10 items-center justify-center rounded-full font-sans text-sm",
```

## Repo conventions to follow

- Design tokens live in the `@theme inline { … }` block at the top of `src/app/globals.css` (see `--shadow-card` at line 33 for the pattern). Custom utilities belong in the same file; `@layer utilities { .text-balance … }` at line 45 is the existing precedent — use `@utility pressable` (Tailwind v4 syntax) rather than `@layer` so variants compose.
- Tailwind only, no inline styles (CLAUDE.md hard rule). `px`-based timing values are fine in CSS.
- Exemplar of the end state we want on a pressable: none exists yet — this plan creates it.

## Steps

1. `src/app/globals.css`: add `--ease-out-strong` and `--ease-in-out-strong` inside `@theme inline`, directly after `--shadow-card: 0 8px 30px rgba(0,0,0,0.04);`.
2. `src/app/globals.css`: replace lines 66–79 (the `.btn-magnetic` / `.link-hover` block) with the target CSS above, including the `@utility pressable` block.
3. `src/app/globals.css`: inside the existing `@media (prefers-reduced-motion: reduce)` block (line 57), add the `.btn-magnetic:hover, .link-hover:hover { transform: none; }` rule after the existing `.gsap-reveal` rule.
4. `src/components/ui/Button.tsx:26`: remove `transition-colors duration-300` from `baseStyles`.
5. `src/components/BookFlow.tsx`: at lines 509, 756, 911, 920 apply the target class strings (add `pressable`, remove `transition-all duration-300` / `transition-colors duration-300` / `transition-colors`).
6. `src/components/ui/MobileStickyCTA.tsx:63-64`: apply the target `actionClass`.
7. `src/components/booking/CalendarPicker.tsx:125`: apply the target class string.

## Boundaries

- Do NOT touch `src/components/ui/FAQAccordion.tsx` or the Navbar hamburger — scaling a full-width text row or a 24px icon by 3% is imperceptible/odd; leave them.
- Do NOT change markup, colours, sizes, or copy — class strings and CSS only.
- Do NOT remove `.btn-magnetic` from `WhatsAppFab.tsx:42`; it inherits the fix.
- Do NOT add dependencies.
- If a cited line no longer matches (drift since `e834e03`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run typecheck` and `npm run lint` exit 0. `npm run build` succeeds (confirms Tailwind v4 accepted `@utility` and the theme tokens). `grep -rn "transition-all" src` should now return only `src/components/Navbar.tsx:541` and `:547` (hamburger bars, handled elsewhere).
- **Feel check** (dev server, `http://localhost:3000` and `/book`):
  - Hover a hero `Button`: background now visibly fades over 300ms (it was instant before); scale to 1.03 still happens.
  - Press and hold any button: it shrinks to 0.97 within ~160ms; release snaps back. Check the hero CTA, the `/book` Continue/Back/Send buttons, the sticky mobile bar at 375px width, and a calendar day cell.
  - DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`: hover scale and nav-link lift are gone; press shrink remains.
  - DevTools device toolbar (touch emulation, 375px): tapping a button no longer leaves it stuck at 1.03 after the tap.
- **Done when**: all mechanical checks pass and the three feel checks behave as described on both desktop and 375px viewports.
