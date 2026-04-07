# Book Page (`/book`)

**Route:** `/book`  
**Source:** `src/app/book/page.tsx`, `src/components/BookFlow.tsx`, `src/components/CalEmbed.tsx`  
**Metadata:** Inherits global metadata from `src/app/layout.tsx` (no page-level override).

---

## Page Outline

1. [Page header](#page-header)
2. [Left panel — copy & context](#left-panel)
3. [Right panel — booking flow](#booking-flow)
   - [Step 1 — The essentials](#step-1--the-essentials)
   - [Step 2 — A few more details](#step-2--a-few-more-details)
   - [Step 3 — Cal.com embed](#step-3--calcom-embed)

---

## Page Header

Appears as the top section of the left panel (desktop: sticky left column; mobile: above the booking flow).

- Label: "Plan your event"
- Heading: **"Let's make it unforgettable."**

### Sub-heading paragraph

> Book a quick 10-minute consult to confirm fit and talk through the vision for your event.

---

## Left Panel

**Source:** `src/app/book/page.tsx`

### "On our call, we'll cover:" card

| Point | Detail |
|---|---|
| **Event flow and timing** | — from prelude to reception. |
| **Musical direction** | — setting the right atmosphere. |
| **Logistics** | — setup, amplification, and coordination. |
| **Package fit** | — making sure you get exactly what you need. |

### Fallback link (for users not ready to book a call)

> "Not ready to book a call yet?"  
> **Use the contact form instead** → `/#contact`

---

## Booking Flow

**Component:** `src/components/BookFlow.tsx`  
The right panel is a multi-step form (2 data-collection steps + a Cal.com embed).

### Step indicator

Two-segment progress bar. Active segments filled with `bg-primary`.

---

### Step 1 — The essentials

Step label: "Step 1 of 2"  
Heading: **"The essentials."**  
Sub-copy: "Just the basics so we can make our time together productive."

#### Event Type

Pill-style toggle buttons (single-select):

| Value | Label |
|---|---|
| `wedding` | Wedding |
| `private-event` | Private event |
| `corporate-event` | Corporate event |
| `fundraiser` | Fundraiser |
| `other` | Other |

#### Fields

| Label | Type | Placeholder |
|---|---|---|
| Date(s) | text | "e.g. Oct 14, 2026" |
| Location / Venue | text | "City or Venue" |
| First name | text | "Yo-Yo" |
| Last name | text | "Ma" |
| Email | email | "you@example.com" |
| Phone | tel | "(555) 000-0000" |

**Validation:** Event type, location, date, first name, and a valid email address are all required before proceeding.

**Button:** **Continue →** (disabled until valid)

---

### Step 2 — A few more details

Step label: "Step 2 of 2"  
Heading: **"A few more details."**  
Sub-copy: "These help tailor our conversation. Feel free to skip anything you don't know yet."

#### Fields

| Label | Type | Placeholder / Options | Required |
|---|---|---|---|
| Guest Count | text | "e.g. 150" | No |
| Amplification Needed? | select | Select… / Yes / No / Not sure yet | No |
| Theme / Style | text | "e.g. Black tie, rustic" | No |
| Package Interest | text | "e.g. Ceremony + Cocktail" | No |
| Extra Notes | textarea (3 rows) | "Any other details you want to share upfront?" | No |

#### Buttons

| Button | Action |
|---|---|
| ← Back | Return to Step 1 |
| Skip for now | Advance to Cal embed without optional details |
| Choose a time → | Advance to Cal embed with optional details |

---

### Step 3 — Cal.com embed

Heading: **"Choose a time."**  
Sub-copy: "Your details are saved. Pick a slot below for our short consult."

Link text (top-right): "Edit details" → returns to Step 1

**Embed note:** This step renders a Cal.com calendar widget (`<CalEmbed>`). The calendar content is dynamic and loaded from Cal.com at runtime; it is not static copy. The Cal link is configured via:

- Environment variable: `NEXT_PUBLIC_CAL_USERNAME` (default: `luke-stamer`)
- Environment variable: `NEXT_PUBLIC_CAL_EVENT_SLUG` (default: `event-planning`)
- Resulting Cal link: `luke-stamer/event-planning`

Pre-populated fields passed to Cal: name, email, phone, location, event type, date, guest count, amplification, theme, package interest, and notes.
