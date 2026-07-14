# WHATSAPP AUTOMATION TASK — Agent Onboarding & Runbook

> **READ THIS FIRST.** If you are an AI agent (Claude, Codex, Gemini, anyone) joining this
> project in a fresh session: this file is the single source of truth for the WhatsApp
> inquiry-automation assignment. Read it fully before touching anything. When you finish a
> work session, **update the Current Status and Changelog sections** so the next agent
> inherits an accurate picture. Keep secrets out of chat transcripts — verify env values by
> presence/hash/probe, never by printing them.

---

## 1. The Assignment

Luke Stamer is a solo cellist in Cape Town (site: [https://stamer.co.za](https://stamer.co.za)). All booking
inquiries arrive on WhatsApp and he answers them manually, often 24–48h late — his biggest
business problem (speed-to-lead). The mission, in phases:

1. **Phase 1 (this task): approval-gated AI first response.** Every inbound WhatsApp
  message is ingested, analysed by an LLM, and a proposed first reply is drafted — but
   **nothing is ever sent without Luke tapping Approve on a Telegram card**. The AI cannot
   send autonomously, cannot quote prices, cannot claim date availability.
2. **Phase 2 (future): data layer maturity.** Every message and every (draft → Luke's
  edit) pair is stored so agents learn his voice; a markdown "brain" (packages, pricing
   logic, travel radius, repertoire, FAQ) feeds prompts.
3. **Phase 3 (future): graduated autonomy.** FAQ-type replies go out automatically once
  proven; Google Calendar integration allows truthful availability answers; email channel;
   cold→warm→booked pipeline dashboard. Target: ~90% of inbound handling automated.

The current engineering objective — **the Ralph loop's goal** — is to take the Phase 1
pipeline (built by Codex in commit `0c3262b`, hardened since) **live in production and
prove it end-to-end** with verified evidence at every hop.

## 2. What is the Ralph loop?

This repo is being worked on with oh-my-claudecode's **ralph** skill: a PRD-driven
persistence loop. The task is broken into user stories with concrete acceptance criteria in
a `prd.json`; an agent iterates story-by-story, marks `passes: true` only with fresh
evidence, and may not declare completion until a reviewer (architect) verifies against the
criteria, an anti-slop cleanup pass runs, and regression checks pass again.

- Active PRD: `.omc/state/sessions/<sessionId>/prd.json` (session-scoped; snapshots may be
copied to `.omc/research/whatsapp-golive-*`).
- Iteration journal: `progress.txt` next to the PRD — read it to see exactly what was
verified and what was blocked.
- If you start a fresh Ralph run for follow-on work, create a NEW PRD scoped to that work;
do not resurrect the old session's PRD. Use this document for context instead.



## 3. Tech stack & accounts


| Layer                  | Tech                                       | Details                                                                                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Website / webhook host | Next.js (App Router) on Vercel             | Project `maestro-stamers-projects/cellowebsite`, prod domain **[https://stamer.co.za](https://stamer.co.za)** (apex ONLY — www 307-redirects and `*.vercel.app` is blocked by Deployment Protection; webhooks must use the apex)                                   |
| WhatsApp transport     | **Zernio** (WhatsApp Business API wrapper) | API base `https://zernio.com/api/v1`. Webhook subscription "My Webhook" → `POST /api/webhooks/zernio`, event `message.received`, HMAC-SHA256 hex signature in `x-zernio-signature`. Send endpoint: `POST /api/v1/inbox/conversations/{id}/messages`                |
| Operational DB         | **Supabase** Postgres                      | Project `qrefdgmnifyufznuzwxu` ("cellobackend"). 8 tables prefixed `inquiry_`* + RPCs, migration `supabase/migrations/202607110001_initial_inquiry_automation.sql`. RLS on; server access via `SUPABASE_SECRET_KEY` only                                           |
| Orchestration          | **Trigger.dev v4**                         | Tasks in `trigger/inquiries.ts`: `process-inquiry-conversation` (trailing 2m debounce per conversation, no cap — each new message resets the timer), `notify-inquiry-review`, `send-approved-inquiry-response` (single-claim, never auto-retried), `dispatch-inquiry-outbox` (cron `* * * * `*, recovery path) |
| AI                     | **Vercel AI Gateway** via `ai` SDK         | `AI_MODEL` env (currently `anthropic/claude-sonnet-4.6`). Returns schema-validated analysis + proposed reply. Prompt lives in `src/lib/inquiries/ai.ts`                                                                                                            |
| Human approval         | **Telegram bot** `@MaestroStamerBot`       | Private supergroup "Whatsapp verification". Approve/Reject buttons → `POST /api/webhooks/telegram` (secret header + allow-listed approver user IDs)                                                                                                                |
| Legacy CRM             | Attio                                      | Untouched. Supabase is positioned to replace it eventually                                                                                                                                                                                                         |


**Env vars** — see `.env.example` and the placement matrix in
`docs/inquiry-automation.md`. They live in three places: `.env.local` (dev), Vercel
production (webhook routes), Trigger.dev prod (task runtime). Note: Vercel marks them
sensitive — `vercel env pull` returns EMPTY values for them; verify by `vercel env ls`
ages and live probes instead.

## 4. Architecture (message lifecycle)

```
WhatsApp user → Zernio → POST https://stamer.co.za/api/webhooks/zernio  (HMAC verified)
  → Supabase RPC ingest_zernio_message  (dedupes on provider_event_id, stores message
    + transactional outbox event — a stored message can NEVER be lost)
  → trigger process-inquiry-conversation  (trailing 2m debounce, uncapped — resets per message,
    concurrency 1 per conversation; multi-bubble messages analysed together)
  → AI Gateway analysis  (intents, source, event fields, confidence + drafted reply;
    deterministic policy: EVERY reply requires human review in this rollout)
  → notify-inquiry-review → Telegram card with Approve / Reject buttons
  → Luke taps…
      Reject  → status=rejected, nothing sent, card updated
      Approve → send-approved-inquiry-response: atomic single claim (no double-send),
                24h WhatsApp service-window enforced at claim time, exact stored draft
                sent via Zernio, card updated with outcome
  → dispatch-inquiry-outbox (every minute) requeues stale claims / failed triggers
```

Safety properties (verified in code + tests): HMAC required; idempotent on provider event
id; model cannot send; compare-and-set approval decisions; ambiguous send failures are
never auto-retried; a new customer message supersedes an undecided draft.

## 5. Success criteria (Phase 1 go-live)

1. Local: tests, typecheck, lint (scoped), production build all pass. ✅
2. Supabase migration applied; all tables reachable. ✅
3. Trigger.dev tasks deployed with env vars; cron recovery task active. ✅
4. Vercel prod has correct env (incl. fixed `SUPABASE_URL`, added `ZERNIO_WEBHOOK_SECRET`);
  webhook routes live on the apex domain. ✅
5. Telegram webhook registered (secret + callback_query only). ✅
6. Zernio subscription verified (URL, event, secret match). ✅
7. **Production E2E smoke**: signed synthetic inquiry → Supabase rows → Trigger run → AI
  draft → Telegram card → Reject exercised → no WhatsApp send → duplicate delivery no-op
   → synthetic rows cleaned up. ✅
8. Reviewer (architect) verification, anti-slop pass on changed files, regression re-run. ✅
9. Real-phone smoke (Luke sends 3 bubbles, approves once) — final human acceptance. ⬅ remaining



## 6. Current status (update me!)

**Last updated: 2026-07-14 — Phase 1 live; Phase 2/3 foundations built and deploying.**

- **Burst window fixed**: `process-inquiry-conversation` now uses a trailing 2-minute
  debounce with NO maxDelay — every new message resets the timer, so bursts of any
  length are analysed as one batch once the customer goes quiet.
- **Phase 2 data layer live in Supabase** (migration `202607140001`): `inquiry_brain_docs`
  (6 seeded docs: identity, services, pricing-policy, availability-policy, travel,
  repertoire — Luke edits/extends in Studio), `inquiry_reply_examples` (voice corpus +
  auto-captured corrections, retrieved by intent overlap at draft time),
  `inquiry_media_assets` (curated media the AI may propose; needs public URLs, e.g.
  Supabase Storage public bucket — **table is empty until Luke adds assets**).
- **Two-stage AI**: extraction call → knowledge retrieval → drafting call grounded in
  brain docs + intent-matched examples + media library. Draft may propose ≤2 media
  slugs; card shows them; sent via Zernio `attachmentUrl` after the approved text.
- **Phase 3 feedback loop**: reply to any Telegram review card with the correct text →
  it is sent through the same guarded send machinery AND stored as a teaching example
  (`record_inquiry_override`). Requires Telegram webhook re-registration with
  `allowed_updates: ["callback_query","message"]` (see §Telegram in the runbook).
- **Eval harness**: `npm run eval` replays decided inquiries through the current
  pipeline; LLM judge scores content/voice and fails on guardrail violations.
- **Everything deployed and E2E-verified in production (2026-07-14)**: Trigger.dev
  versions `20260714.1`/`.2` (4 tasks), Vercel deploy live, Telegram webhook
  re-registered with `allowed_updates: ["callback_query","message"]` (verified via
  getWebhookInfo). Production smoke with a synthetic media+pricing enquiry passed:
  two-stage draft (guarded wording, no price, no availability claim, no invented
  media), card sent, simulated authorized Reject persisted (nothing sent), simulated
  reply-to-card override → status approved → send machinery ran and failed safely on
  the fake conversation (never retried), and the (rejected draft → override) pair was
  captured in `inquiry_reply_examples` tagged with 5 intents. All synthetic rows
  cleaned. Storage bucket `inquiry-media` (public) created for media assets.
- Remaining for Luke: real-phone acceptance (long burst → one card ~2 min after the
  last bubble → try Approve on one enquiry and reply-to-card override on another),
  upload media files to the `inquiry-media` bucket + add `inquiry_media_assets` rows,
  refine the seeded `inquiry_brain_docs` in Studio (especially pricing when ready).

### Previous status (2026-07-12, Ralph iteration 4, session 78c3e5e6) — PHASE 1 WENT LIVE

- **All 8 PRD stories passed.** Production E2E smoke verified the entire pipeline:
signed ingest (202) → dedupe on redelivery → one message row + outbox `dispatched` →
Trigger.dev run → AI draft (claude-sonnet-4.6, `policy=human_review`, correctly guarded
wording) → Telegram approval card in the group → authorized **Reject** persisted
(`status=rejected`, `sent_at=null`, nothing sent) → synthetic rows cleaned up.
- Two production-only defects were found and fixed during go-live:
  1. Vercel prod `SUPABASE_SECRET_KEY` predated the URL fix and didn't match the new
    Supabase project (`Invalid API key` in runtime logs) — overwritten by Luke.
  2. Trigger.dev default runtime lacks native WebSocket, which `@supabase/supabase-js`
    requires → every task run failed. Fixed with `runtime: "node-22"` in
     `trigger.config.ts`, deployed as version `20260712.3`.
- Remaining (human acceptance, not blocking): Luke sends 3 real WhatsApp bubbles from
another phone, checks the single combined Telegram card, taps Approve once, and confirms
exactly one WhatsApp reply arrives. Steps are in `docs/inquiry-automation.md` §Verification.
- Next phases (see §1): voice corpus + brain docs, draft-edit capture, graduated autonomy.



## 7. Key files


| File                                     | Purpose                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| `docs/inquiry-automation.md`             | Canonical runbook: provisioning, env matrix, verification steps                               |
| `WHATSAPPAUTOMATIONTASK.md`              | This file — agent onboarding + live status                                                    |
| `src/app/api/webhooks/zernio/route.ts`   | Inbound WhatsApp webhook (HMAC → ingest → trigger)                                            |
| `src/app/api/webhooks/telegram/route.ts` | Approval decisions webhook                                                                    |
| `src/lib/inquiries/*`                    | ai, policy, schema, security, supabase, telegram, triggering, zernio modules (+ vitest tests) |
| `trigger/inquiries.ts`                   | All four Trigger.dev tasks                                                                    |
| `supabase/migrations/202607110001_*.sql` | Full schema + RPCs                                                                            |
| `scripts/smoke-inquiry.mjs`              | Signed synthetic E2E smoke test with cleanup (`--url`, `--wait`, `--keep`)                    |




## 8. Operational gotchas (hard-won — do not relearn these)

- **Webhooks: apex domain only.** `https://stamer.co.za`. www redirects (callers don't
follow); `*.vercel.app` is 401-walled by Deployment Protection.
- **Vercel env changes need a redeploy** to take effect; sensitive vars pull as empty.
- **Zernio API base is** `https://zernio.com/api/v1` (NOT api.zernio.com). Webhook config:
`GET /webhooks/settings` — response contains the plaintext signing secret; never print it.
- **Permission gating**: in Claude Code auto mode, production deploys, secret-store writes,
and webhook registrations are classifier-gated. Batch them into copy-paste commands for
Luke instead of retrying.
- **Local testing without polluting prod queues**: run the dev server with an invalid
`TRIGGER_SECRET_KEY` — ingest still works and the outbox releases with an error (the
designed no-loss path), nothing reaches Trigger.dev.
- **Trigger.dev runtime must be** `node-22` (`trigger.config.ts`) — `@supabase/supabase-js`
requires native WebSocket; on the default runtime every task run fails with
"native WebSocket not found".
- `npx trigger.dev deploy` **does not read** `.env.local` — run
`set -a; source .env.local; set +a` first or the config throws on `TRIGGER_PROJECT_REF`.
- **Pin the Trigger CLI to the installed SDK version** (`npx trigger.dev@4.5.3 deploy`):
`@latest` aborts on any CLI/SDK version mismatch when run non-interactively.
- **Zernio's full OpenAPI spec lives at** `https://docs.zernio.com/api/openapi` (YAML).
Media send = the normal send endpoint with `attachmentUrl` + `attachmentType`
(`image|video|audio|file`); the URL must be publicly accessible.
- **eslint full-repo has pre-existing unrelated failures** (`.kilo/worktrees/...`); lint
scoped dirs only.
- **Never** delete a Vercel env var without immediately re-adding it (other code may read
it at the next build).
- The smoke script's synthetic conversation must always end in **Reject** — its Zernio
conversation id is fake, an Approve would attempt (and fail) a real send.



## 9. Rules for future agents

1. Read this file, then `docs/inquiry-automation.md`, then the latest `progress.txt`.
2. Evidence over assumption: probe live systems read-only before changing anything.
3. Never print secret values; compare via hashes or HTTP status probes.
4. All replies stay human-approved until Luke explicitly changes the policy in
  `src/lib/inquiries/policy.ts` — do not loosen it opportunistically.
5. After any change: `npm test`, `npm run typecheck`, scoped eslint, `npm run build`, and
  (for pipeline changes) `node scripts/smoke-inquiry.mjs` locally, then against prod.
6. Update §6 Current Status and §10 Changelog before you stop.



## 10. Changelog

- **2026-07-11 (Codex)** — Built the entire Phase 1 pipeline: schema, webhooks, tasks,
policy, tests, runbook (`0c3262b`, `6db63b8`).
- **2026-07-11→12 (Claude / Ralph loop)** — Verified all credentials & infrastructure;
found + shipped fixes for stale `SUPABASE_URL` and missing `ZERNIO_WEBHOOK_SECRET` in
Vercel; Telegram webhook registered; Trigger tasks deployed; built
`scripts/smoke-inquiry.mjs`; local smoke PASS; production smoke in progress.
- **2026-07-14 (Claude)** — Uncapped 2m trailing burst debounce; Phase 2 knowledge
layer (brain docs / reply examples / media assets, migration `202607140001` applied to
prod); two-stage extraction→drafting pipeline with media proposals; Phase 3
reject-override learning loop via Telegram card replies; `npm run eval` draft-quality
harness. Zernio media send verified against the official OpenAPI spec
(docs.zernio.com/api/openapi): same send endpoint, `attachmentUrl` +
`attachmentType`, public URL required.

