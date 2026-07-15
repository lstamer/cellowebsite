# Stamer Cello Website — Agent Guide

## Skills

- **frontend-design**: Use when building components or pages
- **brand-consistency**: Read `.cursor/skills/brand-consistency/SKILL.md` before ANY design work
- **taste-skill**: Optional skills in `.cursor/skills/taste-skill`. But be careful - some of it conflicts with brand-consistency rules.

### Imported Skills (`.cursor/skills/`)

- **brand-consistency**: Colors, typography, components, animation — the Stamer brand system. Read before any design work.
- **taste-skill**: Core design system — typography, layout, motion, anti-patterns. Use for all new UI work.
- **minimalist-skill**: Editorial/Notion-style minimalism. Use when clean, sparse interfaces are needed.
- **redesign-skill**: Audit & upgrade existing UI. Use when improving existing components without rewriting.
- **soft-skill**: Premium/$150k-agency-level design. Use for hero sections, marketing pages, high-impact UI.
- **output-skill**: Full output enforcement. Use when generating complete files — prevents truncation.
- **gsap-css-safety**: Avoid GSAP fighting CSS (`transition-all`, hover transforms) on the same nodes; use when scroll reveals look stuck or half-faded.

### Copywriting Voice Skills (`.cursor/skills/`)

These govern **words only** (tone of copy), not design. Pick ONE per task — they are mutually exclusive registers. Default to `voice-characterful` unless the brief calls for stripped-back/luxury copy.

- **voice-characterful**: Read `.cursor/skills/voice-characterful/SKILL.md` before writing/rewriting any user-facing copy in the warm, witty, rebellious-classical first-person voice (Luke talking). Use for personality-forward pages.
- **voice-minimal-luxury**: Read `.cursor/skills/voice-minimal-luxury/SKILL.md` before writing/rewriting copy in the spare, declarative, fashion-house register. Use when the brief wants stripped-back, understated, luxury copy.

## Tools

- **brand_assets**: `heroImage.jpeg` in `.cursor/skills/frontend-design/brand_assets/`

## Hard Rules (never violate)

- Tailwind CSS only — no inline styles, no CSS modules (GSAP transform exceptions OK)
- **Sizing:** typography and margins/padding on text → **rem**; borders and icon boxes → **px**; component internal padding (e.g. buttons) → `**em`**; layout → `%`, `vw`, or `**dvh` / `svh` / `lvh`** only — **never bare `vh`**, never `h-screen` / `min-h-screen`. `**dvh**` = heroes / fill-screen; `**svh**` = fixed full-viewport overlays; `**lvh**` = full-bleed bg image/video wrappers.
- CSS variables for colors — no hardcoded hex values in components
- Sharp images, rounded UI — photography/media must be rectangular with sharp corners; reserve rounding for UI features like buttons, chips, cards, accordions, badges, and form controls
- No semi-transparent section design — each section must rely on high-quality prose or solid coloured elements/surfaces, never translucent panels, faded overlays, glass effects, or transparent gradients
- App Router only — `next/navigation`, not `next/router`; `<Link>` not `<a>` for internal links
- GSAP for animations — `useGSAP` hook with cleanup context
- Always use `SectionWrapper` for section padding
- `clsx` + `tailwind-merge` (`cn()`) for conditional classes
- TypeScript strict — no `any`
- Check `src/components/` before creating new components
- Mobile first designs ALWAYS
- **Feature item typography** — benefit rows, service feature titles, icon+text lists, and FAQ questions use `featureItemTitleClass` / `featureItemBodyClass` / `faqQuestionClass` from `src/lib/typography-classes.ts` (`text-xl md:text-2xl` titles, `text-base` body at `/75`). Never `text-2xl md:text-3xl` titles or `md:text-lg` on feature bodies.

## Visual Verification with Puppeteer (mandatory)

After **any** UI change or new page creation, take a Puppeteer screenshot and inspect it before marking work done. Puppeteer is installed in this project (`puppeteer` in `node_modules`).

**Quickstart** — from the project root, run an inline script with `node -e "..."`, or write the snippet to `/tmp/ss.mjs` and run `node /tmp/ss.mjs`:

```js
// run: node -e "..." or write to /tmp/ss.mjs and node /tmp/ss.mjs
import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/YOUR_ROUTE", { waitUntil: "networkidle2", timeout: 10000 });
await p.screenshot({ path: "/tmp/ss.png" });
await b.close();
```

Then **read `/tmp/ss.png`** using the Read tool to visually inspect the result. Fix any issues you see before finishing.

- Always screenshot the specific route you changed (e.g. `/about`, `/book`, `/`)
- Compare mobile (375×812) and desktop (1440×900) viewports for new pages
- Dev server runs at `http://localhost:3000`

## Design Workflow

1. Read `.cursor/skills/brand-consistency/SKILL.md`
2. Check `src/components/` for components to reuse
3. Validate hard rules before finishing
4. **Take a Puppeteer screenshot** of the changed route and inspect it — fix any visual issues before marking done.

## Anti AI SLOP manifesto

1. **No Generic UI:** Stop generating default SaaS templates. Use high contrast, strong typographic hierarchy, and extreme care for alignment.
2. **Premium Whitespace:** Elements need room to breathe. Use proportional `clamp()` spacing over rigid padding.
3. **Cinematic Motion:** Never use linear easing. Prefer spring physics (`stiffness: 100, damping: 20` or similar).
4. **Complete Implementation:** No placeholders. No `// TODO: add actual code here`. Write the full, working implementation every single time.
5. **Contextual Awareness:** For deep style configurations, read the localized `SKILL.md` files in the `skills/` directory.
6. **No Em Dashes** For any copy site-wide, never use dashes until it is part of a word or phrase. Punctuation like this - see what I'm doing - gives the site an extremely AI feel. Any other punctuation, such as fullstops, commas, semi-colons, etc. are acceptable.

<!-- TRIGGER.DEV SKILLS START -->
## Trigger.dev agent skills

This project has Trigger.dev agent skills installed in `.claude/skills/`. Before writing or changing Trigger.dev code (background tasks, scheduled tasks, realtime, or chat.agent AI agents), load the most relevant skill: `trigger-realtime-and-frontend`, `trigger-chat-agent-advanced`, `trigger-authoring-tasks`, `trigger-authoring-chat-agent`.
<!-- TRIGGER.DEV SKILLS END -->

## Design Context

- **`PRODUCT.md`** (project root) — strategic design context: brand register, the three equal audiences (weddings / private events / corporate), positioning ("Effortless live music, handled"), the belief ladder, WhatsApp-first conversion, and the WCAG 2.2 AA requirement. Read before any design or copy work.
- **`DESIGN.md`** (project root) — the visual system: North Star ("One Coral Thread"), color roles and named rules (coral is never a surface; the coral hover glow `shadow-card-hover` is deprecated), typography hierarchy, elevation doctrine, component specs, and do's & don'ts. Machine-readable tokens live in its frontmatter and in `.impeccable/design.json`.
