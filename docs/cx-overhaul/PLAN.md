# Orchestration Plan — Stamer Cello: "Effortless to Enquire" CX Overhaul

Source of truth for the CX conversion overhaul. Contracts live in `./CONTRACTS.md`.

## Context
A maximum-scrutiny audit found the site looks premium but the funnel is built for one persona
(a wedding client who already decided) and blocks the most instinctive warm-lead action. Every CTA →
`/book` → one generic 2-step `BookFlow` → `POST /api/leads` → Attio + WhatsApp alert to the performer.

Five "kills": (1) no inbound "WhatsApp me" anywhere; (2) "Check availability" is a false promise;
(3) one generic wedding-flavoured form for all personas; (4) no fast lane (5 fields before step 2);
(5) no persistent mobile CTA. Plus owner instruction: **no visible pricing before enquiring**.

**Outcome:** any remotely-warm visitor, on any device, in any persona, always has an obvious,
low-friction, *honest* path to enquire — including one-tap WhatsApp — and the form feels built for them.

## Locked decisions
- Scope: **CX-critical only** (5 kills + CTA consistency + pricing removal). Compliance/spam/dead-code/a11y deferred.
- Public WhatsApp number: **+27 63 908 1386**.
- Personas: **route the existing form** (`?type=`/`?for=`), no new pages, no new backend event types.
- Pricing: **remove all visible prices** (incl. wedding R-figures → quote-driven cards).

## Success criteria (all must pass)
- **SC-1** WhatsApp reachable on every route, desktop+mobile, opens `wa.me/27639081386?text=…` in a new tab.
- **SC-2** No "Check availability"; unified verbs (`Check my date` / `WhatsApp me`); honest availability language.
- **SC-3** Service-hero CTAs land on `/book` with matching event type pre-selected + persona copy; `?for=` tailors copy.
- **SC-4** `/book` shows an "in a hurry?" one-tap WhatsApp fast lane above the full form.
- **SC-5** Mobile sticky bottom bar `[Check my date] [WhatsApp]` after hero scroll; hidden on `/book`; safe-area aware.
- **SC-6** No rand figure / numeric price on any public page.
- **SC-7** `tsc --noEmit`, `lint`, `build` all clean.
- **SC-8** Brand rules obeyed (Tailwind only, CSS-var colors, dvh/svh/lvh, sharp images/rounded UI, cn(), SectionWrapper, useGSAP, mobile-first, no any).
- **SC-9** Puppeteer screenshots (desktop+mobile) of all six routes captured + inspected; no regressions.

## Workstreams → agents (file-ownership isolation)
- **Agent A — Contact Rail:** `whatsapp.ts` (done), `WhatsAppFab` (new), `MobileStickyCTA` (new), `layout.tsx`, `Footer.tsx`, `globals.css` token. → Kills #1, #5.
- **Agent B — Funnel Copy & CTA Routing:** `Hero.tsx`, `Navbar.tsx`, `CTA.tsx`, `Problem.tsx`, `WeddingStatsCtaBanner.tsx`, 3 service heroes, `BookingSuccess.tsx`. → Kill #2 + verb chaos + Contract-2 hrefs.
- **Agent C — Booking Flow Engine (opus):** `BookFlow.tsx`, `BookPageClient.tsx`, `BookPageDeferred.tsx`, `app/book/page.tsx`, `EventTypeDropdown.tsx`. → Kills #3, #4 (Suspense+useSearchParams, initialEventType prop, persona copy, fast lane).
- **Agent E — Pricing De-anchor:** `WeddingPricing.tsx`. → SC-6.
- **Agent F — Verification (separate lane, last):** screenshots + interaction checks + tsc/lint/build → PASS/FAIL vs SC-1…SC-9.

## Sequencing
Phase 0 done (docs + util). Phase 1: A|B|C|E in parallel. Phase 2: orchestrator integrate + tsc/lint/build.
Phase 3: Agent F verifies. Phase 4: fix FAILs, re-verify, report.

## Out of scope (deferred): POPIA consent on form, spam/rate-limit on APIs, deleting dead `Contact`/`/api/contact`,
scroll-reveal reduced-motion hardening, dedicated persona landing pages, real calendar integration, stale memory note.
