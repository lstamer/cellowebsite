# Shared Contracts — CX Overhaul (FROZEN)

Every agent codes against these. They are frozen — do not change a contract without
updating this file and notifying the orchestrator first.

## Contract 1 — WhatsApp util (`src/lib/whatsapp.ts`)
**Created by orchestrator in Phase 0 (already exists).** Consumed by Agents A & C.

```ts
export const PUBLIC_WHATSAPP_NUMBER: string;   // "27639081386" (env-overridable)
export const PUBLIC_WHATSAPP_DISPLAY: string;  // "+27 63 908 1386"
export interface WhatsAppContext { eventType?: string; date?: string; name?: string; source?: string }
export function buildWhatsAppHref(ctx?: WhatsAppContext): string;  // -> https://wa.me/27639081386?text=...
```
Public number = **+27 63 908 1386** (owner decision). Always open in a **new tab**
(`target="_blank" rel="noopener noreferrer"`).

## Contract 2 — Funnel URL params
Read by Agent C in the `/book` flow; written by Agents B & E on CTA hrefs.

- `type` ∈ `wedding | private-event | corporate-event | fundraiser | something-else`
  → pre-selects the existing event type. **Must match `EventTypeDropdown` values exactly.**
- `for` ∈ `planner | expo | coordinator | self` (optional) → **copy-only** tailoring
  (heading/intro/placeholder + optional "booking on behalf of a client/company"
  affordance). **No new backend event types. `/api/leads` and Attio stay untouched.**
- `package` (optional, already used by wedding cards) → informational only.

CTA → param mapping:
| Entry point | href |
|---|---|
| Weddings hero / banners / cards | `/book?type=wedding` (cards keep `&package=…`) |
| Corporate hero | `/book?type=corporate-event` |
| Private-events hero | `/book?type=private-event` |
| Home hero / Navbar / generic CTA | `/book` (no type) |
| Future planner/expo/coordinator links | `/book?type=corporate-event&for=planner` (etc.) |

## Contract 3 — Unified CTA verb system
- **Primary funnel verb:** `Check my date` (replaces "Check availability").
  Adjacent microcopy where space allows: *"I'll confirm on WhatsApp, usually same day."*
- **Secondary/soft verb:** `WhatsApp me` (opens Contract 1 link).
- Retire: "Get in contact", "Book a call", "Send a message", "Check availability".
- Keep "Send inquiry" only as the final in-form submit button.

## Brand rules (apply to ALL new UI)
Tailwind only · CSS-var colors (no hex in components; tokens in `globals.css` `@theme inline`) ·
`dvh/svh/lvh` not `vh`/`h-screen` · sharp images / rounded UI · `cn()` from `src/lib/utils` ·
`SectionWrapper` for sections · GSAP via `useGSAP` (+ `prefers-reduced-motion` guard like
`Navbar.tsx:61`) · `featureItemTitleClass`/`featureItemBodyClass`/`faqQuestionClass` for feature
typography · mobile-first · no `any`. Reuse `Button` (supports external links via `target`/`rel`).
