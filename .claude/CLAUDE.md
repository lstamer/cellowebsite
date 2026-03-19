# Stamer Cello Website — Agent Guide

## Skills
- **frontend-design**: Use when building components or pages
- **brand-guidelines**: Read `.cursor/skills/brand-guidelines/SKILL.md` before ANY design work

### Imported Skills (`.claude/skills/`)
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

## Design Workflow
1. Read `.cursor/skills/brand-guidelines/SKILL.md`
2. Check `src/components/` for components to reuse
3. Fetch placeholder images via Unsplash MCP if needed
4. Validate hard rules before finishing
5. **Visually review your work**: Take a screenshot of the running dev server (`http://localhost:3000`) and inspect the rendered output. Fix any visual issues before marking the task done.
