# Stamer Cello Website — Agent Guide

## Skills
- **frontend-design**: Use when building components or pages
- **brand-guidelines**: Read `.cursor/skills/brand-guidelines/SKILL.md` before ANY design work

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
1. Read `.cursor/skills/brand-guidelines/SKILL.md`
2. Check `src/components/` for components to reuse
3. Fetch placeholder images via Unsplash MCP if needed
4. Validate hard rules before finishing
5. **Take a Puppeteer screenshot** of the changed route and inspect it — fix any visual issues before marking done.
