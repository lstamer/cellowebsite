---
name: brand-consistency
description: Apply Stamer Cello's visual identity when designing or changing the website, including its colors, typography, illustrations, layouts, and motion.
---

# Stamer Cello brand consistency

Use this skill for design work on this project. The feeling is premium editorial, warm, confident, and a little unconventional: generous space, expressive type, real event photography, and a restrained hand-drawn coral thread. Keep the site easy to understand and use on mobile.

Read the project `AGENTS.md`, `PRODUCT.md`, and `DESIGN.md` for the wider requirements. The current token definitions are in `src/app/globals.css`; use those names and values rather than copying a possibly stale hex value from a design document. The pink testimonial treatment and grouped process illustrations below document established patterns that are more specific than the general white-card and one-coral-detail descriptions in `DESIGN.md`.

## Color and surface roles

Use the existing Tailwind color utilities backed by CSS variables. Do not hardcode colors in components.

| Token | Role |
| --- | --- |
| `primary` | Ebony green for headings, primary buttons, and quiet structural details. |
| `foreground` | Near-black for body text and the solid backgrounds of small feature icons. |
| `background` | Opaque white for page sections and cards. |
| `cream` | Opaque warm off-white for section bands, particularly FAQs and value sections. |
| `rose` | Opaque pale pink for featured testimonial or client-proof cards. The current `--color-rose` is `#FFD9D9`; use `bg-rose`, not a new pink token. |
| `accent` | Coral for small hand-drawn marks, highlights, dots, and connecting lines. |
| `accent-ink` | Darker coral available when text needs more contrast; check the actual pairing. |
| `surface-dark`, `surface-darker`, `on-dark` | Near-black sections, deeper footer, and light text or icons on dark surfaces. |
| `success`, `whatsapp` | Status and WhatsApp entry points respectively. |

Band the overall page between solid white, cream, and occasional near-black sections. Use pink as a deliberate proof-card variation, not a default section background. Coral is a thread, not a large surface or fill. Avoid glass, translucent panels, faded photo overlays, and decorative gradient washes. The subtle site-wide grain is already supplied by `src/app/layout.tsx`; do not add another section overlay to imitate it.

Use `shadow-card` only for quiet separation where needed. Do not use the deprecated coral `shadow-card-hover` glow. Text, icons, focus states, and controls must meet WCAG 2.2 AA contrast against their actual backgrounds; low-opacity decorative marks must not carry meaning.

## Testimonial cards: pale pink proof

The `/about` testimonial card is the reference: `src/components/about/AboutTestimonials.tsx`, used by `src/components/about/AboutBioContent.tsx`. It uses `rounded-card bg-rose`, generous responsive padding, dark text, and a restrained `shadow-card` on a white section. The quote is the visual focus, with an oversized decorative quote mark, a fine divider, and a clear client attribution. A short phrase may receive a white marker-like emphasis. Keep the quote readable and give any carousel controls clear names, keyboard access, visible focus, and reduced-motion behavior.

Reuse `AboutTestimonials` when its carousel and split header/card layout fit; for a single quote, use the same visual treatment without adding unnecessary carousel controls. Do not turn all cards pink: standard cards remain white on cream or dark bands. The rounded card is UI chrome; photography and other media remain sharp rectangles under the project image rule.

## Cream and white FAQ pattern

Use `SectionWrapper` with `surface="cream"` for the standard FAQ band, then place the answers in an opaque `bg-background` white `rounded-card` with a quiet border, optional `shadow-card`, generous padding, and thin row dividers. `src/components/weddings/WeddingFAQ.tsx` is the shared-component example; `/about` in `src/components/about/AboutBioContent.tsx` shows a centered heading and single-column version.

Prefer `src/components/ui/FAQAccordion.tsx`: it supports numbered questions and a two-column desktop layout with a single-column mobile layout. Use `faqQuestionClass`, `faqNumberClass`, and `featureItemBodyClass` from `src/lib/typography-classes.ts` for consistent questions and answers. Keep accordion buttons keyboard operable, expose expanded state and the controlled answer, provide a visible focus indicator, and do not rely on the chevron or color alone to convey state. Choose a simpler white-background FAQ only when the surrounding page composition calls for it.

## Black iconography and illustrated medallions

There are two related treatments; choose the one appropriate to the content.

- **Compact feature icons:** a solid `bg-foreground` square with a centered, thin white Lucide icon. `src/components/private-events/PrivateEventsOccasions.tsx` demonstrates a `44px` square and `20px` icon. Use for feature and occasion lists, with the title and description carrying the meaning.
- **Illustrated process medallions:** the reference images show a large textured charcoal or near-black circle on a transparent square canvas, with simple warm-white line art, a restrained coral detail, a small textured cream organic shape at the edge, and a small offset coral dot. These are illustrations rather than translucent panels or photo crops. `public/images/process/icon1fr.png`, `public/images/process/icon2fr.png`, and `public/images/process/icon3fr.png` are existing visual references. `src/components/Solution.tsx` demonstrates their use in a vertical process with a coral connector and a sharp rectangular event photograph. Verify each illustration's subject and accessible text before reuse: the first two alt labels in that component currently do not match their artwork.

