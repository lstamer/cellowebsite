# Admin area: admin.stamer.co.za

The admin is a route group in this repo (`src/app/admin/**`) served on its own
hostname by `src/proxy.ts`. It is the CRM view over Supabase, the operations
console, first-party analytics, site health, and the editors for everything
that shapes how enquiries are handled. Design and rationale: `plans/007-admin-crm-and-booking-pipeline.md`.

## What it does

| Route | Purpose |
|---|---|
| `/` | Dashboard: enquiry counts, needs-attention list, pipeline by stage, latest enquiries |
| `/inquiries` | Every enquiry from the booking form, home-page form, WhatsApp and email, with search and filters |
| `/inquiries/[id]` | Website lead detail: edit any field, resend the Telegram alert, dismiss, link to a contact, full timeline |
| `/conversations/[id]` | WhatsApp thread (live from Zernio, both directions), AI analysis, drafts and approvals, reply form |
| `/emails/[id]` | Email thread, classifier output, mark as enquiry or not, reply in Gmail |
| `/contacts` | People: search, stage filter, add, edit, merge duplicates, archive |
| `/console` | `admin_events` log plus derived "needs attention" rows; acknowledge, requeue failed outbox events |
| `/analytics` | Sessions, page views, referrers, devices, countries, `/book` funnel, recent session paths |
| `/health` | Probe results per target, 24h/7d uptime, latency, incidents, run checks now |
| `/settings/prompts` | The drafting agent's prompt scaffolds, versioned with rollback and a code-default fallback |
| `/settings/brain` | Brain docs (business knowledge), versioned |
| `/settings/examples` | Reply examples and learned corrections |
| `/settings/integrations` | Which env vars are set, Telegram test message, allow-list |

Every manual change is written to `admin_audit_log` with before/after values.

## One-time setup

### 1. Database

Apply the migrations in order (all five are idempotent and were proven against
real Postgres with PGlite before commit):

```
supabase/migrations/202609050001_admin_events_lead_alerts.sql
supabase/migrations/202609050002_admin_crm.sql
supabase/migrations/202609050003_analytics_health.sql
supabase/migrations/202609050004_whatsapp_depth.sql
supabase/migrations/202609050005_email_inquiries.sql
```

```bash
npx supabase@latest link --project-ref qrefdgmnifyufznuzwxu
npx supabase@latest db push
```

Apply these **before** deploying the code: the form routes now require the
`inquiry_website_leads` write, and the admin pages show a "migration pending"
banner (with empty data) until the tables exist.

### 2. Supabase Auth

Dashboard → Authentication:

- Providers → Email: enabled. "Confirm email" can stay on; magic links are used.
- Sign-ups: **disable** new sign-ups after the first login, or leave enabled;
  the code refuses any address that is not in `ADMIN_EMAILS` either way.
- URL configuration → Site URL: `https://admin.stamer.co.za`.
  Redirect URLs: add `https://admin.stamer.co.za/auth/callback` and
  `http://localhost:3000/admin/auth/callback` (and any other dev port).
- Email template "Magic Link": keep the default. Both `{{ .ConfirmationURL }}`
  (PKCE code) and `{{ .TokenHash }}` links are handled by the callback.

### 3. Vercel

- Project → Domains: add `admin.stamer.co.za` (CNAME to `cname.vercel-dns.com`
  at the DNS host). The apex `stamer.co.za` redirects `/admin/*` to the
  admin host in production; localhost keeps `/admin` as a path.
- Environment variables (Production, and Preview if you use it):

| Variable | Value |
|---|---|
| `ADMIN_EMAILS` | `lukestamer5853@gmail.com` (comma-separated for more) |
| `SUPABASE_PUBLISHABLE_KEY` | The `sb_publishable_…` key (auth cookies only) |
| `HEALTH_PROBE_SECRET` | Any long random string; the probe sends it to `/api/health` |
| `SITE_URL` | `https://stamer.co.za` (optional, this is the default) |
| `ADMIN_HOST` | Only if the hostname differs from `admin.stamer.co.za` |

