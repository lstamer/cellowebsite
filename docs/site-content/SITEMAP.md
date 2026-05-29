# Stamer — Site Map

**Last updated:** Generated from source. Run `npm run content:export` to refresh blog post files and the Journal section below.

---

## Public Routes

### `/` — Home
[→ index.md](./index.md)

The single-page application shell. All sections below are hash-anchored sub-sections of the home page.

| Section component | Anchor | Nav label |
|---|---|---|
| `<Navbar>` | _(sticky, no anchor)_ | — |
| `<Hero>` | _(first viewport)_ | — |
| `<Services>` | `#services` | Services |
| `<About>` | `#about` | About → My Story |
| `<Problem>` | `#why` | About → Why it matters |
| `<Solution>` | `#process` | Process → How it works |
| `<Testimonials>` | `#testimonials` | About → Customer Testimonials |
| `<CTA>` | `#booking-cta` | — |
| `<Contact>` | `#contact` | Process → Contact |
| `<Footer>` | _(bottom of page)_ | — |

**Service sub-anchors on `#services`:**

| Service | Anchor |
|---|---|
| Weddings | `#weddings` |
| Private Events | `#private-events` |
| Corporate Functions | `#corporate-events` |

---

### `/book` — Get in contact
[→ book.md](./book.md)

Multi-step booking flow: event details form → optional details → Cal.com embed for scheduling a 10-minute consult.

---

### `/blog` — Journal Index
[→ blog.md](./blog.md)

List of all published Sanity posts, ordered by `publishedAt` descending. First post is displayed as a featured card; remainder appear in a grid.

---

### `/blog/[slug]` — Individual Journal Posts

Each file below corresponds to one published Sanity document. Run `npm run content:export` to regenerate after CMS changes.

<!-- JOURNAL_SECTION_START -->

- [What I Wish Couples Knew About Wedding Music Before the Big Day](./blog/wedding-music-lessons-after-200-events.md) — `/blog/wedding-music-lessons-after-200-events`
- [How to Choose Ceremony Music That Actually Fits the Moment (A Cape Town Cellist's Guide)](./blog/wedding-ceremony-music-guide-cape-town.md) — `/blog/wedding-ceremony-music-guide-cape-town`
- [Cocktail Hour vs Reception: What Cello and Guests Need From Each](./blog/cello-cocktail-hour-vs-reception-wedding.md) — `/blog/cello-cocktail-hour-vs-reception-wedding`
- [Outdoor and Vineyard Weddings: What Changes for Live Cello](./blog/outdoor-wedding-live-cello-cape-town.md) — `/blog/outdoor-wedding-live-cello-cape-town`
- [Do You Actually Need Live Music at Your Corporate Event?](./blog/live-music-corporate-events-worth-it.md) — `/blog/live-music-corporate-events-worth-it`
- [How to Brief a Musician for a Branded or High-Stakes Corporate Function](./blog/briefing-live-musician-corporate-event.md) — `/blog/briefing-live-musician-corporate-event`
- [Live Cello for Intimate Gatherings: What Hosts Get Wrong (and How to Fix It)](./blog/live-cello-private-events-host-guide.md) — `/blog/live-cello-private-events-host-guide`
- [Building a Short Setlist for a Dinner or Celebration Without It Feeling Like a Recital](./blog/private-event-cello-setlist-dinner-party.md) — `/blog/private-event-cello-setlist-dinner-party`
- [7 Questions to Ask Before Booking a Cellist for Your Cape Town Event](./blog/questions-to-ask-before-booking-cellist.md) — `/blog/questions-to-ask-before-booking-cellist`
- [PA, Power, and Venue Logistics: What Your Cellist Needs From the Venue](./blog/cellist-pa-power-venue-requirements.md) — `/blog/cellist-pa-power-venue-requirements`
- [Classical Training vs Playing the Hits: What You're Paying For in a Professional Cellist](./blog/what-professional-cellist-brings-to-events.md) — `/blog/what-professional-cellist-brings-to-events`
- [Solo Cello vs Ensemble: How to Choose for Your Wedding or Event](./blog/solo-cello-vs-string-quartet-wedding.md) — `/blog/solo-cello-vs-string-quartet-wedding`

<!-- JOURNAL_SECTION_END -->

---

## Global Navigation

Navigation links are defined in `src/components/Navbar.tsx` as `NAV_LINKS`.

### Desktop nav links (left cluster)

| Label | Primary href | Dropdown items |
|---|---|---|
| About | `/#about` | My Story → `/#about`, Why it matters → `/#why`, Customer Testimonials → `/#testimonials` |
| Services | `/#services` | Weddings → `/#weddings`, Private Events → `/#private-events`, Corporate Events → `/#corporate-events` |
| Process | `/#process` | How it works → `/#process`, Contact → `/#contact` |
| Blog | `/blog` | _(no dropdown)_ |

### Dropdown CTA panel (Services)

- Heading: "Need help choosing the right fit?"
- Button: "Send a message" → `/#contact`

### Dropdown planner panel (Services / Process)

**Services:**
- Heading: "Ready to book?"
- Links: "Schedule a call" → `/book`, "Contact form" → `/#contact`

**Process:**  
Same planner panel content as Services.

### Navbar CTA button (right side)

- Label: "Get in contact" → `/book`

---

## Global Footer

Rendered by `<Footer>` at the bottom of every page.

| Column | Content |
|---|---|
| Brand | Logo "Stamer", tagline "Live cello for an unforgettable event. We elevate celebrations with elegance and refined artistry.", status indicator "Accepting Bookings" |
| Navigation | About, Services, Process |
| Legal | Privacy Policy, Terms of Service |
| Contact | luke@stamer.co.za, +27 63 908 1386 |
| Copyright line | "© [year] Stamer. All rights reserved." |
| Design credit | "Designed for Excellence" |

---

## Internal / Tooling Routes

These routes are not linked from the public-facing navigation.

| Route | Purpose |
|---|---|
| `/design-system` | Internal brand and component reference page. Shows color tokens, typography scale, component demos, and section templates. Not in the sitemap for end-users. |
| `/studio` | Sanity Studio CMS interface for managing blog posts and content. Protected authoring environment. No public-facing copy. |
| `/api/contact` | API route (`POST`) that receives contact form submissions from `<ContactForm>`. Not a page. |

---

## Site Metadata

Defined in `src/app/layout.tsx`:

- **Title:** Stamer - Live cello for an unforgettable event
- **Description:** Live cello music for weddings, private events, and corporate functions.
