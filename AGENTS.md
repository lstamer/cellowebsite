# Stamer Cello Website — Agent Guide

## Skills
- **brand-consistency**: Read `.claude/skills/brand-consistency/SKILL.md` before ANY website work
- **taste-skill**: Optional skills in `.cursor/skills/taste-skill`. But be careful - some of it conflicts with brand-consistency rules.
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
- Mobile first designs ALWAYS

## Visual Verification with Puppeteer (mandatory)

After **any** UI change or new page creation, take a Puppeteer screenshot and inspect it before marking work done. Puppeteer is installed in this project (`node_modules/puppeteer`).

**Quickstart** — write to `/tmp/ss.mjs` and run `node /tmp/ss.mjs`:
```js
import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/YOUR_ROUTE", { waitUntil: "networkidle2", timeout: 10000 });
await p.screenshot({ path: "/tmp/ss.png" });
await b.close();
```
Read the saved screenshot to visually inspect the result. Fix any issues before finishing.

- Screenshot the specific route you changed (e.g. `/blog`, `/book`, `/`)
- Test both desktop (1440×900) and mobile (375×812) viewports for new pages
- Dev server runs at `http://localhost:3000`

## Design Workflow
1. Read `.claude/skills/brand-consistency/SKILL.md`
2. Check `src/components/` for components to reuse
3. Validate hard rules before finishing
4. **Take a Puppeteer screenshot** of the changed route and inspect it — fix any visual issues before marking done.

## Anti AI SLOP manifesto
1. **No Generic UI:** Stop generating default SaaS templates. Use high contrast, strong typographic hierarchy, and extreme care for alignment.
2. **Premium Whitespace:** Elements need room to breathe. Use proportional `clamp()` spacing over rigid padding.
3. **Cinematic Motion:** Never use linear easing. Prefer spring physics (`stiffness: 100, damping: 20` or similar).
4. **Complete Implementation:** No placeholders. No `// TODO: add actual code here`. Write the full, working implementation every single time.
5. **Contextual Awareness:** For deep style configurations, read the localized `SKILL.md` files in the `skills/` directory.
