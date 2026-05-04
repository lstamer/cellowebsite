# Website Setup Guide

## What was built

| Feature | Route | Notes |
|---------|-------|-------|
| Blog | `/blog`, `/blog/[slug]` | Powered by Sanity.io |
| Contact form | Home page (above footer) | 3-step form → HubSpot CRM |
| Get in contact | `/book` | Booking lead form → Supabase `public.leads` |
| CRM | HubSpot (backend only) | No HubSpot UI on the site |
| WhatsApp inbox | HubSpot Conversations | Configured in HubSpot, no code |

---

## Step 1 — Sanity (Blog)

1. Go to [sanity.io](https://sanity.io) and create a free account
2. Create a new project — name it "Stamer Cello"
3. Note your **Project ID** (shown in the project dashboard)
4. In `.env.local`, replace:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
   ```
5. Install the Sanity CLI and init the studio:
   ```bash
   npm install -g sanity
   sanity init --env
   ```
6. In the Sanity Studio, create a **Document type** called `post` with these fields:
   - `title` (string)
   - `slug` (slug, source: title)
   - `publishedAt` (datetime)
   - `excerpt` (text)
   - `category` (string)
   - `mainImage` (image)
   - `body` (portable text / block content)
7. Run the studio locally with `sanity dev` or deploy it with `sanity deploy`
8. Publish your first post — it will appear at `/blog`

---

## Step 2 — HubSpot (CRM + Home Contact Form)

1. Go to [hubspot.com](https://hubspot.com) and create a **free** account
2. Navigate to **Settings → Integrations → Private Apps**
3. Create a new Private App:
   - Name: "Stamer Website"
   - Scopes to enable:
     - `crm.objects.contacts.write`
     - `crm.objects.notes.write`
4. Copy the generated token
5. In `.env.local`, replace:
   ```
   HUBSPOT_API_KEY=your_hubspot_private_app_token_here
   ```
6. The home page contact form will now automatically create contacts in HubSpot with a note attached when someone submits

---

## Step 3 — Supabase (`/book` Lead Capture)

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

## Step 4 — Cal.com (Optional Scheduling)

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

### Connect Cal.com → HubSpot (automatic sync)
1. In Cal.com, go to **Settings → Integrations → CRM**
2. Connect **HubSpot**
3. Authorize the connection — from now on, every booking automatically creates/updates a contact in HubSpot and logs the meeting

---

## Step 5 — WhatsApp (no code required)

1. You need a **Meta Business account** and a **WhatsApp Business** phone number
2. In HubSpot, go to **Settings → Inbox → Inboxes**
3. Click **Connect a channel → WhatsApp**
4. Follow the prompts to connect your WhatsApp Business account
5. Done — messages sent to your WhatsApp number will appear in HubSpot Conversations alongside form submissions and emails

---

## Final .env.local

Your completed `.env.local` should look like this:

```
NEXT_PUBLIC_SANITY_PROJECT_ID=abc123xyz
NEXT_PUBLIC_SANITY_DATASET=production

HUBSPOT_API_KEY=pat-eu1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

SUPABASE_URL=https://bbxmjgtgyvhyvnrqxdsw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

NEXT_PUBLIC_CAL_USERNAME=lstamer
NEXT_PUBLIC_CAL_EVENT_SLUG=30min
```

---

## New files created

```
src/sanity/client.ts              Sanity client config
src/sanity/queries.ts             GROQ queries for posts
src/sanity/types.ts               TypeScript types for Sanity documents
src/app/blog/page.tsx             Blog listing page
src/app/blog/[slug]/page.tsx      Individual blog post page
src/app/book/page.tsx             Get in contact page (booking lead form)
src/app/api/contact/route.ts      API route → HubSpot CRM
src/app/api/leads/route.ts        API route → Supabase leads
src/components/Contact.tsx        Contact section (home page)
src/components/ContactForm.tsx    Multi-step contact form
```

## Files modified

```
src/app/page.tsx         Added <Contact /> section
src/components/CTA.tsx   "Get in contact" button now links to /book
.env.local               Updated with new service credentials
```
