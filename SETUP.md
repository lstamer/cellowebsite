# Website Setup Guide

## What was built

| Feature | Route | Notes |
|---------|-------|-------|
| Blog | `/blog`, `/blog/[slug]` | Powered by Sanity.io |
| Contact form | Home page (above footer) | 3-step form → HubSpot CRM |
| Book a call | `/book` | Cal.com inline calendar embed |
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

## Step 2 — HubSpot (CRM + Contact Form)

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
6. The contact form on the website will now automatically create contacts in HubSpot with a note attached when someone submits

---

## Step 3 — Cal.com (Book a Call)

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
7. The `/book` page will now show your live calendar

### Connect Cal.com → HubSpot (automatic sync)
1. In Cal.com, go to **Settings → Integrations → CRM**
2. Connect **HubSpot**
3. Authorize the connection — from now on, every booking automatically creates/updates a contact in HubSpot and logs the meeting

---

## Step 4 — WhatsApp (no code required)

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
src/app/book/page.tsx             Book a call page (Cal.com embed)
src/app/api/contact/route.ts      API route → HubSpot CRM
src/components/Contact.tsx        Contact section (home page)
src/components/ContactForm.tsx    Multi-step contact form
```

## Files modified

```
src/app/page.tsx         Added <Contact /> section
src/components/CTA.tsx   "Book a call" button now links to /book
.env.local               Updated with new service credentials
```
