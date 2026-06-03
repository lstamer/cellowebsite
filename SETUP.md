# Website Setup Guide

## What was built

| Feature | Route | Notes |
|---------|-------|-------|
| Contact form | Home page (above footer) | 3-step form → Attio CRM |
| Get in contact | `/book` | Booking lead form → Attio CRM + WhatsApp notification |
| CRM | Attio (backend only) | No CRM UI embedded on the site |

---

## Step 1 — Attio (CRM)

Form submissions from the home contact form (`POST /api/contact`) and the booking flow (`POST /api/leads`) upsert a person in Attio and attach a markdown note with the inquiry details.

1. Go to [attio.com](https://attio.com) and create an account
2. Open **Workspace settings → Developers → API keys**
3. Create an API key with access to create/update people and notes
4. In `.env.local`, add:
   ```
   ATTIO_API_KEY=your_attio_api_key_here
   ```
   (`ATTIO_CRM_KEY` is also accepted as an alias.)

---

## Step 2 — Supabase (`/book` Lead Capture)

1. Use the existing Supabase project:
   ```
   https://bbxmjgtgyvhyvnrqxdsw.supabase.co
   ```
2. In Supabase, go to **Project Settings → API**
3. Copy the **service_role** key. Keep it server-only and never expose it with a `NEXT_PUBLIC_` prefix.
4. In `.env.local`, add:
   ```
   SUPABASE_URL=https://bbxmjgtgyvhyvnrqxdsw.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   ```
5. The `/book` form will now insert new booking inquiries into `public.leads`.

---

## Step 3 — Cal.com (Optional Scheduling)

1. Go to [cal.com](https://cal.com) and create a free account
2. Connect your **Google Calendar** (or Outlook) under Settings → Calendars
3. Set your availability under **Availability**
4. Note your **username** (shown in your profile URL: `cal.com/username`)
5. Create or confirm you have a `30min` event type (or rename the slug to match)
6. In `.env.local`, replace:
   ```
   NEXT_PUBLIC_CAL_USERNAME=your_cal_username_here
   NEXT_PUBLIC_CAL_EVENT_SLUG=30min
   ```
7. These variables are available for any Cal.com scheduling embed or link you add

---

## Step 4 — WhatsApp notifications (booking form)

The `/book` lead API can send a WhatsApp alert via WaSender when configured:

```
WASENDER_API_KEY=your_wasender_api_key
WASENDER_NOTIFY_TO=+27xxxxxxxxxx
```

---

## Final .env.local

Your completed `.env.local` should look like this:

```
ATTIO_API_KEY=your_attio_api_key_here

SUPABASE_URL=https://bbxmjgtgyvhyvnrqxdsw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

NEXT_PUBLIC_CAL_USERNAME=lstamer
NEXT_PUBLIC_CAL_EVENT_SLUG=30min

WASENDER_API_KEY=optional
WASENDER_NOTIFY_TO=optional
```

---

## Key files

```
src/app/book/page.tsx          Get in contact page (booking lead form)
src/app/api/contact/route.ts   API route → Attio CRM
src/app/api/leads/route.ts     API route → Attio CRM (+ optional WhatsApp)
src/components/ContactForm.tsx Multi-step contact form
```
