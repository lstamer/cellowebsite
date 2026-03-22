# Stamer Cello Website — Agent Guide

## Skills
- **frontend-design**: Use when building components or pages
- **brand-consistency**: Read `.claude/skills/brand-consistency/SKILL.md` before ANY design work

### Imported Skills (`.claude/skills/`)
- **brand-consistency**: Colors, typography, components, animation — the Stamer brand system. Read before any design work.
- **taste-skill**: Core design system — typography, layout, motion, anti-patterns. Use for all new UI work.
- **minimalist-skill**: Editorial/Notion-style minimalism. Use when clean, sparse interfaces are needed.
- **redesign-skill**: Audit & upgrade existing UI. Use when improving existing components without rewriting.
- **soft-skill**: Premium/$150k-agency-level design. Use for hero sections, marketing pages, high-impact UI.
- **output-skill**: Full output enforcement. Use when generating complete files — prevents truncation.

## Tools
- **Unsplash MCP**: `.claude/mcp-servers/mcp-unsplash/` — use for placeholder images (query: "cello", "concert hall", "musician", "sheet music")
- **brand_assets**: `heroImage.jpeg` in `.cursor/skills/frontend-design/brand_assets/`

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

## Visual Verification with Puppeteer (mandatory)

After **any** UI change or new page creation, use Puppeteer to screenshot the result before marking work done. Puppeteer is already installed (`puppeteer` in `node_modules`).

**Quickstart** — run this inline script from the project root:
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

- Always screenshot the specific route you changed (e.g. `/blog`, `/book`, `/`)
- Compare mobile (375×812) and desktop (1440×900) viewports for new pages
- Dev server runs at `http://localhost:3000`

## Design Workflow
1. Read `.claude/skills/brand-consistency/SKILL.md`
2. Check `src/components/` for components to reuse
3. Fetch placeholder images via Unsplash MCP if needed
4. Validate hard rules before finishing
5. **Take a Puppeteer screenshot** of the changed route and inspect it — fix any visual issues before marking done.
