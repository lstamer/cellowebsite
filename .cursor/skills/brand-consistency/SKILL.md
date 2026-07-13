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
| `background` | `#FFFFFF` | Default page background, white card fills |
| `cream` | `#F2F0E9` | Warm section bands only (wedding value/FAQ/benefits, newsletter, etc.) |
| `on-dark` | `#FFFFFF` | Text and icons on `surface-dark` / `surface-darker` / hero overlays |
| `foreground` | `#1A1A1A` | Body text, dark surfaces |
| `surface-dark` | `#1A1A1A` | Dark sections (Problem, CTA) |
| `surface-darker` | `#111111` | Footer background |
| `success` | `#34D399` | Status indicators ("Accepting Bookings") |

**Never** use `text-background` on dark sections — that token is page white, not hero/footer type. Use `text-on-dark` instead.

### Approved Opacity Stops

Use these exact stops only for text hierarchy, hairline borders, and animation states — do not invent others:

```
/5   /10   /15   /20   /40   /50   /60   /70   /80
```

Examples: `text-foreground/80`, `border-primary/20`, `opacity-0` in GSAP reveal setup.

Never use semi-transparent backgrounds as a section design idea. Avoid `bg-*/5`, `bg-*/10`, `backdrop-blur`, glass panels, washed-out overlays, and `via-transparent` on section surfaces or image treatments.

### Shadow System

```
shadow-card         → 0 8px 30px rgba(0,0,0,0.04)
```

`shadow-card` at rest is the only shadow. Hover feedback on interactive cards is positional (`hover:-translate-y-1`) or chromatic (border/text color shifts) — never a shadow change. The old coral `shadow-card-hover` glow is deprecated (see DESIGN.md).

---

## 2. Typography System

Four fonts, each with a strict role. **Never swap them.**

### Font Roles

| Class | Font | Use For |
|-------|------|---------|
| `font-serif italic` | Cormorant Garamond | Large section headings, hero subtitle, pull quotes |
| `font-display` | The Seasons | Feature item titles, benefit headings, FAQ questions, display emphasis |
| `font-sans` | Outfit (Manrope variable) | Body paragraphs, feature descriptions, form fields |
| `font-jakarta` | Plus Jakarta Sans | Hero callouts, uppercase marketing lines |
| `font-jost` | Jost | Section labels, micro uppercase UI |
| `font-mono` | IBM Plex Mono | Metadata, timestamps, status badges, step numbers, nav micro-labels |

**Never use `font-display-emphasis`** for new work — it applies a faux-bold stroke. Use regular `font-display` with `font-semibold` instead.

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

### Feature Item Pattern (mandatory)

Use this typography for **every** feature / benefit / differentiator row (icon or not), service list titles, zig-zag service columns, and FAQ accordion questions. Import from `src/lib/typography-classes.ts` when possible.

```tsx
import {
  featureItemTitleClass,
  featureItemBodyClass,
  faqQuestionClass,
} from "@/lib/typography-classes";

{/* Title */}
<h3 className={featureItemTitleClass}>{title}</h3>

{/* Body */}
<p className={featureItemBodyClass}>{description}</p>

{/* FAQ question (add pr-8 if chevron sits beside) */}
<h3 className={cn(faqQuestionClass, "pr-8")}>{question}</h3>
```

| Role | Classes | Scale |
|------|---------|-------|
| Item title | `featureItemTitleClass` | `text-xl` → `md:text-2xl`, The Seasons, `font-semibold`, `tracking-tight` |
| Item body | `featureItemBodyClass` | `text-base`, Outfit, `text-foreground/75`, `leading-relaxed`, `text-pretty` |
| FAQ question | `faqQuestionClass` | Same as title + `group-hover:text-primary` |

**Do not** use `text-2xl md:text-3xl`, `font-bold`, or `font-display-emphasis` on feature item titles. **Do not** bump feature body copy to `md:text-lg` — keep descriptions at `text-base` at all breakpoints.

