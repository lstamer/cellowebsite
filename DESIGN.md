---
name: Stamer Cello
description: Premium event cellist in Cape Town — effortless live music, handled.
colors:
  ebony-green: "#2E4036"
  coral-thread: "#CC5833"
  white: "#FFFFFF"
  cream: "#F2F0E9"
  ink: "#1A1A1A"
  ink-deep: "#111111"
  success: "#34D399"
  whatsapp: "#25D366"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(3rem, 8vw, 10rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(2.25rem, 4vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "normal"
  title:
    fontFamily: "The Seasons, serif"
    fontSize: "clamp(1.25rem, 2vw, 1.5rem)"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Jost, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.1em"
rounded:
  none: "0"
  input: "0.75rem"
  card: "2rem"
  full: "9999px"
spacing:
  section-y: "6rem"
  section-y-md: "8rem"
  section-x-sm: "1.5rem"
  section-x-md: "3rem"
  section-x-lg: "6rem"
components:
  button-primary:
    backgroundColor: "{colors.ebony-green}"
    textColor: "{colors.white}"
    rounded: "{rounded.full}"
    padding: "0.714em 1.429em"
  button-secondary:
    backgroundColor: "#FFFFFF1A"
    textColor: "{colors.white}"
    rounded: "{rounded.full}"
    padding: "0.714em 1.429em"
  button-white:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ebony-green}"
    rounded: "{rounded.full}"
    padding: "0.714em 1.429em"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "2rem"
  input:
    textColor: "{colors.ink}"
    rounded: "{rounded.input}"
    padding: "0.75rem 1rem"
  whatsapp-fab:
    backgroundColor: "{colors.whatsapp}"
    textColor: "{colors.white}"
    rounded: "{rounded.full}"
    size: "3.5rem"
---

# Design System: Stamer Cello

## 1. Overview

**Creative North Star: "One Coral Thread"**

The system is a calm, premium editorial base — generous white space, serif italic headings, sharp rectangular photography, quiet ink-on-white prose — with exactly **one** coral detail per section carrying all the personality: a hand-drawn underline beneath the two or three words that matter, a single accent moment, one animated flourish. The base whispers elegance; the thread is the splash of life that connects every page back to Luke and the atmosphere of live cello. Classical bones, one deliberate rule-break at a time.

Elegance is carried by the neutrals, not the accent. Ebony Green grounds the site with a natural, serene weight; cream, white, and near-black do the dressing — the palette of Luke's signature cream-and-dark suit. Coral is rare on purpose: its scarcity is what makes it feel alive. This system explicitly rejects tech-startup and SaaS-template looks, clinical or corporate tone, and every form of translucent design — glassmorphism, faded overlays, and semi-transparent section surfaces are prohibited outright.

**Key Characteristics:**
- Editorial minimalism with a premium, unhurried density — one dominant idea per fold
- Exactly one coral accent moment per section; never more, never zero personality
- Section rhythm banded across white, cream, and ink surfaces (never translucent ones)
- Sharp rectangular imagery (with 15–20% grayscale reduction); rounding reserved for UI chrome
- Motion is GSAP-choreographed but restrained: one elevating scroll moment per section, always with a reduced-motion fallback

## 2. Colors

A grounded, natureful palette dressed in suit-neutrals, threaded with one rare, living accent.

### Primary
- **Ebony Green** (#2E4036): The fingerboard-dark green that grounds everything — headings, buttons, labels, borders. Serene and natural, it is the brand's tone of voice in color form. Carries authority without corporate coldness.

### Secondary
- **Coral Thread** (#CC5833): The rule-breaker. A connecting streak of life that runs through the site as hand-drawn underlines, single emphasis moments, and small accents. Rare and full of personality — its distinct role is the reason it must never become wallpaper.

### Neutral
- **White** (#FFFFFF): Default page background and card fills; also all text and icons on dark surfaces (the `on-dark` token).
- **Cream** (#F2F0E9): Warm elegance bands — value sections, FAQ, newsletter. The cream half of Luke's signature suit.
- **Ink** (#1A1A1A): Body text and dark section surfaces (Problem, CTA). The dark half of the suit.
- **Ink Deep** (#111111): Footer background only.
- **Success Green** (#34D399): Status indicators only ("Accepting Bookings").
- **WhatsApp Green** (#25D366): Reserved exclusively for WhatsApp entry points (FAB, chat CTAs) — the primary conversion path.

### Named Rules
**The Coral Thread Rule.** Coral appears as a thread, never a surface. Hand-drawn underlines under the 2–3 most important words of a heading, one accent moment per section — and that is all. A pure-coral section background is forbidden; large coral fills are forbidden. If coral stops being rare, it stops being alive.

**The Suit Rule.** Sections band between white, cream, and ink — the palette of a cream and dark suit. Elegance comes from how these three trade off down the page, not from decoration. Aim for richer interplay between them; a page that is wall-to-wall white reads bland, not clean.

**The Solid Surface Rule.** Every surface is opaque. No `bg-*/5` washes, no backdrop blur, no gradient fades. Text-opacity stops (`/80`, `/75`, `/60`) are for hierarchy on text and hairlines only.

## 3. Typography

**Display Font:** Cormorant Garamond, always italic (Georgia fallback)
**Title Font:** The Seasons (serif fallback)
**Body Font:** Manrope (sans-serif fallback; served through the legacy `--font-outfit` CSS variable)
**Label Fonts:** Jost for micro UI labels; IBM Plex Mono for metadata, timestamps, and step numbers

**Character:** A serif-italic voice that reads like a concert programme with the stiffness removed — classical training in the letterforms, warmth in the spacing. The Seasons adds a distinctive, slightly fashionable edge on feature titles that no default font stack can imitate.

### Hierarchy
- **Display** (400, clamp(3rem, 8vw, 10rem), line-height 1): Hero headlines only. Cormorant italic.
- **Headline** (400, 2.25rem → 3rem, line-height 1.1): Section headings. Cormorant italic, always paired with a label above (see the Two-Part Heading Rule).
- **Title** (600, 1.25rem → 1.5rem, tracking -0.025em): Feature/benefit item titles, FAQ questions, service rows. The Seasons. Use `featureItemTitleClass` from `src/lib/typography-classes.ts`.
- **Body** (400, 1rem, line-height 1.625): All prose. Manrope at `text-foreground/75` for feature bodies, full ink for primary prose. Max line length `max-w-prose` / `max-w-2xl`.
- **Label** (700, 0.875rem, tracking 0.1em, UPPERCASE): Section labels and micro UI. Always uppercase + wide tracking, never used for sentences.

### Named Rules
**The Two-Part Heading Rule.** Every section heading is a pair: small uppercase tracked label above, large Cormorant italic headline below — rendered via `<SectionHeader>`, never hand-rolled.

**The Feature Item Rule.** Every feature, benefit, or FAQ row uses the exported classes from `src/lib/typography-classes.ts`. Titles never exceed `md:text-2xl`; bodies never exceed `text-base`. No exceptions.

**The Role Lock Rule.** Serif is for headings and quotes, never body. Mono is for micro-copy, never headings. The Seasons is for titles and display emphasis, never paragraphs.

## 4. Elevation

This system is **flat at rest**. Depth is conveyed by solid surface banding (white → cream → ink), hairline borders (`border-primary/10`, `border-foreground/10`), and typography weight — not by shadows. The single ambient card shadow is texture, not elevation: at 4% black it is felt rather than seen.

### Shadow Vocabulary
- **Ambient card** (`box-shadow: 0 8px 30px rgba(0,0,0,0.04)`): The only shadow. Applied to cards and floating chrome (WhatsApp FAB) as a whisper of separation from the page.

### Named Rules
**The Flat-at-Rest Rule.** Surfaces do not gain glow, colored shadows, or dramatic lift on hover. Hover feedback is positional (a `-translate-y-1` lift or `scale(1.03)` magnetic nudge) and chromatic (border or text color shifts) — never luminous.

**Deprecated: the coral hover glow.** `shadow-card-hover` (`0 8px 40px rgba(204,88,51,0.15)`) is legacy AI slop scheduled for removal. Do not apply it to new work; when touching a component that uses it, replace it with the plain ambient card shadow.

## 5. Components

Components are **quietly confident**: pill buttons with generous em-based padding, calm 300ms transitions, nothing begging for attention — but everything responds when touched.

### Buttons
- **Shape:** Full pill (9999px radius), always.
- **Primary:** Ebony Green fill, white text, `em`-based padding (0.714em × 1.429em at `text-sm`, scaling up at `md:`). Hover: fill eases to 90% strength; the `btn-magnetic` class adds a `scale(1.03)` nudge.
- **Secondary (dark surfaces):** 10% white fill with a 20% white hairline border, white text. Hover deepens the fill to 20%.
- **White / Ghost (light surfaces):** White fill, Ebony Green text; the white variant adds a `border-primary/10` hairline.
- **Focus:** Visible focus ring required on all variants (WCAG 2.2 AA).

### Cards / Containers
- **Corner Style:** 2rem radius — generous, unmistakably intentional.
- **Background:** White on cream/dark bands; cream bands sit on the section wrapper, not the card.
- **Shadow Strategy:** Ambient card shadow only (see Elevation). Hover lifts `-translate-y-1`; no glow.
- **Border:** `border-primary/10` hairline (1px).
- **Internal Padding:** 2rem (`p-8`).

### Inputs / Fields
- **Style:** Transparent background, `border-foreground/20` hairline, 0.75rem radius, Manrope body type, placeholder at 30% ink (note: placeholder contrast needs an AA pass).
- **Focus:** Border shifts to Ebony Green; no outline glow.

### Navigation
- Fixed navbar with a dark-hero variant; internal links via `<Link>`, mono micro-labels for nav metadata. Mobile menu is a full-viewport overlay sized with `svh`.

### The Hand-Drawn Underline (signature)
The physical form of the Coral Thread: an SVG stroke (three variants) drawn on scroll beneath the 2–3 most important words of a heading, colored `text-accent`. Vary `variant={1|2|3}` across sections. Never substitute a flat CSS underline, and never underline a whole line.

### The WhatsApp FAB (signature)
A fixed 3.5rem circular WhatsApp-green button, bottom-right, visible on `lg:` and up (mobile gets a sticky CTA bar instead). This is the site's primary conversion path — it outranks every other floating element.

## 6. Do's and Don'ts

### Do:
- **Do** keep exactly one coral moment per section — a `HandDrawnUnderline` on 2–3 words, or one accent detail. One, not zero, not three.
- **Do** band sections across white (#FFFFFF), cream (#F2F0E9), and ink (#1A1A1A) solid surfaces for rhythm and richer color interplay.
- **Do** keep all photography rectangular and sharp-cornered (`rounded-none`) with 15–20% grayscale reduction; reserve rounding for buttons, cards, chips, and form controls.
- **Do** use `<SectionWrapper>` for every section and `<SectionHeader>` for every label+heading pair.
- **Do** ship a `prefers-reduced-motion` alternative for every GSAP animation, and use `dvh`/`svh`/`lvh` — never bare `vh` or `h-screen`.
- **Do** route every color through CSS variables (`text-primary`, `bg-cream`); exact hex values live in `globals.css` only.
- **Do** hold WCAG 2.2 AA: ≥4.5:1 body contrast, visible focus states, accessible form errors, meaningful alt text.

### Don't:
- **Don't** use coral as a section background or large fill — "coral has a distinct role" (PRODUCT.md: the thread, not the surface).
- **Don't** apply the deprecated coral hover glow (`shadow-card-hover`); replace it on sight with the ambient card shadow.
- **Don't** build tech-startup or SaaS-template looks: hero-metric blocks, identical card grids, gradient accents (PRODUCT.md anti-reference, verbatim).
- **Don't** use glassmorphism, translucent panels, faded overlays, or semi-transparent section design — banned outright (PRODUCT.md anti-reference, verbatim).
- **Don't** write clinical or corporate copy, or AI clichés — "Elevate", "Seamless", "Unleash", "Next-Gen" are prohibited (PRODUCT.md anti-reference, verbatim).
- **Don't** hardcode hex values in components, use `font-display-emphasis` (faux-bold stroke), or swap any font role.
- **Don't** exceed `md:text-2xl` on feature titles or `text-base` on feature bodies — the Feature Item Rule is a hard rule.
- **Don't** center-stack every hero: prefer split or asymmetric compositions that fall back to a strict single column below 768px.
