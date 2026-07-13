---
name: gsap-css-safety
description: Prevents GSAP tweens from fighting CSS so scroll reveals and entrances finish correctly. Use when adding or fixing GSAP (especially ScrollTrigger) on React/Next.js + Tailwind pages, when elements look stuck at partial opacity or offset, when debugging staggered card reveals, or when pairing hover motion with `useGSAP` / `gsap.from` / `gsap.fromTo`.
---

# GSAP + CSS safety

## When this applies

Read this skill before writing or fixing GSAP on DOM that also uses Tailwind/CSS transitions or hover transforms. Typical failure mode: **elements stay faded, offset, or “half animated”** after scroll or on staggered children.

## Root cause (most common)

**GSAP and CSS both drive the same properties** on the same node, usually:

- `transform` / `translate` — GSAP `x` / `y` / `xPercent` / `scale` vs Tailwind `hover:-translate-y-*`, `transition-all`, or `transition-transform`
- `opacity` — GSAP `opacity` / `autoAlpha` vs `transition-all` or `transition-opacity` on the same element

`transition-all` is especially dangerous: it transitions every animatable property GSAP touches.

## Hard rules

1. **Never put `transition-all` on an element GSAP animates** for entrance or scroll (transform or opacity).
2. **Do not use hover translate on the same node GSAP moves** (`hover:-translate-y-*`, `group-hover:translate-*`, etc.). Either:
   - Animate that node with GSAP only, or
   - Move hover lift to an **inner** wrapper that GSAP does not target.
3. **Prefer limited transitions** on GSAP-driven surfaces: e.g. `transition-[box-shadow,border-color]` (or `transition-shadow`) for card chrome only.
4. **Scroll reveals**: prefer `gsap.fromTo(fromVars, { ...toVars, scrollTrigger: { once: true, ... } })` with explicit end state (`y: 0`, `opacity: 1`) instead of bare `from()` when the section must always resolve to a readable final state.
5. **Keep using project rules**: `useGSAP` with `{ scope: containerRef }`, `ScrollTrigger` registered once, `cn()` for classes — this skill does not replace those.

## Safe patterns (copy-paste shape)

**Card GSAP target — border hover only (shadow stays at rest; `shadow-card-hover` is deprecated):**

```tsx
className="... shadow-card transition-[border-color] duration-300 hover:border-primary/20"
```

**Card with hover lift — lift the inner shell, not the GSAP target:**

```tsx
<div ref={containerRef} className="benefit-card ...">
  <div className="transition-transform duration-300 group-hover:-translate-y-1">
    {/* content */}
  </div>
</div>
```

**Scroll reveal — explicit end + once:**

```ts
gsap.fromTo(
  ".card",
  { y: 40, opacity: 0 },
  {
    scrollTrigger: { trigger: containerRef.current, start: "top 75%", once: true },
    y: 0,
    opacity: 1,
    duration: 0.8,
    stagger: 0.15,
    ease: "power3.out",
  }
);
```

## Quick audit (before shipping)

Search the file you animated for:

- `transition-all` on the same class string GSAP selects
- `hover:-translate` / `group-hover:-translate` on GSAP targets
- `gsap.from(` without a clear final state on scroll sections — consider `fromTo` + `once: true`

## What this skill does *not* cover

Scrub timelines, pinning, and complex `ScrollTrigger` choreography — only **property ownership** between CSS and GSAP so tweens can complete.