Reference implementations: `WeddingBenefits` (`BenefitBlock`), `WeddingFAQ`, `/about` FAQ in `AboutBioContent`.

### Typography Rules

- **Serif** → headings and quotes only. Never body text.
- **Mono** → micro-copy only. Never headings or paragraphs.
- Body line width: `max-w-prose` or `max-w-2xl` for readability
- Section intro prose (not feature items): `text-lg leading-relaxed text-foreground/75` optional `md:text-xl`
- Feature item body: always `featureItemBodyClass` (`text-base`, `/75`) — see Feature Item Pattern above
- Metadata / captions: `text-sm text-foreground/60`
- Uppercase labels always pair with `tracking-widest`

### Visual Hierarchy

- **Headlines must feel heavy and intentional.** Increase size for display text, tighten letter-spacing, reduce line-height. Headlines should command attention without shouting.
- **Use the full weight range.** Do not default to Regular (400) and Bold (700) only. Introduce Medium (500) and SemiBold (600) for subtler, richer hierarchy within a section.
- **Letter-spacing is directional.** Use negative tracking (`tracking-tighter`) for large display headings. Use positive tracking (`tracking-widest`) for small caps and labels. Never apply the same tracking universally.
- **Orphaned words are a sign of unfinished copy.** A single word sitting alone on the last line should be fixed with `text-wrap: balance` or `text-wrap: pretty`.
- **Control hierarchy through weight and color, not just scale.** A headline should not scream at maximum size — it should feel inevitable. Restraint in scale paired with strong weight creates more authority than sheer size alone.

### Section Substance

Every section must choose one clear source of visual weight:

- **High-quality prose:** real, specific, polished paragraphs that explain the value or story clearly.
- **Solid coloured elements:** opaque colour blocks, cards, accents, bands, or panels using approved brand tokens.

Never make a section depend on semi-transparency for polish. Translucent panels, low-opacity background fills, glassmorphism, faded photo washes, and decorative transparent gradients are not brand-correct.

---

## 3. Component Primitives

Check `src/components/` before building anything. These components exist — use them.

### SectionWrapper (`src/components/ui/SectionWrapper.tsx`)

Wrap **every** `<section>` with this. Applies consistent spacing via CSS variables.

```tsx
<SectionWrapper id="about" maxWidth="max-w-7xl" className="bg-cream">
  {/* content */}
</SectionWrapper>
```

Props: `id?`, `className?`, `maxWidth?: "max-w-4xl" | "max-w-5xl" | "max-w-6xl" | "max-w-7xl" | "max-w-none"`

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
| `primary` | `bg-primary` | `text-on-dark` | Main CTAs |
| `secondary` | `bg-on-dark/10 border border-on-dark/20` | `text-on-dark` | Secondary on dark sections |
| `ghost` | `bg-background` | `text-primary` | Light background contexts |
| `white` | `bg-background border border-primary/10` | `text-primary` | Outlined style on light sections |

Sizes: `sm` / `md` / `lg` use **`em`-based** padding (`px-[…em] py-[…em]`) tied to each size’s `text-sm` / `text-lg` so padding scales with the control’s font size. Default: `md`.

Buttons are always `rounded-full`.

### Shape Rules

- **Images are always sharp rectangles.** Photography, media, and image wrappers use `rounded-none`; do not apply `rounded-card`, `rounded-*`, masks, pill crops, or soft corner treatments to images.
- **Rounding belongs to UI features.** Buttons, chips, cards, accordions, form controls, badges, and other component chrome may use the approved radius tokens.
- **Do not blur the boundary between content and chrome.** An image inside a rounded card must stay sharp-cornered; the card can be rounded, but the image itself cannot inherit that radius.

### Vertical Rhythm & Alignment

