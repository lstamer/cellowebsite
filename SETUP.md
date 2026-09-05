# Website Setup Guide

## What was built

| Feature | Route | Notes |
|---------|-------|-------|
| Contact form | Home page (above footer) | 3-step form → Supabase (required) → Telegram alert (best-effort, retried) |
| Get in contact | `/book` | Booking lead form → Supabase (required) → Telegram alert (best-effort, retried) |
| CRM / admin | `admin.stamer.co.za` | Login-protected view over Supabase: enquiries, contacts, console, analytics, health, prompt editors |
| Initial WhatsApp enquiries | Zernio → Supabase → Trigger.dev → Telegram | Human-approved first replies |

---

## Step 1 — Supabase (system of record)

Both form routes (`POST /api/contact`, `POST /api/leads`) call the
`create_website_lead` RPC. If that write fails the visitor sees an error and
nothing else runs, so Supabase must be configured before the forms work.

1. Create a Supabase project and apply every file in `supabase/migrations/` in
   order (`npx supabase@latest db push` after linking).
2. Create a server secret (`sb_secret_...`) and set:
   ```
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_...
   ```

Full provisioning of the WhatsApp automation (Trigger.dev, Zernio, AI Gateway)
is in [`docs/inquiry-automation.md`](docs/inquiry-automation.md).

---

## Step 2 — Telegram (lead alerts)

Every stored enquiry is pushed to Luke's Telegram. A failed push is recorded on
the lead (`alert_status`), logged to `admin_events`, and retried every five
minutes by the `retry-lead-alerts` Trigger.dev task (up to five attempts).

```
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_APPROVER_USER_IDS=
TELEGRAM_WEBHOOK_SECRET=
```

---

## Step 3 — Google Maps (optional)

The location field on `/book` uses Places autocomplete when
`NEXT_PUBLIC_GOOGLEMAPS_JS_API_KEY` is set. Without it the field is a plain
text input.

---

## Step 4 — Admin area

See `docs/admin.md` for the subdomain, Supabase Auth and env setup of
`admin.stamer.co.za`.

---

## Vercel deployment

1. Import the repo in the [Vercel dashboard](https://vercel.com) (Node **24.x** is set in `package.json` `engines`).
2. Add environment variables (Production and Preview as needed). The full list
   with comments is in `.env.example`.

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | **Yes** (forms) | System of record for every enquiry |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | **Yes** (alerts) | Lead alerts and approvals |
| `TRIGGER_SECRET_KEY` | **Yes** | Background tasks (drafts, retries, health) |
| `NEXT_PUBLIC_GOOGLEMAPS_JS_API_KEY` | No | Venue autocomplete on `/book` |

3. Deploy. Do not commit `.env.local`.

---

## Post-deploy smoke test

- [ ] Home page loads; contact form renders
- [ ] Submit contact form with a test email → **200** from `/api/contact`; row in `inquiry_website_leads`; Telegram card arrives
- [ ] `/book` loads; complete booking form (with/without Maps key)
- [ ] Submit booking lead → **200** from `/api/leads`; row in `inquiry_website_leads` with `alert_status = sent`
- [ ] Both leads appear on `admin.stamer.co.za/inquiries`
- [ ] Spot-check a few marketing routes (`/weddings`, `/private-events`, `/about`) for layout and scroll reveals

---

## Key files

```
src/app/book/page.tsx                  Get in contact page (booking lead form)
src/app/api/contact/route.ts           API route → Supabase → Telegram
src/app/api/leads/route.ts             API route → Supabase → Telegram
src/lib/inquiries/website-leads.ts     Shared alert builder + delivery (also used by the retry task)
src/lib/admin/events.ts                logAdminEvent(): central failure log
src/components/ContactForm.tsx         Multi-step contact form
src/app/api/webhooks/zernio/route.ts   Zernio inbound webhook
src/app/api/webhooks/telegram/route.ts Telegram approval webhook
src/app/admin/                         Admin area (admin.stamer.co.za)
trigger/inquiries.ts                   WhatsApp automation tasks
trigger/admin.ts                       Lead alert retries, health probes
```
