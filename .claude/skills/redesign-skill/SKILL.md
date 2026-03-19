---
name: design-upgrade-framework
description: Audit and upgrade existing UI without a full rewrite. Scans codebase, identifies design weaknesses, and applies targeted fixes in priority order. Use when improving an existing component or page.
triggers:
  - redesign
  - improve design
  - audit UI
  - upgrade existing
  - fix design issues
  - make this look better
---

# Redesign Skill — Design Upgrade Framework

You are upgrading an existing interface. You do **not** rewrite everything from scratch — you surgically identify and fix the highest-impact design problems.

---

## Step 1: Scan the Codebase

Before touching anything, read:
- The component file(s) in question
- `package.json` — what's available (fonts, animation libs, icon sets)
- Global CSS / Tailwind config — what tokens exist
- Any adjacent components for consistency

---

## Step 2: Audit Checklist

Run through each category and flag issues:

### Typography
- [ ] Using a default/banned font? (Inter, Roboto, Arial, system-ui generic)
- [ ] Weak headline hierarchy? (everything same size/weight)
- [ ] Line width too wide? (> 72ch for body copy)
- [ ] Missing font weight contrast? (everything `font-medium`)
- [ ] Letter spacing issues? (tight body, loose headings = wrong)

### Color
- [ ] Pure black `#000000` or `bg-black` anywhere?
- [ ] Oversaturated accent colors? (> 80% saturation)
- [ ] "Purple/blue AI gradient aesthetic"? ← **Most common AI design fingerprint — flag immediately**
- [ ] Inconsistent neutral families? (mixing gray/slate/zinc)
- [ ] Missing dark mode support when it should exist?

### Layout
- [ ] Centered hero with centered H1? (generic)
- [ ] 3-column card grid as default? (generic)
- [ ] Missing viewport height handling? (`min-h-screen` vs `min-h-[100dvh]`)
- [ ] Symmetric layout that could be made asymmetric?
- [ ] Macro-whitespace missing? (sections too cramped)

### Interactive States
- [ ] Buttons without hover states?
- [ ] Missing active/press feedback? (`scale(0.98)` on click)
- [ ] Transitions missing or too fast/slow?
- [ ] Focus rings missing or using browser default?
- [ ] Loading states missing?

### Content
- [ ] Filler words? ("Elevate", "Seamless", "Unleash", "Transform")
- [ ] Generic placeholder names? ("John Doe", "Acme Corp")
- [ ] Emojis in professional UI?
- [ ] Copy that doesn't match the actual product?

### Components
- [ ] Generic card containers everywhere?
- [ ] Carousel for testimonials? (ban it)
- [ ] Modal overuse?
- [ ] Pill badge overuse?
- [ ] Lucide icons? (replace with Radix or Phosphor)

---

## Step 3: Fix Priority Order

Apply fixes in this order (highest impact first):

1. **Font selection** — swap to Geist/Outfit/Cabinet Grotesk
2. **Palette cleanup** — remove pure black, fix saturated accents, unify neutrals
3. **Interactive states** — add hover/active/focus to all interactive elements
4. **Layout** — break symmetry where DESIGN_VARIANCE > 4, fix spacing
5. **Component replacement** — swap cards for border-based layouts, kill carousels
6. **State design** — add loading/empty/error states
7. **Typography polish** — tighten scale, fix line widths, adjust tracking

---

## Step 4: Apply Changes

- Make targeted edits — don't rewrite working structure
- One audit category at a time, in priority order
- Preserve existing functionality completely
- Note what you changed and why

---

## Step 5: Verify

- [ ] Original functionality still works
- [ ] Mobile still works (375px)
- [ ] No new "AI tells" introduced
- [ ] Banned patterns are gone
- [ ] All interactive states exist
