---
name: brand-consistency
description: Enforces Stamer Cello website brand standards — color tokens, typography system, component primitives, and GSAP animation patterns. Read before ANY design work on this project.
triggers:
  - building UI components
  - creating pages
  - editing existing components
  - any React/Next.js component creation
  - design work on cellowebsite
---

# Stamer Cello — Brand Consistency Skill

You are working on the **Stamer Cello** website — a premium event cellist brand. Every output must match the established design system exactly. No improvisation on colors, fonts, or animation libraries.

---

## 1. Color System

All colors use CSS variables. **Never write hardcoded hex values in components.**

### Palette

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#2E4036` | Headings, buttons, borders, labels |
| `accent` | `#CC5833` | Highlights, hover shadows, emphasis |
| `background` | `#F2F0E9` | Page background, card fills |
| `foreground` | `#1A1A1A` | Body text, dark surfaces |
| `surface-dark` | `#1A1A1A` | Dark sections (Problem, CTA) |
| `surface-darker` | `#111111` | Footer background |
| `success` | `#34D399` | Status indicators ("Accepting Bookings") |

### Approved Opacity Stops

Use these exact stops — do not invent others:

```
/5   /10   /15   /20   /40   /50   /60   /70   /80
```

Examples: `text-foreground/80`, `bg-primary/10`, `border-primary/20`, `bg-accent/15`

### Shadow System

```
shadow-card         → 0 8px 30px rgba(0,0,0,0.04)
shadow-card-hover   → 0 8px 40px rgba(204,88,51,0.15)  ← accent-tinted
```

Always pair: `shadow-card hover:shadow-card-hover` on interactive cards.

---

## 2. Typography System

Four fonts, each with a strict role. **Never swap them.**

### Font Roles

| Class | Font | Use For |
|-------|------|---------|
| `font-serif italic` | Cormorant Garamond | Large section headings, hero subtitle, pull quotes |
| `font-display` | Plus Jakarta Sans | Labels, buttons, UI text, uppercase callouts |
| `font-sans` | Outfit | Body paragraphs, descriptions, form fields |
| `font-mono` | IBM Plex Mono | Metadata, timestamps, status badges, step numbers, nav micro-labels |

### Section Heading Pattern

Every section uses this two-part pattern — always in this order:

```tsx
{/* Label: small, uppercase, monospaced */}
<p className="font-display text-primary text-sm tracking-widest uppercase font-bold mb-4">
  {label}
</p>

{/* Heading: large, serif, italic */}
<h2 className="font-serif italic text-4xl md:text-5xl text-foreground">
  {heading}
</h2>
```

Use `<SectionHeader>` instead of hand-rolling this — it enforces the pattern automatically.

### Typography Rules

- **Serif** → headings and quotes only. Never body text.
- **Mono** → micro-copy only. Never headings or paragraphs.
- Body line width: `max-w-prose` or `max-w-2xl` for readability
- Body: `text-lg leading-relaxed text-foreground/80`
- Descriptions/secondary: `text-sm text-foreground/60`
- Uppercase labels always pair with `tracking-widest`

---

## 3. Component Primitives

Check `src/components/` before building anything. These components exist — use them.

### SectionWrapper (`src/components/ui/SectionWrapper.tsx`)

Wrap **every** `<section>` with this. Applies consistent spacing via CSS variables.

```tsx
<SectionWrapper id="about" maxWidth="max-w-7xl" className="bg-background">
  {/* content */}
</SectionWrapper>
```

Props: `id?`, `className?`, `maxWidth?: "max-w-5xl" | "max-w-7xl" | "max-w-none"`

Never manually write `py-24 px-6` on a section — use SectionWrapper.

### SectionHeader (`src/components/ui/SectionHeader.tsx`)

Use for any label + heading pair. Never hand-roll the two-part pattern.

```tsx
<SectionHeader
  label="About"
  heading="Music made for your moment"
  alignment="center"  // or "left"
/>
```

### Button (`src/components/ui/Button.tsx`)

Always Link-based (`next/link`). Never `<a>` or `<button>` for navigation CTAs.

```tsx
<Button href="/contact" variant="primary" size="md">
  Book a Performance
</Button>
```

| Variant | Background | Text | Use When |
|---------|-----------|------|----------|
| `primary` | `bg-primary` | `text-background` | Main CTAs |
| `secondary` | `bg-background/10 border` | `text-background` | Secondary on dark sections |
| `ghost` | `bg-background` | `text-primary` | Light background contexts |
| `white` | `bg-background border border-primary/10` | `text-primary` | Outlined style |

Sizes: `sm` (px-5 py-2.5), `md` (px-8 py-4), `lg` (px-10 py-5). Default: `md`.

Buttons are always `rounded-full`.

### Card Pattern

```tsx
className="group relative bg-background border border-primary/10 rounded-card p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
```

### Standard Grid Layouts

```tsx
// 3-column (Services, features):
className="grid grid-cols-1 md:grid-cols-3 gap-8"

// 2-column text + image:
className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"

// 4-column (footer, stats):
className="grid grid-cols-2 md:grid-cols-4 gap-8"
```

