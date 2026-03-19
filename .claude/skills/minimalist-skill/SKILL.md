---
name: premium-utilitarian-minimalism
description: Editorial, Notion/Linear-inspired minimalist design. Clean interfaces with deliberate whitespace, muted palettes, and precise typography. No gradients, no heavy shadows, no decoration for its own sake.
triggers:
  - minimalist UI
  - clean design
  - editorial layout
  - Notion-style
  - Linear-style
---

# Minimalist Skill — Premium Utilitarian Minimalism

You produce interfaces that feel like they were designed by a team that has removed everything unnecessary. Inspired by Notion, Linear, Craft, and Ink & Switch. Every element earns its place.

---

## Typography

### Fonts
- **Body**: SF Pro Display (system) or `Geist Sans`
- **Headings**: Lyon Text or `Playfair Display` (serif contrast)
- **Code/mono**: `Geist Mono`
- **Banned**: Inter, Roboto, Nunito, Lato, Open Sans

### Scale
- Body: 16px / 1.6 line-height
- Small: 14px / 1.5 line-height
- Heading: tight tracking (`tracking-tight`), heavier weight contrast
- Off-black for body copy: `#111111` — not pure black, not gray

---

## Color Palette

| Role | Value |
|------|-------|
| Background | `#F7F6F3` (warm off-white) |
| Surface | `#FFFFFF` |
| Border | `#EAEAEA` |
| Text primary | `#111111` |
| Text secondary | `#6B7280` |
| Accent (muted) | Desaturated pastels only: `#FDEBEC`, `#E1F3FE`, `#E8F5E9` |

**Banned colors:**
- Pure black `#000000`
- Neon/vibrant accents
- Heavy gradients
- Purple/blue AI palette

---

## Component Patterns

### Cards
```tsx
<div className="border border-[#EAEAEA] rounded-[8px] p-6 bg-white">
```
- Border: exactly `1px solid #EAEAEA`
- Border-radius: 8–12px (never more)
- Padding: generous — minimum `p-6`
- No box shadows on cards (use border only)
- Slight shadow only on elevated states: `shadow-sm`

### Buttons
```tsx
// Primary
<button className="bg-[#111111] text-white px-4 py-2 rounded-md text-sm
  hover:scale-[0.98] transition-transform duration-150">

// Secondary
<button className="border border-[#EAEAEA] text-[#111111] px-4 py-2 rounded-md text-sm
  hover:bg-[#F7F6F3] transition-colors duration-150">
```

### Lists & Tables
- Prefer `divide-y divide-[#EAEAEA]` over cards for list data
- Table cells: `py-3 px-4`, minimal header styling
- Use `border-t` to separate sections, not visual cards

---

## Motion

- Only `transform` and `opacity`
- Entrance: `translateY(12px)` + opacity 0→1 over 600ms
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (expo out)
- Ambient/decorative motion: `opacity: 0.02–0.04` only (nearly invisible)
- No bounce, no spring exaggeration
- No motion for its own sake

---

## Anti-Patterns — Banned
- Heavy box shadows (`shadow-lg`, `shadow-xl` on cards)
- Gradients (background or text)
- Neon or vibrant accent colors
- Pill containers / badge overuse
- Emojis in UI
- Lucide icons (use Radix UI Icons or Heroicons)
- Carousels
- Sticky hero sections with parallax
- "AI cliché" copy

---

## Layout Principles
- Macro-whitespace: sections minimum `py-16`, prefer `py-24`
- Single column reading view for content
- Sidebar layouts for app interfaces (not top nav)
- Max content width: `max-w-2xl` for prose, `max-w-5xl` for app UI
- Grid: 12-column base, but sparse usage — prefer flow layouts
