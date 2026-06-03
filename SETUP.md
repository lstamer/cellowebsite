# Website Setup Guide

## What was built

| Feature | Route | Notes |
|---------|-------|-------|
| Contact form | Home page (above footer) | 3-step form → Attio CRM |
| Get in contact | `/book` | Booking lead form → Attio CRM + optional WhatsApp notification |
| CRM | Attio (backend only) | No CRM UI embedded on the site |

---

## Step 1 — Attio (CRM)

Form submissions from the home contact form (`POST /api/contact`) and the booking flow (`POST /api/leads`) upsert a person in Attio and attach a markdown note with the inquiry details.

1. Go to [attio.com](https://attio.com) and create an account
2. Open **Workspace settings → Developers → API keys**
3. Create an API key with access to create/update people and notes
4. Copy `.env.example` to `.env.local` and set:
   ```
   ATTIO_API_KEY=your_attio_api_key_here
   ```
   (`ATTIO_CRM_KEY` is also accepted as an alias.)

---

## Step 2 — Google Maps (optional)

Venue autocomplete on `/book` uses the Maps JavaScript API when configured:

```
NEXT_PUBLIC_GOOGLEMAPS_JS_API_KEY=your_google_maps_key
```

Without this key, the location field falls back to a plain text input.

---

## Step 3 — WhatsApp notifications (optional)

The `/book` lead API can send a WhatsApp alert via WaSender when configured:

```
WASENDER_API_KEY=your_wasender_api_key
WASENDER_NOTIFY_TO=+27xxxxxxxxxx
```

If `WASENDER_NOTIFY_TO` is omitted, the server uses its built-in default notify number.

---

## Final `.env.local`

```
ATTIO_API_KEY=your_attio_api_key_here

NEXT_PUBLIC_GOOGLEMAPS_JS_API_KEY=optional

WASENDER_API_KEY=optional
WASENDER_NOTIFY_TO=optional
```

---

## Vercel deployment

1. Import the repo in the [Vercel dashboard](https://vercel.com) (Node **20.x** is set in `package.json` `engines`).
2. Add environment variables (Production and Preview as needed):

| Variable | Required | Purpose |
|----------|----------|---------|
| `ATTIO_API_KEY` | **Yes** (forms) | Attio CRM for contact and booking APIs |
| `NEXT_PUBLIC_GOOGLEMAPS_JS_API_KEY` | No | Venue autocomplete on `/book` |
| `WASENDER_API_KEY` | No | WhatsApp alert on new booking lead |
| `WASENDER_NOTIFY_TO` | No | WaSender destination number |

3. Deploy. Do not commit `.env.local`.

---

## Post-deploy smoke test

- [ ] Home page loads; contact form renders
- [ ] Submit contact form with a test email → **200** from `/api/contact`; person appears in Attio
- [ ] `/book` loads; complete booking form (with/without Maps key)
- [ ] Submit booking lead → **200** from `/api/leads`; person + note in Attio
- [ ] If WaSender is configured, WhatsApp notification arrives
- [ ] Spot-check a few marketing routes (`/weddings`, `/private-events`, `/about`) for layout and scroll reveals

---

## Key files

```
src/app/book/page.tsx          Get in contact page (booking lead form)
src/app/api/contact/route.ts   API route → Attio CRM
src/app/api/leads/route.ts     API route → Attio CRM (+ optional WhatsApp)
src/components/ContactForm.tsx Multi-step contact form
```
