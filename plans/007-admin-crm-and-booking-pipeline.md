# 007 — Attio removal, hardened booking pipeline, and the admin CRM

Status: **BUILT on branch `worktree-plan-admin-crm` (2026-09-05), awaiting deploy.** Decisions in §9 confirmed by Luke: same repo, no Attio export, AI prompts editable, magic link to lukestamer5853@gmail.com, first-party analytics, Google Workspace email. Deploy steps: `docs/admin.md`.

Written 2026-09-05 after a survey of the live system. Read `WHATSAPPAUTOMATIONTASK.md` and
`docs/inquiry-automation.md` first if you are new to the inquiry stack.

---

## 1. What exists today (survey findings)

The site already has most of the backend this plan needs. Attio is a thin bolt-on; the real
operational data layer is Supabase + trigger.dev + Telegram.

| Piece | Where | State |
|---|---|---|
| Booking form → `POST /api/leads` | `src/app/api/leads/route.ts` | Attio upsert is **required** (500 if it fails). Supabase write is best-effort. Telegram alert is best-effort, failure only `console.error`'d. |
| Contact form → `POST /api/contact` | `src/app/api/contact/route.ts` | Same shape as above. |
| Attio client | `src/lib/attio.ts` | Only used by the two routes above. Also referenced in `route.test.ts`, `privacy/page.tsx`, `SETUP.md`, `.env.example`, `docs/`. |
| Website leads table | `inquiry_website_leads` (migration `202608060001`) | Stores form submissions, Telegram card ids, AI draft state, Available/Unavailable decision. |
| People (identity) | `inquiry_people` (`202608070001`) | Keyed on **phone only** (`phone_e164 not null unique`). Leads without a phone cannot link to a person. |
| WhatsApp inbound | `/api/webhooks/zernio` → `ingest_zernio_message` RPC → `inquiry_conversations` / `inquiry_messages` / `inquiries` | Live in prod. Only `message.received` is ingested; Luke's own replies are fetched from Zernio at draft time, not stored. |
| AI drafting | `src/lib/inquiries/ai.ts` + `trigger/inquiries.ts` (~2000 lines, 8+ tasks) | Prompts are built from `inquiry_brain_docs` (editable in Supabase Studio), `inquiry_reply_examples`, `inquiry_client_profiles`, plus **hard-coded prompt scaffolds in `ai.ts`**. |
| Telegram | `src/lib/inquiries/telegram.ts`, `/api/webhooks/telegram` | Bot @MaestroStamerBot, approver allow-list, callback buttons, override + suggest-changes loops. |
| Failure tracking | Scattered per-row columns: `telegram_notification_status/_error`, `last_error`, `send_uncertain`, outbox `failed` | No central log, nothing surfaces failures to Luke except a missing Telegram card. |
| Analytics | `@vercel/analytics` + Speed Insights in `layout.tsx` | Aggregate only, not queryable from our code, not joinable to leads. |
| Scheduled work | `dispatchInquiryOutbox` every 3 min + `reconcile_stale_inquiry_work()` | Recovery exists, but silently. |

**Critical gap found:** `persistWebsiteLead()` in both routes returns early with no Supabase write
when the phone cannot be normalised to a `wa.me` number (`if (!whatsappDigits) return undefined`).
The contact form's phone is optional, so **email-only enquiries are never stored in Supabase today**.
They only exist in Attio. Making Supabase mandatory means fixing this first.

---

## 2. Goals (restated from the brief)

1. Remove Attio entirely.
2. Supabase write becomes the gate: no row, no success response.
3. Telegram alert is best-effort **but** every failure is durably logged and visible to Luke, and
   retried.
4. All site enquiries reach Luke personally on Telegram with type + full details (already true
   when Telegram works; §4 makes it reliable).
5. `admin.stamer.co.za`: login, every enquiry ever (CRM view over Supabase), site health, visitor
   analytics, a console of API failures and things needing attention, manual data correction
   (contacts, leads, prompts/brain docs), connected to Telegram and Zernio WhatsApp, and later
   email.

---

## 3. Architecture decisions (recommended, see §9 for what needs a yes)

### 3.1 Admin lives in this Next.js repo, not a separate Vite app