- **Buttons must be bottom-aligned in card groups.** When cards have different content lengths, pin CTAs to the bottom of each card so they form a clean horizontal line regardless of content above.
- **Feature lists must start at the same Y position across all columns.** Use consistent spacing above the list or fixed-height title/price blocks.
- **Align shared elements across side-by-side components.** Titles, descriptions, prices, and buttons should align across all items. Misaligned baselines make the layout look broken.
- **Mathematical alignment is not always optical alignment.** Icons next to text, play buttons in circles, or text in buttons often need 1–2px optical adjustments to feel visually centred even when they aren't mathematically.

### Card Pattern

```tsx
className="group relative bg-background border border-primary/10 rounded-card p-8 shadow-card transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-primary/20"
```

Use `bg-cream` on section wrappers for warm bands; `bg-background` for white cards.

### Standard Grid Layouts

```tsx
// 3-column (Services, features):
className="grid grid-cols-1 md:grid-cols-3 gap-8"

// 2-column text + image:
className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"

// 4-column (footer, stats):
className="grid grid-cols-2 md:grid-cols-4 gap-8"
```

### Layout Diversification & Anti-Centre Bias

- **Anti-Centre Bias**: Centered Hero/H1 sections are strictly BANNED for high-variance designs. Force "Split Screen" (50/50), "Left Aligned content/Right Aligned asset", or "Asymmetric White-space" structures to break symmetry.

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

### Motion & Physics (Perpetual Micro-Interactions)

- **Spring Physics:** Avoid linear easing. Use spring-based motion for a natural, weighty feel on interactive elements where appropriate.
- **Perpetual Micro-Interactions:** Instead of static successful states, embed continuous, infinite micro-animations (Pulse, Typewriter, Float, Shimmer, Carousel) in standard components (avatars, status dots, backgrounds) to make the interface feel alive.

### What NOT to Use

- ❌ Framer Motion
- ❌ `animate-*` Tailwind classes for entrance animations (fine for loaders/spinners)
- ❌ CSS `@keyframes` for scroll-triggered animations
- ❌ `useEffect` for GSAP

---

## 5. Hard Rules (never violate)

- **Tailwind CSS only** — no inline styles, no CSS modules (GSAP `transform` exception OK)
- **Sizing units** — **Typography:** always `rem`. **Margins/padding on text:** `rem` for consistent rhythm. **Borders / icon boxes:** `px` (including `border` hairlines). **Component internal padding** (buttons, chips): **`em`** relative to that component’s `font-size`. **Layout** widths/heights: `%`, `vw`, or **`dvh` / `svh` / `lvh`** — never bare **`vh`**, and never **`h-screen`** / **`min-h-screen`**.
- **CSS variables for all colors** — no hardcoded hex in TSX/CSS
- **Sharp images, rounded UI** — all photography/media is rectangular and sharp-cornered; UI features can be rounded
- **No semi-transparent section design** — sections must rely on high-quality prose or solid coloured elements, never translucent surfaces or overlays
- **App Router** — `next/navigation` not `next/router`; `<Link>` not `<a>` for internal links
- **`cn()` for conditional classes** — `twMerge(clsx(...))`, never string concatenation
- **`"use client"`** only when component needs interactivity or browser APIs
- **TypeScript strict** — no `any`, define interfaces for all props
- **Check `src/components/`** before creating any new component
- **Mobile UX** — Any asymmetric layout above `md:` MUST aggressively fall back to a strict, single-column layout (`w-full`, `px-4`, `py-8`) on viewports `< 768px` to prevent horizontal scrolling and layout breakage.

---

## 6. Brand Personality

**Tone**: Confident, refined, warm. Never clinical or corporate.

**Aesthetic**: Premium editorial minimalism — Cormorant headings, generous whitespace, earth tones. Think high-end event branding, not tech startup.

### Editorial Clarity

The site should feel editorial, but never verbose. Readers should understand the point of a section at a glance.

- Write for skim-reading first, deep reading second
- Prefer short, clean sentences over long, winding ones
- Break dense ideas into smaller paragraphs, lists, or callouts
- Lead with the benefit, outcome, or key fact — not throat-clearing
- Make headings, subheads, labels, and bullets carry real meaning
- If a sentence requires re-reading, rewrite it
- Pages should be understandable in a quick scan, not only after careful reading

