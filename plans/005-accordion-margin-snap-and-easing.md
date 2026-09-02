# 005 — Remove the 20px snap at the start of every FAQ open/close and switch the accordions to ease-out

- **Status**: TODO
- **Commit**: e834e03
- **Severity**: MEDIUM (high frequency — FAQs on /book, all three service pages, /about; mobile nav submenu)
- **Category**: Interruptibility (transition list) + Easing & duration
- **Estimated scope**: 3 files — `src/components/ui/FAQAccordion.tsx`, `src/components/about/AboutBioContent.tsx`, `src/components/Navbar.tsx`. Tiny.
- **Depends on**: 001 (uses `ease-out-strong`; if absent, substitute `ease-[cubic-bezier(0.23,1,0.32,1)]`).

## Problem

The accordion is correctly a CSS transition (interruptible), but `mt-5` is toggled on the same element while only `grid-template-rows` and `opacity` are transitioned — so the 1.25rem margin snaps on frame 1 of every open and close while the rows interpolate, a visible jolt in the content below. The easing is `ease-in-out`; open/close is an enter/exit and should be ease-out.

```tsx
// src/components/ui/FAQAccordion.tsx:103-114 — current
<div
  id={answerId}
  aria-hidden={!isOpen}
  className={cn(
    "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
    isOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
  )}
>
  <div className="overflow-hidden">
    <p className={cn(featureItemBodyClass, "max-w-3xl pr-8")}>{faq.answer}</p>
  </div>
</div>
```
```tsx
// src/components/about/AboutBioContent.tsx:493-497 — current (same pattern)
<div
  className={cn(
    "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
    isOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
  )}
>
```
```tsx
// src/components/Navbar.tsx:582-589 — current (mobile submenu; no margin toggle, easing only)
<div
  aria-hidden={mobileExpanded !== link.label}
  className={clsx(
    "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
    mobileExpanded === link.label
      ? "grid-rows-[1fr] opacity-100"
      : "grid-rows-[0fr] opacity-0"
  )}
>
```

## Target

Move the spacing *inside* the clipped wrapper as padding so it animates with the track, and use a strong ease-out at 250ms.

```tsx
// src/components/ui/FAQAccordion.tsx — target
<div
  id={answerId}
  aria-hidden={!isOpen}
  className={cn(
    "grid transition-[grid-template-rows,opacity] duration-250 ease-out-strong",
    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
  )}
>
  <div className="overflow-hidden">
    <p className={cn(featureItemBodyClass, "max-w-3xl pr-8 pt-5")}>{faq.answer}</p>
  </div>
</div>
```
```tsx
// src/components/about/AboutBioContent.tsx:493-497 — target
"grid transition-[grid-template-rows,opacity] duration-250 ease-out-strong",
isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
// …and add `pt-5` to the first child INSIDE the `overflow-hidden` wrapper that follows (read lines 498-505 to find it; if the structure is not "grid > overflow-hidden > content", STOP and report).
```
```tsx
// src/components/Navbar.tsx:585 — target (easing only)
"grid transition-[grid-template-rows,opacity] duration-250 ease-out-strong",
```

## Repo conventions to follow

- Spacing on text uses `rem`-based Tailwind utilities (`pt-5` = 1.25rem, same as the removed `mt-5`) — CLAUDE.md sizing rule.
- `cn()` / `clsx` for conditional classes as already used in each file.
- `duration-250` is valid in Tailwind v4 (dynamic `duration-<number>`).

## Steps

1. `FAQAccordion.tsx`: edit the class strings at lines 107–108 and add `pt-5` to the `<p>` at line 111 as shown.
2. `AboutBioContent.tsx`: edit lines 495–496; add `pt-5` to the inner content element per the target note.
3. `Navbar.tsx`: edit line 585.

## Boundaries

- Do NOT change ARIA attributes, ids, or open/close state logic.
- Do NOT touch the GSAP scroll reveal in `FAQAccordion.tsx:40-66`.
- If the structure at a cited line differs (drift since `e834e03`), STOP and report.

## Verification

- **Mechanical**: `npm run typecheck`, `npm run lint` exit 0; `grep -rn "ease-in-out" src/components` returns nothing for these three files.
- **Feel check** on `http://localhost:3000/services/weddings` (FAQ section), `/about`, and the mobile nav at 375px:
  - DevTools → Animations panel at 10%: clicking a question, the content below slides smoothly from the first frame — no initial jump. Same on close.
  - Click two questions in quick succession: the first reverses mid-motion (no restart).
  - Open a mobile nav submenu: same smooth ease-out.
- **Done when**: no visible jolt at open/close start on all three surfaces.