`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, the Telegram, Zernio, Trigger.dev and AI
Gateway variables are already required by the inquiry pipeline. Remove
`ATTIO_API_KEY` / `ATTIO_CRM_KEY`; nothing reads them any more.

### 4. Trigger.dev

New tasks in `trigger/admin.ts` and `trigger/email.ts`:

| Task | Schedule | Purpose |
|---|---|---|
| `retry-lead-alerts` | every 5 min | Resend failed Telegram lead alerts (max 5 attempts) |
| `health-probe` | every 5 min | Load the site, run `/api/health`, store results, alert on state change |
| `prune-analytics-and-health` | daily 03:17 | Keep `site_visits` (180 d) and `health_checks` (30 d) small |
| `poll-gmail-inquiries` | every 5 min | Store, classify and alert on email enquiries (skips itself until Gmail is configured) |

Add `HEALTH_PROBE_SECRET`, `SITE_URL`, `TELEGRAM_CHAT_ID` and the `GMAIL_*`
variables to the Trigger.dev environment, then deploy with the pinned CLI:

```bash
set -a; source .env.local; set +a
npx trigger.dev@4.5.9 deploy
```

### 5. Zernio

The webhook already subscribed to `message.received` should also subscribe to
`message.sent` so replies typed in the WhatsApp Business app (Coexistence
numbers) and API sends are stored in the thread. Same endpoint, same secret.

### 6. Gmail (email enquiries)

Read-only access to the Google Workspace mailbox.

1. Google Cloud Console → a project in the Workspace organisation → APIs &
   Services → enable **Gmail API**.
2. OAuth consent screen: internal (Workspace) is simplest. Scope
   `https://www.googleapis.com/auth/gmail.readonly`.
3. Credentials → OAuth client ID → **Desktop app**. Copy the client id and secret.
4. On your machine:
   ```bash
   GMAIL_CLIENT_ID=… GMAIL_CLIENT_SECRET=… node scripts/gmail-auth.mjs
   ```
   Open the printed URL signed in as `luke@stamer.co.za`, approve, and copy the
   printed `GMAIL_REFRESH_TOKEN`.
5. Set `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` and
   `GMAIL_OWN_ADDRESS` in Trigger.dev (and Vercel, for the integrations page).

The poller reads mail from the last two days on first run, then keeps a
one-hour overlap. It never labels, archives, replies or deletes.

## How the pieces fit

- **Forms** (`/api/leads`, `/api/contact`): Supabase write is required (500 on
  failure, `admin_events` row). Telegram alert is best-effort through a
  claim/complete/fail trio on the lead (`alert_status`), retried by
  `retry-lead-alerts`. Text is built from the stored row in
  `src/lib/inquiries/website-leads.ts`, so retries are byte-identical.
- **People** (`inquiry_people`): keyed on phone or email. `upsert_inquiry_person`
  links by phone first, then email, and folds an email-only person into a
  phone-keyed one when both are seen. `merge_inquiry_people` is the manual merge.
- **Prompts**: `src/lib/inquiries/prompt-templates.ts` holds the code defaults;
  an active row in `inquiry_prompt_templates` overrides a slug. Loaded once per
  AI run with a 60-second cache. `drafting_rules` must keep the two
  availability bullets verbatim (validated on save).
- **Analytics**: `src/lib/analytics-client.ts` and `SiteTracker` send page views
  and `book_step` / `book_submitted` events to `/api/t`. No cookies, no IP, no
  user agent stored; DNT honoured; admin and API paths excluded.
- **Health**: `src/lib/admin/health.ts` runs the checks; `/api/health` exposes
  them to the probe behind `HEALTH_PROBE_SECRET`; `trigger/admin.ts` stores
  results and alerts Telegram only on transitions.
- **Admin reply** (`create_admin_reply`): an already-approved approval plus its
  outbox event; the send still runs through `claim_inquiry_approval_send`.

## Local development

```bash
npm run dev            # http://localhost:3000/admin
```

`ADMIN_EMAILS` and `SUPABASE_PUBLISHABLE_KEY` must be in `.env.local`. On
localhost the callback is `/admin/auth/callback`; Supabase must list it in
Redirect URLs for the magic-link email to work. The proxy leaves `/admin` as a
path on localhost and rewrites only on the admin host.
