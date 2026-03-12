---
name: brand-guidelines
description: Brand guidelines for the Stamer cello portfolio website. Read this before ANY design work on this project.
---

# Stamer Cello Website — Brand Guidelines

Read this skill before designing any component, page, or section for this website.

---

## Aesthetic Identity

- **Preset**: "Organic Tech" — where classical music meets considered craft
- **Feeling**: Refined, unhurried, tactile. Not corporate. Not sterile.
- **Differentiator**: The tension between warm serif emotion and cool sans-serif structure

---

## Color Palette

```
Primary:          #2E4036  (Moss Green — grounding, authoritative)
Accent:           #CC5833  (Clay/Burnt Orange — warmth, spark)
Background:       #F2F0E9  (Cream — organic, not pure white)
Foreground:       #1A1A1A  (Charcoal — not pure black)
Surface Dark:     #1A1A1A  (dark sections)
Surface Darker:   #111111  (footer, deepest backgrounds)
Success:          #34D399  (status indicators only)
```

**Rules:**
- Never use hardcoded hex values in components — use CSS variables (`text-primary`, `bg-accent`, etc.) or Tailwind theme classes
- Accent (clay orange) is a spark, never a background fill
- Alternate cream and `bg-surface-dark` sections for visual rhythm

---

## Typography

```
Display headings:  Plus Jakarta Sans (font-display) — weight 600-700
Body / UI:         Outfit (font-sans) — weight 400-600
Emotional moments: Cormorant Garamond italic (font-serif) — weight 300-500
Data / labels:     IBM Plex Mono (font-mono) — weight 400-500
```

- Hero lines pair display + serif italic in the same headline
- Never use: system fonts, Inter, Roboto, Space Grotesk
- Always apply `text-wrap: balance` on headings
- Use serif italic anywhere that is emotional, human, or musical

---

## Spacing System (always rem, never px)

```
Section vertical:   6rem (mobile), 8rem (desktop) → spacing-section-y classes
Section horizontal: 1.5rem (sm), 3rem (md), 6rem (lg) → px-section-x-* classes
Card radius:        2rem (--radius-card)
Full radius:        9999px (--radius-full) → pills, badges, status dots
```

- `1px` borders are the only permitted px exception
- Use `SectionWrapper` for all section padding — never add raw padding to sections

---

## Visual Rhyming — The Site's DNA

These motifs appear throughout the site and must be continued in all new work:

| Motif | Implementation |
|-------|---------------|
| **Pill shapes** | navbar, buttons, status badges, avatars → `rounded-full` |
| **Grainy texture** | SVG noise overlay at z-50 with 5% opacity — never remove, always inherit |
| **Serif italic for humanity** | Cormorant italic for emotional/human/musical moments |
| **Overlay-first images** | Never show raw photos — always apply gradient overlay + optional grayscale |
| **Bottom-left anchoring** | Hero content sits bottom-left; section intros often left-aligned |
| **Accent sparks** | Clay orange used sparingly — never as background fill |
| **Dark contrast sections** | Alternate cream and `bg-surface-dark` for rhythm |
| **Hover tint** | Card hover shadow: `rgba(204,88,51,0.15)` (accent at 15% opacity) |

---

## Component Inventory

**Check these before building anything new:**

```
src/components/ui/Button.tsx         — variants: primary, secondary, ghost; sizes: sm, md, lg
src/components/ui/SectionWrapper.tsx — use for ALL section padding
src/components/ui/SectionHeader.tsx  — label + heading pattern
src/components/blocks/Cards.tsx      — FeatureGrid, BentoGrid, ProcessCards
src/components/blocks/Banners.tsx    — StatsBanner, CalloutBanner, NewsletterBanner
src/components/blocks/Splits.tsx     — ImageRightSplit, ImageLeftWithList, AlternatingSplit
```

---

## Animation Patterns (GSAP)

```
Fade-up entrance:  y: 40 → 0, opacity: 0 → 1, ease: power3.out
Text stagger:      0.08s per element
Card stagger:      0.15s per card
ScrollTrigger:     start: "top 80%" for most reveals
```

- Always use `useGSAP` hook with a cleanup context
- No Framer Motion, no CSS keyframes for major animations

---

## Placeholder Images

Use the Unsplash MCP (`.claude/mcp-servers/mcp-unsplash/`) for real photos. Never use placeholder services.

**Query terms for this site:** `"cello"`, `"classical music"`, `"concert hall"`, `"musician hands"`, `"sheet music"`, `"string instrument"`

After fetching: apply `object-cover`, gradient overlay, optional `grayscale` filter.

Brand hero image also available at: `.cursor/skills/frontend-design/brand_assets/heroImage.jpeg`

---

## Design Concepts to Apply

- **Typographic contrast**: pair a large serif italic phrase with a smaller display-weight label
- **Negative space as luxury**: resist filling every gap — generous whitespace signals premium
- **Editorial asymmetry**: don't center everything — left-anchoring and grid-breaking feel intentional
- **Atmosphere > decoration**: overlays, textures, gradients create mood; icons/illustrations can feel cheap

---

## Validation

After implementing, visually review your work:
1. Ensure `npm run dev` is running at `http://localhost:3000`
2. Take a screenshot (Puppeteer if available) and inspect for: layout alignment, color accuracy, spacing consistency, font rendering
3. Fix visual issues before marking the task complete
4. Run `npm run lint` — must pass with no new violations
5. Rendered output is the source of truth, not code review alone
