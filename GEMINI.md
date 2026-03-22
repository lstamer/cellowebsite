# Stamer Cello Website — Agent Guide

## Stack
Next.js 15 (App Router), TypeScript, Tailwind CSS, GSAP, Sanity CMS

## Hard Rules (never violate)
- Tailwind CSS only — no inline styles, no CSS modules (GSAP transform exceptions OK)
- REM for spacing/sizing — px only for 1px borders
- CSS variables for colors — no hardcoded hex values in components
- App Router only — `next/navigation`, not `next/router`; `<Link>` not `<a>` for internal links
- GSAP for animations — `useGSAP` hook with cleanup context
- Always use `SectionWrapper` for section padding
- `clsx` + `tailwind-merge` (`cn()`) for conditional classes
- TypeScript strict — no `any`
- Check `src/components/` before creating new components

## Brand & Design System

### Personality
Premium event cellist brand — refined, warm, editorial. Think high-end event branding, not tech startup.
- Taglines: present-tense elegance — *"Music is the Memory"*, *"Elevate your celebration"*
- CTAs are invitations: *"Book a Performance"*, *"Let's talk"* — not commands ("Get", "Buy")
- Never: exclamation marks, buzzwords ("world-class", "seamless"), clinical or corporate tone

### Colors (CSS variables only — never hardcode hex)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#2E4036` | Headings, buttons, borders, labels |
| `accent` | `#CC5833` | Highlights, hover shadows, emphasis |
| `background` | `#F2F0E9` | Page background, card fills |
| `foreground` | `#1A1A1A` | Body text |
| `surface-dark` | `#1A1A1A` | Dark sections (CTA, Problem) |
| `surface-darker` | `#111111` | Footer |
| `success` | `#34D399` | Status badges |

Approved opacity stops: `/5 /10 /15 /20 /40 /50 /60 /70 /80` — do not invent others.

Shadows:
- `shadow-card` → subtle lift on cards
- `shadow-card-hover` → accent-tinted on hover
- Always pair: `shadow-card hover:shadow-card-hover` on interactive cards

### Typography (four fonts, strict roles — never swap)

| Class | Font | Use For |
|-------|------|---------|
| `font-serif italic` | Cormorant Garamond | Section headings, hero subtitle, pull quotes |
| `font-display` | Plus Jakarta Sans | Labels, buttons, uppercase callouts |
| `font-sans` | Outfit | Body text, descriptions, form fields |
| `font-mono` | IBM Plex Mono | Metadata, timestamps, badges, step numbers |

Never use: Inter, Roboto, Arial, Space Grotesk, or system fonts.

Section heading pattern (or use `<SectionHeader>` component):
```tsx
<p className="font-display text-primary text-sm tracking-widest uppercase font-bold mb-4">Label</p>
<h2 className="font-serif italic text-4xl md:text-5xl text-foreground">Heading</h2>
```
Body: `text-lg leading-relaxed text-foreground/80` · Secondary: `text-sm text-foreground/60` · Max width: `max-w-prose`

### Component Primitives (check `src/components/` before building anything)

**SectionWrapper** — wrap every `<section>`, never manually add section padding:
```tsx
<SectionWrapper id="about" maxWidth="max-w-7xl" className="bg-background">
  {/* content */}
</SectionWrapper>
```
Props: `id?`, `className?`, `maxWidth?: "max-w-5xl" | "max-w-7xl" | "max-w-none"`

**SectionHeader** — always use for label + heading pairs:
```tsx
<SectionHeader label="About" heading="Music made for your moment" alignment="center" />
```

**Button** — Link-based, never `<a>` for navigation CTAs. Always `rounded-full`.
```tsx
<Button href="/contact" variant="primary" size="md">Book a Performance</Button>
```
Variants: `primary` (dark bg), `secondary` (dark section), `ghost` (light bg), `white` (outlined)
Sizes: `sm`, `md` (default), `lg`

**Card pattern:**
```tsx
className="group relative bg-background border border-primary/10 rounded-card p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
```

**Standard grids:**
```tsx
// 3-col: "grid grid-cols-1 md:grid-cols-3 gap-8"
// 2-col: "grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
// 4-col: "grid grid-cols-2 md:grid-cols-4 gap-8"
```

### Animations (GSAP only — no Framer Motion, no CSS keyframes for scroll animations)

Setup pattern for every animated component:
```tsx
"use client"
import { useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

export function MyComponent() {
  const containerRef = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    gsap.from(".target", {
      scrollTrigger: { trigger: containerRef.current, start: "top 75%" },
      y: 40, opacity: 0, duration: 1, stagger: 0.12, ease: "power3.out",
    })
  }, { scope: containerRef })
  return <div ref={containerRef}>...</div>
}
```

- Always `useGSAP` with `{ scope: containerRef }` — never bare `useEffect` for GSAP
- `y` offset: 40–50px · `duration`: 0.8–1.2s · `stagger`: 0.08–0.15s · `ease`: `"power3.out"`
- Hover/micro-interactions: CSS transitions (`transition-all duration-300`), not GSAP

## Visual Verification with Puppeteer (mandatory)

After **any** UI change or new page creation, take a Puppeteer screenshot and inspect it before marking work done. Puppeteer is already installed (`node_modules/puppeteer`).

Write to `/tmp/ss.mjs` and run `node /tmp/ss.mjs`:
```js
import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/YOUR_ROUTE", { waitUntil: "networkidle2", timeout: 10000 });
await p.screenshot({ path: "/tmp/ss.png" });
await b.close();
```
Open `/tmp/ss.png` and inspect it. Fix any visual issues before finishing.

- Screenshot the specific route you changed (e.g. `/blog`, `/book`, `/`)
- Test both desktop (1440×900) and mobile (375×812) for new pages
- Dev server runs at `http://localhost:3000`

## Design Workflow
1. Check `src/components/` for existing components to reuse
2. Validate hard rules before finishing
3. Take a Puppeteer screenshot of the changed route and inspect it
4. Fix any visual issues before marking done