---

## 4. Animation Standards

**GSAP only** for all entrance and scroll animations. No Framer Motion, anime.js, or AOS.

### Setup Pattern (every animated component)

```tsx
"use client"
import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function MyComponent() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      // animations here
    },
    { scope: containerRef }
  )

  return <div ref={containerRef}>...</div>
}
```

Never use bare `useEffect` for GSAP — always `useGSAP` with `{ scope: containerRef }`.

### Entrance Animation (standard)

```ts
gsap.from(".target-class", {
  scrollTrigger: {
    trigger: containerRef.current,
    start: "top 75%",
  },
  y: 40,
  opacity: 0,
  duration: 1,
  stagger: 0.12,
  ease: "power3.out",
})
```

- `y` offset: 40–50px
- `duration`: 0.8–1.2s
- `stagger`: 0.08–0.15s (or `{ each: 0.12, from: "center" }` for centered layouts)
- `ease`: always `"power3.out"` for entrances

### Parallax Pattern

```ts
gsap.to(".parallax-target", {
  scrollTrigger: {
    trigger: containerRef.current,
    start: "top bottom",
    end: "bottom top",
    scrub: true,
  },
  y: -30,
})
```

### Hover / Micro-interactions

Use CSS transitions for hover — not GSAP:

```tsx
// Buttons:
className="transition-colors duration-300"  // + btn-magnetic class for scale

// Cards:
className="transition-all duration-300 hover:-translate-y-1"

// Links:
className="transition-transform duration-200 hover:-translate-y-px"  // link-hover class
```

### What NOT to Use

- ❌ Framer Motion
- ❌ `animate-*` Tailwind classes for entrance animations (fine for loaders/spinners)
- ❌ CSS `@keyframes` for scroll-triggered animations
- ❌ `useEffect` for GSAP

---

## 5. Hard Rules (never violate)

- **Tailwind CSS only** — no inline styles, no CSS modules (GSAP `transform` exception OK)
- **REM units** — px only for `border: 1px solid`
- **CSS variables for all colors** — no hardcoded hex in TSX/CSS
- **App Router** — `next/navigation` not `next/router`; `<Link>` not `<a>` for internal links
- **`cn()` for conditional classes** — `twMerge(clsx(...))`, never string concatenation
- **`"use client"`** only when component needs interactivity or browser APIs
- **TypeScript strict** — no `any`, define interfaces for all props
- **Check `src/components/`** before creating any new component

---

## 6. Brand Personality

**Tone**: Confident, refined, warm. Never clinical or corporate.

**Aesthetic**: Premium editorial minimalism — Cormorant headings, generous whitespace, earth tones. Think high-end event branding, not tech startup.

**Copy patterns**:
- Taglines use present-tense elegance: *"Music is the Memory"*, *"Elevate your celebration"*
- CTAs are invitations, not commands: *"Book a Performance"*, *"Let's talk"*
- Avoid: generic verbs ("Get", "Buy"), exclamation marks, buzzwords ("world-class", "seamless")

**Imagery**:
- Grayscale reduction: `grayscale-[15%]` to `grayscale-[20%]` — never full color or full grayscale
- Gradient overlays harmonize images with brand palette: `from-primary/40 via-transparent to-transparent`
- Object positioning is intentional: `object-left`, `object-center` — not always centered

---

## 7. Terminology

Design effect names the user may reference and how to implement them in this project.

### Scroll-Over / Overlay Scroll / Sticky Hero

The preceding section stays **pinned** (`sticky top-0`) at a lower `z-index` while the following section scrolls up and **covers** it. Used on the Hero: it stays fixed while Services and everything below slide over it.

**Implementation pattern (CSS-only, no GSAP pin needed):**

```tsx
{/* Pinned section — stays in place */}
<section className="sticky top-0 z-[1] h-[100dvh] ...">
  {/* hero content */}
</section>

{/* Overlay wrapper — scrolls over the pinned section */}
<div className="relative z-[2] bg-background">
  {/* all subsequent sections */}
</div>
```

Key rules:
- Pinned section gets `sticky top-0` + lower z-index (`z-[1]`)
- Overlay wrapper gets `relative` + higher z-index (`z-[2]`) + `bg-background` (must be opaque to cover)
- No GSAP `ScrollTrigger.pin()` needed — CSS sticky is simpler and more performant for this effect

### Card Stacking / Scroll Stack

Cards are `sticky top-{n}` within a tall scrollable container. As you scroll, new cards "stack" on top of previous ones. Previous cards can scale down / blur as they recede. Used in the Solution "3-step plan" section.

**Implementation pattern (CSS sticky + GSAP for recede effect):**

```tsx
{/* Each card is sticky so it stacks */}
<div className="sticky top-32 h-[60vh]">
  {/* card content */}
</div>
```

GSAP animates the *previous* card (`scale → 0.9`, `blur → 10px`, `opacity → 0.4`) as the *next* card's ScrollTrigger fires with `scrub: true`.