Route group `src/app/admin/**`, served on `admin.stamer.co.za` by a host rewrite in `src/proxy.ts`
(Next 16's middleware file). Reasons:

- Everything the admin needs is already here: `src/lib/inquiries/supabase.ts` (58 exported
  RPC wrappers), Zod schemas, Telegram + Zernio clients, trigger tasks. A Vite app would need a
  monorepo or duplicated types.
- Server Components + Server Actions can use `SUPABASE_SECRET_KEY` server-side. **No RLS policies
  to write, no anon key in the browser.** Every existing table already has RLS enabled with no
  policies, which is exactly right for this model.
- One deploy, one env, one domain config in Vercel.
- UI: Tailwind + `react-aria-components`, matching the hard rules. shadcn would pull Radix into a
  repo standardised on React Aria; not worth it. The admin gets its own dense, dark, utilitarian
  layout (`src/app/admin/layout.tsx`) that does **not** import the marketing shell (Navbar, Footer,
  GSAP reveals). Brand tokens from `globals.css` still apply.
- Public site is untouched: the only shared file is `proxy.ts`, which no-ops for the apex host.

Cost of the alternative: a Vite SPA would need a public API surface on the main site (or a
Supabase anon client + full RLS policy design for 15+ tables). That is more work and more attack
surface, not less.

### 3.2 Auth

Supabase Auth, email magic link (OTP), allow-list `ADMIN_EMAILS` env (Luke only). Session cookie
via `@supabase/ssr`. `proxy.ts` checks the session on the admin host and redirects to
`/admin/login` otherwise. Admin pages additionally verify server-side (defence in depth, never
trust the proxy alone). Login rate-limited by IP. Admin host sends `X-Robots-Tag: noindex`,
`Cache-Control: no-store`.

### 3.3 One central event log: `admin_events`

Every integration failure, uncertain send, health probe failure, recovery action, and manual edit
writes a row. `logAdminEvent()` is a fire-and-forget helper that **never throws** and never
blocks the request. This replaces `console.error` as the failure sink across routes and trigger
tasks. The admin Console is a view over this table plus the existing per-row error columns.

### 3.4 People become the CRM spine, keyed on phone **or** email

`inquiry_people.phone_e164` becomes nullable with partial unique indexes on `phone_e164` and
`lower(email)`. `upsert_inquiry_person` links by phone first, then email. This lets:
- email-only contact-form leads link to a person,
- Luke add a contact manually with whatever he has,
- WhatsApp and website identities merge when a phone matches later.

New CRM columns on `inquiry_people`: `stage` (`new | contacted | quoted | booked | played | lost`),
`source`, `tags text[]`, `notes`, `archived_at`. A `merge_inquiry_people(keep, drop)` RPC handles
duplicates safely (re-points leads, contacts, conversations, profiles).

### 3.5 Prompts editable from the admin

Interpretation of "editing the prompts which go through to the Telegram agent": the AI drafting
prompts. Three layers, all editable:
1. `inquiry_brain_docs` (already exists, currently edited in Supabase Studio) → admin editor.
2. `inquiry_reply_examples` → admin editor (activate/deactivate, edit, add).
3. **New** `inquiry_prompt_templates` (`slug`, `content`, `version`, `active`, `updated_by`) for
   the scaffolds currently hard-coded in `ai.ts` (system persona, extraction instructions, draft
   instructions, redraft instructions, guardrail block). Code keeps the current strings as
   defaults; DB overrides when an active row exists. Every save creates a new version; rollback is
   one click. A "Preview draft" button runs the real draft function against a chosen past enquiry
   without sending anything.

Telegram card text formats stay in code (they are layout, not policy).

### 3.6 Analytics: first-party, privacy-safe, joinable to leads

Keep Vercel Analytics. Add a tiny beacon (`POST /api/t`, `navigator.sendBeacon`) writing to
`site_visits`: path, referrer, UTM, device class, country (from Vercel geo headers), a random
per-tab `session_id` (sessionStorage, no cookie, no PII), and funnel events on `/book` (`step_1`,
`step_2`, `submitted`). The lead row stores the `session_id` so the CRM shows "came from Google →
/services/weddings → /book → submitted in 4 min". No fingerprinting, no IP storage. Privacy page
gets one added line. This is what actually answers "show me people who have gone through the
website".

### 3.7 Site health: probe + surface + alert

Scheduled trigger task every 5 min: `GET https://stamer.co.za/` (status + TTFB), `GET
/api/health` (internal: Supabase RPC round-trip, Telegram `getMe`, Zernio auth ping, AI Gateway
reachability), plus data-derived checks (pending approvals > 24h, outbox rows `failed`, sends
`send_uncertain`, leads with `alert_status = failed`). Results to `health_checks`; state changes
(ok → failing, failing → ok) log an `admin_event` and send **one** rate-limited Telegram message.

### 3.8 Channels

- **Telegram**: already the alert + approval channel. Admin adds: resend a lead alert, view the card
  status, and deep-link to the Telegram thread.
- **WhatsApp (Zernio)**: read view over `inquiry_conversations`/`inquiry_messages` with the AI
  analysis, approvals and their outcomes. Phase 4 adds ingestion of Zernio's outbound events so
  Luke's own phone replies are stored (needs Zernio webhook event verification, see §9), and
  "reply from admin" that reuses the existing guarded `claim_inquiry_approval_send` path (respects
  the 24h window; cold outreach still goes via `wa.me` prefill, per the Meta constraint).
- **Email**: Phase 5, Gmail API polling from a scheduled task (no MX/forwarding change), AI
  classifies enquiry vs noise, stores `inquiry_email_threads/messages`, links to a person by
  email, Telegram alert. Depends on where `luke@stamer.co.za` is hosted (§9).

---

## 4. Booking pipeline rework (Phase 1, shippable on its own)

New request lifecycle for both `/api/leads` and `/api/contact`:

```
validate payload
  → create_website_lead (REQUIRED)         fail → log admin_event, return 500 "Could not save your enquiry"
  → respond 200 { success: true, leadId }
  → after(): send Telegram alert (best-effort)
       ok    → complete_website_lead_alert (chat/message ids), alert_status = 'sent'
       fail  → alert_status = 'failed', alert_error, admin_event(level=error, source=telegram)
  → after(): trigger website-lead draft flow (unchanged)
```

Changes:
- Delete `src/lib/attio.ts`, all Attio env vars, Attio branches in both routes, Attio mocks in
  `route.test.ts`, Attio paragraph in `privacy/page.tsx`, `SETUP.md`, `.env.example`,
  `docs/inquiry-automation.md` ("Attio remains unchanged" line), `docs/cx-overhaul/*` references.
- Remove the `if (!whatsappDigits) return undefined` guard. `create_website_lead` already accepts
  null `p_whatsapp_digits` / `p_phone_e164`; the Telegram card simply renders without
  Available/Unavailable buttons when there is no WhatsApp number (existing behaviour).
- Migration `2026090501_lead_alert_status_and_admin_events.sql`:
  - `inquiry_website_leads`: add `alert_status text not null default 'pending' check (in
    ('pending','sending','sent','failed'))`, `alert_error text`, `alert_attempts int default 0`,
    `alert_sent_at timestamptz`, `session_id text`.
  - `admin_events` table (§3.3).
  - `claim_website_lead_alert(p_lead_id)` / `fail_website_lead_alert(...)` RPCs so retries are
    idempotent (same claim pattern as the review notification).
- New scheduled trigger task `retry-lead-alerts` (every 5 min): claim leads with `alert_status in
  ('pending','failed')` and `alert_attempts < 5`, resend, log outcome. After 5 attempts stop
  retrying and leave a `needs_attention` admin event. This is what makes "best-effort" also
  "never silently lost".
- The Telegram alert text gains the source (`/book` form vs home-page contact form vs email vs
  WhatsApp) as the first line so Luke can tell the type at a glance. It already carries every field.
- Tests: rewrite `route.test.ts` for the new contract (Supabase failure → 500, Telegram failure →
  200 + failed status + event row). Add contract tests for the retry task's claim logic.
- One-off `scripts/export-attio.mjs`: pull all Attio people + notes to JSON **before** the key is
  revoked, then `scripts/import-attio-people.mjs` upserts them into `inquiry_people` (+ a
  `website_leads` row per note where the payload can be reconstructed). Historical CRM data should
  not be lost when Attio goes.

---

## 5. Admin CRM (Phases 2–3)

### 5.1 Routes (`admin.stamer.co.za`)

| Route | Purpose |
|---|---|
| `/login` | Magic-link form. |
| `/` Dashboard | KPIs (new enquiries 7d/30d, by type, by source, response-time median, conversion to booked), "needs attention" strip (failed alerts, pending approvals, uncertain sends, health failing), latest enquiries. |
| `/inquiries` | Unified list: website leads + WhatsApp inquiries (+ email later). Filters: channel, event type, stage, date range, search. |
| `/inquiries/[id]` | Timeline for one enquiry: submitted payload, Telegram card status, availability decision, AI draft(s) and Luke's edits, wa.me prefill, linked WhatsApp thread, linked person. Actions: edit fields, change stage, resend alert, dismiss, link/unlink person, add note. |
| `/contacts` | People list with stage, last activity, channels. Add contact, merge duplicates. |
| `/contacts/[id]` | Person profile: every lead, conversation, approval, client profile (quote/deposit), notes, audit history. Inline edit. |
| `/conversations/[id]` | WhatsApp thread view with AI analysis + approvals. (Reply from admin arrives in Phase 4.) |
| `/console` | `admin_events` stream (level/source filters, acknowledge, "recheck" for health), plus derived rows: outbox failed, approvals uncertain/expired, stale suggest-change requests. |
| `/analytics` | Visits, top pages, referrers, device split, `/book` funnel, per-session paths, lead attribution. |
| `/health` | Live probe status, 24h/7d uptime bars, last incident list, trigger.dev queue depth. |
| `/settings/brain` | Brain docs editor with preview + versioning. |
| `/settings/examples` | Reply examples table. |
| `/settings/prompts` | Prompt templates with version history, diff, rollback, "Preview draft on enquiry X". |
| `/settings/integrations` | Read-only status of each env/integration, Telegram test message, Zernio ping. |

### 5.2 Data changes (migration `2026090502_admin_crm.sql`)

- `inquiry_people`: nullable phone, email partial unique, `stage`, `source`, `tags`, `notes`,
  `archived_at`; `upsert_inquiry_person` phone-or-email; `merge_inquiry_people` RPC.
- `admin_audit_log` (`actor`, `table_name`, `row_id`, `action`, `before jsonb`, `after jsonb`,
  `created_at`). Every Server Action that mutates data writes through one `withAudit()` wrapper.
- `inquiry_prompt_templates` (+ `inquiry_prompt_template_versions`).
- `inquiry_brain_docs` / `inquiry_reply_examples`: add `updated_by`, versions table for brain docs.
- `site_visits`, `site_events` (funnel), `health_checks`.
- Read-model views for the list pages (`admin_inquiries_v`, `admin_needs_attention_v`) so the
  pages are single queries, not N+1.

### 5.3 Manual correction rules (safety)

- Edits to leads/people are audited and reversible from the audit row.
- Editing a lead does **not** re-fire Telegram or AI automatically; there is an explicit
  "Re-run draft" button.
- Prompt template saves are versioned; an invalid template (missing required placeholder) is
  rejected server-side before it can break drafting.
- Nothing in the admin can send a WhatsApp message to a customer until Phase 4, and then only via
  the existing claim/approval machinery.

### 5.4 Code layout

```
src/proxy.ts                         host rewrite + admin session gate
src/app/admin/layout.tsx             admin shell (sidebar, no marketing chrome)
src/app/admin/(auth)/login/page.tsx
src/app/admin/(app)/...              pages above, all Server Components
src/app/admin/(app)/**/actions.ts    Server Actions (mutations, audited)
src/lib/admin/auth.ts                session helpers, allow-list check
src/lib/admin/events.ts              logAdminEvent()
src/lib/admin/queries.ts             typed read queries over views
src/lib/admin/prompt-templates.ts    load-with-fallback used by ai.ts
src/app/api/t/route.ts               analytics beacon
src/app/api/health/route.ts          internal health (secret header)
src/components/admin/**              tables, filters, timeline, editors (react-aria-components)
trigger/admin.ts                     retry-lead-alerts, health-probe, (email-poll later)
supabase/migrations/2026090501_*.sql, 2026090502_*.sql
scripts/export-attio.mjs, scripts/import-attio-people.mjs
```

---

## 6. Phases and order

| Phase | Scope | Ships independently? | Rough size |
|---|---|---|---|
| **0** Foundations | `admin_events` + `logAdminEvent`, lead `alert_status`, Attio export script run, migrations pushed | yes | 0.5 day |
| **1** Pipeline | Attio removed, Supabase required, Telegram best-effort + retry task, tests, docs, privacy copy, deploy (Vercel + trigger + `supabase db push`) | yes, and should ship first | 1 day |
| **2** Admin core | subdomain + auth + shell, Dashboard, Inquiries list/detail, Contacts, Console, Settings (brain/examples/prompts), audit log, people-key migration, Attio import | yes | 3–4 days |
| **3** Observability | beacon + `site_visits`, funnel, Analytics page, health probe task, Health page, Telegram health alerts | yes | 1.5 days |
| **4** WhatsApp depth | ingest Zernio outbound events, reply-from-admin via approval path, conversation view polish | yes | 1–2 days |
| **5** Email | Gmail polling task, thread storage, classification, alerts, CRM linking | yes | 1.5 days (after §9 answer) |

Each phase ends with: `npm run typecheck && npm run lint && npm test`, a Puppeteer screenshot of
every admin route at 375 and 1440, a production smoke (form submit → Supabase row → Telegram card
→ admin shows it), and a `WHATSAPPAUTOMATIONTASK.md` changelog entry.

---

## 7. Deployment / infra checklist

- Vercel: add domain `admin.stamer.co.za` to the same project; DNS CNAME. Deployment Protection
  stays on for `*.vercel.app`.
- Supabase: enable Auth email provider, set site URL to `https://admin.stamer.co.za`, disable
  sign-ups (allow-list enforced in code too). `npx supabase db push` for the two migrations.
- New env: `ADMIN_EMAILS`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (auth
  only, never data), `HEALTH_PROBE_SECRET`, later `GMAIL_*`.
- Remove env: `ATTIO_API_KEY`, `ATTIO_CRM_KEY` (after the export is verified).
- trigger.dev: deploy with the pinned CLI (`npx trigger.dev@4.5.9 deploy`, runtime node-22 as
  documented); new queues `lead-alerts`, `health`.

---

## 8. Risks

- **Supabase outage now blocks bookings.** That is the requested behaviour. Mitigation: the form
  shows a clear error with the WhatsApp fast-lane link so the visitor still has a path; the
  failure is an `admin_event` (written on a separate best-effort path) and a health incident.
- **`ai.ts` is large and load-bearing.** Prompt templates are introduced as an override layer with
  code defaults, so drafting behaviour is byte-identical until Luke edits something. Existing
  `npm run eval` guards regressions.
- **People key relaxation** touches `upsert_inquiry_person`, `create_website_lead` and
  `ingest_zernio_message`. Verify with the PGlite harness before pushing (see memory note).
- **Zernio outbound events**: not yet verified that Zernio emits `message.sent` for phone-app
  replies. Phase 4 starts with a spike against `docs.zernio.com/api/openapi`.
- **Tests currently mirror duplicated worktrees** (known gotcha); keep `.claude/worktrees` excluded.

---

## 9. Decisions Luke needs to confirm

Recommendation in bold. If no answer, implementation proceeds with the bold option.

1. **Admin inside this Next repo** (route group + subdomain rewrite) vs separate Vite/shadcn app.
2. **Export Attio people/notes and import them into Supabase before removing Attio**, so history
   is not lost. Needs the current `ATTIO_API_KEY` to still be valid when Phase 0 runs.
3. "Prompts to the Telegram agent" = **the AI drafting prompts (brain docs, examples, and the
   hard-coded scaffolds)**. Telegram card wording stays in code. Say if you also want the card
   templates editable.
4. Auth: **magic link to a single allow-listed email**. Say if you want a password or passkey
   instead.
5. Analytics: **first-party beacon into Supabase** (cookieless, joinable to leads) alongside Vercel
   Analytics. Say if you would rather not collect visitor paths at all.
6. Email: where is `luke@stamer.co.za` hosted (Google Workspace?). Gmail API polling is the plan if
   yes; otherwise inbound forwarding to a webhook mailbox. Phase 5 waits on this.
7. Phase order: **1 → 2 → 3 → 4 → 5**, pipeline first because it is small, independent and removes
   the Attio dependency immediately.