For a new concept, first look for an existing suitable asset. If none exists and a new illustration is needed, generate an original icon image that belongs to the same family: square transparent canvas, charcoal circular medallion, one recognizable off-white line-art subject, a small coral accent, and the cream textured mark and coral dot. Keep the canvas outside the medallion and its small peripheral marks transparent, rather than filling the square black. Match the existing assets' proportions, visual weight, and restrained hand-drawn finish; avoid text, logos, photorealism, gradients, or a generic multicolor icon set. Keep a consistent style across a series, but make each subject distinct. Save reusable artwork under `public/images/` and inspect it at its intended display size.

Treat an illustration as decorative with empty alt text when adjacent text already communicates the same idea; otherwise provide concise, accurate alt text. Do not replace recognizable functional controls with decorative image icons or depend on a generated image alone to convey an action.

## Coral strokes, circles, and the thread

Make one principal coral emphasis per section. A small eyebrow dot, or the coral process motif of a connector, per-medallion dots, and small artwork details, may support that emphasis as a coordinated group; avoid several competing large flourishes. Keep coral visually scarce and the underlying layout calm.

- **Underlines:** use `HandDrawnUnderline` from `src/components/ui/HandDrawnUnderline.tsx`, with `underlineClassName="text-accent"`, beneath only the two or three words that matter. It provides three subtly different SVG paths; vary them across sections. Keep links distinguishable with their own conventional link affordance.
- **Circles and ovals:** a slightly irregular, fine coral stroke can encircle one important word, as in `src/components/Solution.tsx`. Keep text legible, preserve space around the letters, and hide the decorative SVG from assistive technology.
- **Streaks and connectors:** a thin, imperfect coral line can connect process medallions or trace a vertical timeline. See `src/components/Solution.tsx` and the achievements thread in `src/components/about/AboutBioContent.tsx`. The horizontal three-step arrangement in the reference images is a visual adaptation, not a variant supplied by `Solution`; it should collapse to a legible vertical flow on small screens. Represent genuinely ordered steps as an ordered list and hide the decorative connector from assistive technology.

These marks should feel drawn by hand, with a little irregularity, not like a heavy marker block or a perfectly geometric UI border. If animated, draw them once with scoped GSAP and provide a visible static result for reduced motion. The referenced process implementation is a visual example, not a complete reduced-motion implementation; add explicit motion gating rather than copying its animation uncritically.

## Typography and composition

- Use `SectionHeader` for label and heading pairs. Its tracked Jost eyebrow includes a small coral dot; the heading uses large italic Cormorant Garamond (`font-serif italic`).
- Use The Seasons (`font-display`) for feature titles, FAQ questions, and prominent quotes. Import `featureItemTitleClass`, `featureItemBodyClass`, and `faqQuestionClass`: feature titles are `text-xl md:text-2xl`, and descriptions remain `text-base text-foreground/75`.
- Use `font-sans` for body text. The project currently loads Manrope through the legacy `--font-outfit` variable in `src/app/layout.tsx`. Use Jost for small tracked labels and `font-mono` for suitable metadata, not paragraphs.
- Prefer short readable lines, generous whitespace, and a clear hierarchy. Split heroes and text-plus-image layouts can pair an editorial headline and a primary ebony-green pill CTA with a large sharp-edged photograph and an understated secondary text link. Process steps may be vertical beside a photograph, or horizontal on wider screens; use a clear single-column flow on mobile. If a visual depicts an imagined scene, label it honestly instead of presenting it as event proof.
- Keep feature cards and lists simple and aligned. Rounding belongs to UI chrome, not photography. Use the project's existing image treatment and intentional crops rather than translucent overlays.

## Implementation and verification

Check `src/components/` before building a new primitive. Use `SectionWrapper` for section spacing and its `surface` prop for solid bands. Follow the project's Tailwind-only styling, CSS-variable colors, responsive sizing, App Router, `cn()` class merging, and strict TypeScript rules. Use GSAP with `useGSAP` and cleanup for entrance and scroll motion; keep motion purposeful and respect `prefers-reduced-motion`.

For user-facing copy, follow the appropriate project voice skill: `.cursor/skills/voice-characterful/SKILL.md` by default, or `.cursor/skills/voice-minimal-luxury/SKILL.md` for an explicitly understated brief. Do not use em dashes in site copy.

After any UI change, take and inspect a Puppeteer screenshot of the affected route as required by `AGENTS.md`; for a new page inspect both mobile and desktop. Check that the resulting layout, text contrast, keyboard focus, and reduced-motion state work in context.
