# Plan — `/services/corporate-functions` page

## Context

The site has two per-audience conversion pages cloned from a shared template: `/services/weddings`
and `/services/private-events`. We need a third, `/services/corporate-functions`, wired to the third
item in the Navbar "Services" dropdown.

**Target viewer:** facilities managers, event coordinators, and planners at hotels, corporates, and
expo groups. For them a corporate event is a reputational bet — it either earns praise from managers,
bosses, and exco attendees, or it flops. The page must make a live cello feel like the lever that
turns a box-ticking function into an event colleagues actually *enjoy* (not one they slog through
waiting to get home), while reassuring a risk-averse, AV-literate buyer that everything is handled.

The layout mirrors the existing services pages (Hero → "occasions" grid → "My Promise" → "Why choose
me" + testimonials/stats → "What I handle" → **Tech Rider spec sheet** → FAQ → CTA), with copy
re-pitched to the corporate planner's anxieties and desires, plus a forwardable tech-rider block —
the one section AV/facilities teams specifically want.

## Decisions (confirmed with user)

- **Navbar:** rename the existing third dropdown item from "Corporate Events" → **"Corporate Functions"**, repoint to `/services/corporate-functions`.
- **Tech rider:** on-page **spec sheet** (forwardable) + a prose "what I handle" reassurance grid. No PDF.
- **Imagery:** generate new premium on-brand images via `/image2` (gpt-image-2 MCP) — no reuse of the cold expo photo.

## Pattern being cloned

Reference set (read and mirror exactly): `src/app/services/private-events/page.tsx`,
`src/components/private-events/*`. All shared primitives are reused as-is:
`SectionWrapper`, `SectionHeader`, `HandDrawnUnderline`, `Button`, `FAQAccordion`, `CTA`, `Footer`,
`Navbar`, typography classes in `src/lib/typography-classes.ts`
(`featureItemTitleClass` / `featureItemBodyClass` / `faqQuestionClass`), and GSAP via
`@/lib/gsap-client` + `useGSAP`. Follow the hard rules in CLAUDE.md (rem/px/em/% sizing, CSS-var
colors only, sharp media corners / rounded UI, no semi-transparent section design, SectionWrapper for
padding, mobile-first, no `any`).

## Files to create

### 1. Images (generate first, via `/image2` → save to `public/images/`)
- `corporate-functions-hero.jpg` — landscape (~1536×1024). A cellist performing at an elegant
  corporate awards/gala reception: well-dressed professionals with drinks, warm sophisticated uplighting,
  a polished hotel ballroom / modern venue. Editorial, premium, warm — NOT cold stock. Must have a
  left-side region that reads dark enough for white text under the gradient overlay.
- `corporate-functions-importance.jpg` — portrait 4:5 (~1024×1280). Cellist mid-performance at a refined
  corporate function, shallow depth of field, warm tone. Replaces the solid-colour placeholder used on
  private-events' Importance section.

### 2. Page route
- `src/app/services/corporate-functions/page.tsx` — clone of the private-events page: `Navbar heroVariant="dark"` → `CorporateFunctionsHero` → wrapper `div.relative.z-[2].bg-background` containing `CorporateFunctionsDeferredSections` + `CTA` + `Footer`.

### 3. Components in `src/components/corporate-functions/`
Each cloned from its private-events counterpart, with corporate-tailored copy and unique GSAP
class names (prefix `corp-` to avoid collisions):

- **`CorporateFunctionsHero.tsx`** — clone of `PrivateEventsHero`. `src="/images/corporate-functions-hero.jpg"`. Heading: `Cello for` / `Corporate Events` (jakarta uppercase + serif italic display). Subhead pitched to the planner: live cello as the detail that makes guests glad they came / the event reflects well on them. CTA `Button href="/book"` "Check availability".
- **`CorporateFunctionsOccasions.tsx`** — clone of `PrivateEventsOccasions` (3-col card grid). Label "Where It Fits", heading "Built for the events that carry your name." 6 occasions w/ Lucide icons: Awards & gala dinners (`Trophy`), Conferences & summits (`Presentation`/`Mic2`), Product launches (`Sparkles`/`Rocket`), Client & VIP receptions (`Handshake`/`Wine`), Year-end & staff celebrations (`PartyPopper`), Hotel & expo activations (`Building2`, `hideOnMobile`).
- **`CorporateFunctionsImportance.tsx`** — clone of `PrivateEventsImportance`. Swap the solid-colour placeholder for the real `corporate-functions-importance.jpg` (`next/image`, sharp corners, `aspect-[4/5]`). Label "My Promise", heading re-pitched to reputational stakes — e.g. "When the room feels effortless, the credit is yours." Pull-quote in serif italic primary.
- **`CorporateFunctionsBenefits.tsx`** — clone of `PrivateEventsBenefits` (left benefits + sticky right testimonials + stats counters). Label "The Difference", heading "Why coordinators rebook me." 4 differentiators tied to planner anxieties: *One less vendor to chase* (self-sufficient, early, reliable — `Clock`/`CheckCheck`); *A first impression that sets the tone* (`Sparkles`); *Plays with your run-of-show & AV* (integrates with PA/MC/DJ/FOH — `SlidersHorizontal`/`Cable`); *Briefed and on-brand* (custom arrangements, reads the audience — `Music2`). Testimonials re-pitched to corporate organisers (reuse existing testimonial copy/names where plausible, e.g. an organiser quote); keep the same stats array (12+ yrs, ATCL, 0 negative reviews, 6,500 hrs).
- **`CorporateFunctionsLogistics.tsx`** — clone of `PrivateEventsLogistics` (2-col prose grid, `bg-cream`). Label "Handled", heading "What I take off your plate." 6 reassurance items tuned to corporate: self-contained setup & quiet load-in; works around your run-of-show; fully insured (public liability); liaises with your venue/AV/event team; minimal footprint; agreed cue sheet so each moment lands.
- **`CorporateFunctionsTechRider.tsx`** — **new section (key tailored addition).** A clean, forwardable spec sheet for AV/facilities teams. `SectionWrapper` on `bg-surface-dark text-on-dark` (or cream — pick for rhythm vs adjacent sections), `SectionHeader` label "Tech Rider", heading "Everything your AV team needs." Render a definition-style spec grid (sharp-cornered rows, no translucency) with concrete specs: **Power** (1× standard 220V/13A outlet within ~3m); **Footprint** (~2m × 1.5m, armless chair, no riser required); **Amplification** (acoustic for ≤80 guests; own pickup + DI/XLR balanced feed to your FOH for larger rooms); **Sound check** (30–45 min before doors); **Load-in/out** (self-managed, ~20 min each); **Insurance** (public liability cover, certificate on request); **Attire** (black tie / business formal to match your dress code); **Integration** (slots into MC/DJ/AV cues; can play to a click or hold for speeches). Use `featureItemTitleClass`/`featureItemBodyClass` for the term/detail pairs and GSAP stagger reveal. End with a line inviting them to request the rider/availability via `/book`.
- **`CorporateFunctionsFAQ.tsx`** — clone of `PrivateEventsFAQ` (uses `FAQAccordion`, `max-w-4xl`). 5–6 corporate-tailored Q&A: lead time & holding a date; how invoicing / PO & payment terms work; integrating with our in-house AV / sound; can you tailor repertoire to our brand or play a company song; volume during networking vs awards/speeches; what happens if you're unwell (backup/contingency); travel to our city/venue.
- **`CorporateFunctionsDeferredSections.tsx`** — clone of `PrivateEventsDeferredSections`: `next/dynamic` (`ssr:false`, `loading: BelowFoldSectionSkeleton`) for each below-fold section, rendered in order: Occasions → Importance → Benefits → Logistics → **TechRider** → FAQ.

> Note: `PrivateEventsValue` / `WeddingValue` marquees are NOT rendered on those pages (absent from
> their DeferredSections), so we skip a Value section here too. `ScrollRefresh` is also unused by the
> private-events page wrapper — omit unless a refresh issue surfaces in verification.

## Files to modify

- **`src/components/Navbar.tsx`** (lines ~212–214): change the third Services dropdown item to
  `{ label: "Corporate Functions", href: "/services/corporate-functions" }`.

## Verification

1. **Generate & inspect images** with `/image2` (gpt-image-2 `generate_image`); Read each PNG/JPG to confirm quality, brand warmth, and a dark hero region for legible text; re-generate if off. Save final files into `public/images/`.
2. **Dev server** at `http://localhost:3000` — build must compile with no TS errors (`npm run lint` clean; no `any`).
3. **Navbar:** hover Services → confirm "Corporate Functions" appears as the third item and routes to the new page.
4. **Puppeteer screenshots** (mandatory per CLAUDE.md) of `/services/corporate-functions` at **1440×900** and **375×812**; Read the PNGs and verify: hero text legibility over the image, section rhythm, the tech-rider spec sheet reads cleanly and is forwardable, scroll-reveal animations land (no stuck `opacity:0`), sharp media corners, no translucent panels, mobile stacking. Fix any issue before finishing.
5. Cross-check against CLAUDE.md hard rules and `.cursor/skills/brand-consistency/SKILL.md` (feature-item typography classes, color CSS vars, sizing units).
