# Website Setup Guide

## What was built

| Feature | Route | Notes |
|---------|-------|-------|
| Contact form | Home page (above footer) | 3-step form → Supabase + Telegram alert |
| Get in contact | `/book` | Booking lead form → Supabase + Telegram alert + manual WhatsApp drafts |
| CRM | `admin.stamer.co.za` (this repo, `src/app/admin`) | Supabase-backed admin: every enquiry, contacts, console, analytics, health, prompt editors |
| Initial WhatsApp enquiries | Zernio → Supabase → Trigger.dev → Telegram | Human-approved first replies |

---

## Step 1 — Supabase (data layer + admin auth)

Form submissions from the home contact form (`POST /api/contact`) and the booking flow (`POST /api/leads`) are stored in Supabase (`inquiry_website_leads`, linked to `inquiry_people`). Supabase is the gate: if the row cannot be written the visitor gets a 500 and is pointed to WhatsApp. The Telegram alert is sent after the response and retried by the `retry-lead-alerts` task until it lands.

1. Create a Supabase project and run `npx supabase db push` from the repo root (migrations live in `supabase/migrations`).
2. Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (server-only data access; no RLS policies are needed because the browser never talks to the database).
3. For the admin login, enable the **Email** auth provider and set `ADMIN_EMAILS=lukestamer5853@gmail.com`. The application rejects every other address. Set the Supabase Site URL to the URL users actually open, then add every callback URL used by the app to Supabase Auth → URL Configuration. The current host-aware callback paths are `https://admin.stamer.co.za/auth/callback` on the admin subdomain, `https://stamer.co.za/admin/auth/callback` on the main site, and `http://localhost:3000/admin/auth/callback` in local development. The callback completes server-side, so the existing `SUPABASE_URL` and `SUPABASE_SECRET_KEY` pair is sufficient; the `NEXT_PUBLIC_*` publishable values remain supported for compatibility.
4. Supabase's built-in email sender is rate-limited (a handful of magic links per hour) and, on newer projects, only delivers to the project's own team members. Configure **Custom SMTP** (Auth → SMTP) with a Google Workspace app password for `luke@stamer.co.za` before relying on email sign-in.

---

## Step 2 — Google Maps (optional)

Venue autocomplete on `/book` uses the Maps JavaScript API when configured:

```
NEXT_PUBLIC_GOOGLEMAPS_JS_API_KEY=your_google_maps_key
```

Without this key, the location field falls back to a plain text input.

---

## Step 3 — Manual WhatsApp replies from Telegram

The website lead alert remains in Telegram. When a lead has a valid WhatsApp
number, the card includes prefilled **Message on WhatsApp**, **Available**, and
**Unavailable** buttons. Each opens the matching WhatsApp draft directly.

Nothing is sent through a WhatsApp API. Luke opens WhatsApp, checks the
message, and taps Send himself.

---

## Final `.env.local`

```
NEXT_PUBLIC_GOOGLEMAPS_JS_API_KEY=optional
TURNSTILE_SECRET=server_only_turnstile_secret
TURNSTILE_HOSTNAMES=localhost,127.0.0.1
```

The `/book` submission uses the existing managed Cloudflare Turnstile widget
with action `book`. The browser sends the one-time token to `POST /api/leads`,
and the server verifies it with Cloudflare before saving the lead. WhatsApp and
email shortcut links do not use Turnstile.

---

## Vercel deployment

1. Import the repo in the [Vercel dashboard](https://vercel.com) (Node **24.x** is set in `package.json` `engines`).
2. Add environment variables (Production and Preview as needed):

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` / `SUPABASE_SECRET_KEY` | **Yes** (forms + admin) | Supabase data layer |
| `ADMIN_EMAILS` / `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Yes** (admin) | Magic-link login on admin.stamer.co.za |
| `TURNSTILE_SECRET` / `TURNSTILE_HOSTNAMES` | **Yes** (booking form) | Turnstile secret and `stamer.co.za` hostname allowlist |
| `HEALTH_PROBE_SECRET` | No | Lets the health-probe task call `/api/health` |
| `NEXT_PUBLIC_GOOGLEMAPS_JS_API_KEY` | No | Venue autocomplete on `/book` |

3. Deploy. Do not commit `.env.local`.

---

## Post-deploy smoke test

- [ ] Home page loads; contact form renders
- [ ] Submit contact form with a test email → **200** from `/api/contact`; row in `inquiry_website_leads`; Telegram card; visible at admin.stamer.co.za/inquiries
- [ ] `/book` loads; complete booking form (with/without Maps key)
- [ ] Complete the Turnstile check on `/book`, then submit a booking lead → **200** from `/api/leads`; row + person in Supabase; Telegram card with Available / Unavailable buttons
- [ ] Tap **Message on WhatsApp** and confirm the first-contact message is preloaded
- [ ] Tap **Available** and confirm the availability message is preloaded
- [ ] Tap **Unavailable** and confirm the apology is preloaded
- [ ] Spot-check a few marketing routes (`/weddings`, `/private-events`, `/about`) for layout and scroll reveals

---

## Initial WhatsApp inquiry automation

The initial-inquiry backend shares its Supabase project with the website
form routes. It stores WhatsApp conversations in Supabase, groups consecutive
message bubbles, extracts structured event information, drafts a first reply,
and asks for approval in Telegram. It never sends a customer reply without an
authorised Telegram approval.

Full provisioning, webhook, security and smoke-test instructions are in
[`docs/inquiry-automation.md`](docs/inquiry-automation.md).

---

## Key files

```
src/app/book/page.tsx          Get in contact page (booking lead form)
src/app/api/contact/route.ts   API route → Supabase + Telegram
src/app/api/leads/route.ts     API route → Supabase + Telegram (+ AI draft flow)
src/app/admin/**               Admin CRM (admin.stamer.co.za)
src/components/ContactForm.tsx Multi-step contact form
src/app/api/webhooks/zernio/route.ts   Zernio inbound webhook
src/app/api/webhooks/telegram/route.ts Telegram approval webhook
trigger/inquiries.ts                   Durable classification and send tasks
```