### Content Mode

Choose the copy strategy based on the page's purpose:

- **Audience-specific persuasive pages** use StoryBrand structure
  - position the visitor as the hero
  - name the problem clearly and quickly
  - present Stamer Cello as the guide
  - offer a clear plan, outcome, or next step
  - make the transformation easy to grasp in a glance
- **Informational pages** should be clear, concise, and unequivocal
  - state facts directly
  - remove flourish that slows comprehension
  - prefer clarity over cleverness
  - avoid ambiguity, hedging, or overly poetic phrasing when the goal is explanation

**Copy patterns**:
- **Banned AI clichés**: Never use "Elevate", "Seamless", "Unleash", "Next-Gen", "Game-changer", "Delve", "Tapestry", or "In the world of...". Use concrete verbs and benefit-driven language.
- **No fake/perfect numbers**: Avoid predictable outputs like `99.99%`, `50%`, or `$100.00`. Use organic, messy data (`47.2%`, `$99.00`, `+1 (312) 847-1928`) to sound grounded in reality.
- **No filler**: Never use Lorem Ipsum, filler, or placeholder latin text. Write real draft copy grounded in reality.
- Taglines use present-tense elegance and immediate clarity
- Headlines should communicate the main value or emotional outcome in one pass
- Supporting copy should be scannable, specific, and easy to digest
- CTAs are invitations, not commands: *"Book a Performance"*, *"Let's talk"*
- Avoid: generic verbs ("Get", "Buy"), exclamation marks, and long sentences that bury the point

**Imagery**:
- Grayscale reduction: `grayscale-[15%]` to `grayscale-[20%]` — never full color or full grayscale
- Images must be rectangular with sharp corners (`rounded-none`) at every breakpoint
- Do not use semi-transparent gradient overlays or washed-out image treatments; pair images with solid brand-colour elements or strong surrounding prose instead
- Object positioning is intentional: `object-left`, `object-center` — not always centered

---

## 7. Terminology

Design effect names the user may reference and how to implement them in this project.

### Viewport height units (`svh` / `lvh` / `dvh`)

Mobile browsers show and hide UI chrome (address bar, toolbars). Choose the unit that matches what the layout or media must track:

| Unit | Browser UI state | Best used for |
|------|------------------|---------------|
| `svh` | Fully expanded (UI is visible) | Sidebars, sticky footers, modals |
| `lvh` | Fully collapsed (UI is hidden) | Background images, full-page video backgrounds |
| `dvh` | Active / changing | Hero sections, fill-the-screen layouts |

**Project default:** marketing heroes, pinned overlay-scroll shells, and “fill the visible screen” sections use **`dvh`** (e.g. `min-h-dvh`, `min-h-[100dvh]`, `h-[100dvh]`) — not `h-screen` / `min-h-screen` / bare **`vh`**, which jump on iOS when chrome changes. Prefer **`svh`** when sizing to the **smallest** visible viewport (browser UI fully expanded) so fixed overlays and bottom UI stay in the safe zone; prefer **`lvh`** on full-bleed **background** image/video wrappers so media covers the viewport as if chrome were hidden.

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
<div className="sticky top-32 h-[60dvh] md:h-[50dvh]">
  {/* card content */}
</div>
```

GSAP animates the *previous* card (`scale → 0.9`, `blur → 10px`, `opacity → 0.4`) as the *next* card's ScrollTrigger fires with `scrub: true`.

---

## 8. Redesign & Upgrades

When upgrading or redesigning an existing page or component:
- **Preserve Brand Identity**: Stick strictly to the existing brand principles outlined above.
- **Do Not Rewrite from Scratch**: Apply targeted upgrades working with the existing stack. Improve what's there without breaking functionality.
- **Replace Generic Patterns**: Audit current designs for generic AI patterns (like 3 equal card columns or perfectly symmetrical, centered layouts) and replace them with high-end, asymmetric, or premium alternatives that fit the brand.
