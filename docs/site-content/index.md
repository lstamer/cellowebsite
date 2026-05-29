# Home Page (`/`)

**Route:** `/`  
**Source:** `src/app/page.tsx` + individual section components in `src/components/`  
**Metadata source:** `src/app/layout.tsx` (shared across all routes)

## Metadata

- **Title:** Stamer - Live cello for an unforgettable event
- **Description:** Live cello music for weddings, private events, and corporate functions.

---

## Section Outline

1. [Navbar](#navbar) — sticky, global
2. [Hero](#hero) — full-viewport opening section
3. [Services](#services) — `#services`
4. [About](#about) — `#about`
5. [Why It Matters / Problem](#why-it-matters) — `#why`
6. [Process / Solution](#process) — `#process`
7. [Testimonials](#testimonials) — `#testimonials`
8. [CTA Banner](#cta-banner) — `#booking-cta`
9. [Contact](#contact) — `#contact`
10. [Footer](#footer)

---

## Navbar

**Component:** `src/components/Navbar.tsx`  
**Behavior:** Transparent on load; gains a background on scroll. Includes dropdown mega-menus on hover.

### Navigation links

| Label | Href | Notes |
|---|---|---|
| About | `/#about` | Has dropdown |
| Services | `/#services` | Has dropdown + CTA panel |
| Process | `/#process` | Has dropdown + planner panel |
| Blog | `/blog` | No dropdown |

### About dropdown

- Section label: "About"
- Items:
  - **My Story** — "The journey behind the music" → `/#about`
  - **Why it matters** — "Why live cello changes the room" → `/#why`
  - **Customer Testimonials** — "Words from past clients" → `/#testimonials`

### Services dropdown

- Section label: "Services"
- Items:
  - **Weddings** → `/#weddings`
  - **Private Events** → `/#private-events`
  - **Corporate Events** → `/#corporate-events`
- CTA panel:
  - Heading: "Need help choosing the right fit?"
  - Button: "Send a message" → `/#contact`
- Planner panel:
  - Heading: "Ready to book?"
  - Links: "Schedule a call" → `/book`, "Contact form" → `/#contact`

### Process dropdown

- Section label: "Process"
- Items:
  - **How it works** → `/#process`
  - **Contact** → `/#contact`
- Planner panel (same as Services)

### CTA button (right side)

> **Get in contact** → `/book`

---

## Hero

**Component:** `src/components/Hero.tsx`  
**Anchor:** _(first viewport, no hash anchor)_  
**Background:** Looping video `/celloheaderdesktop.mp4` with gradient overlays.

### Heading

```
Special moments
Live cello
```

*(Two lines: the first is display-weight sans-serif uppercase; the second is large serif italic.)*

### Body copy

> Elevate your celebration with live cello music that brings warmth, elegance, and calm confidence to the room from the first arrival to the final toast.

### CTA button

> **Get in contact** → `#contact`

---

## Services

**Component:** `src/components/Services.tsx`  
**Anchor:** `#services`

### Section header

- Label: "Services"
- Heading: "Planning something big?"

### Service cards

Each card has an `id` attribute for direct anchor linking.

#### 1. Weddings (`#weddings`)

- Label: "Ceremonies"
- Title: **Weddings**
- Description: "Elegance for your ceremony, cocktail hour, and reception."
- Tagline: *"Your most beautiful moment, scored."*
- Image alt: "Cello and floral details at a wedding celebration"

#### 2. Private Events (`#private-events`)

- Label: "Gatherings"
- Title: **Private Events**
- Description: "Intimate, tailored live music for your guests and celebrations."
- Tagline: *"Music that makes the room feel alive."*
- Image alt: "Live cello music for an intimate private gathering"

#### 3. Corporate Functions (`#corporate-events`)

- Label: "Professional"
- Title: **Corporate Functions**
- Description: "A refined and professional atmosphere for your brand."
- Tagline: *"Distinction your guests will remember."*
- Image alt: "Professional venue suited to corporate events and brand experiences"

### After-cards copy

> Not sure which option fits your event? I can help you choose—or combine approaches so the music feels exactly right for your guests and your moment.

---

## About

**Component:** `src/components/About.tsx`  
**Anchor:** `#about`

### Section header

- Label: "About Me"
- Heading: "Hey, I'm Luke"

### Body copy

> With years of classical training and a passion for crafting the perfect soundscape, I bring the profound resonance of the cello to life's most significant occasions.

> Every performance is a tailored experience, designed with calm authority and reassurance. I guide you through the musical selection, ensuring that when the bow meets the strings, the atmosphere is exactly as you envisioned.

### Visual element

Fanned card layout with five overlapping performance photos (no additional text copy).

Photo alts:
- "Performing live at an event"
- "Playing at a private event"
- "Cello performance detail"
- "Live performance at an event"
- "Performing at a ceremony"

---

## Why It Matters

**Component:** `src/components/Problem.tsx`  
**Anchor:** `#why`

### Section header

- Label: "Why it matters"
- Heading: "The music sets the standard for the room."

*(Note: the heading field in source contains variant options separated by ` / ` — the first variant is the canonical live copy.)*

### Problem blocks

Each block has an accented left border.

| Heading | Body |
|---|---|
| The wrong playlist | Recorded music can fill silence, but it rarely gives the room the level of presence a live performance does. |
| The generic setlist | If the music is not chosen for your event, it feels interchangeable instead of tailored to the people in the room. |
| The missed atmosphere | Guests may not name every detail later, but they notice when the atmosphere feels polished, intentional, and well timed. |

### Pivot / resolution

> *"Great music should do more than fill space."*

> Planned well, it shapes the first impression, supports the key moments, and helps the whole event feel more considered from start to finish.

Attribution line: `— Stamer`

---

## Process

**Component:** `src/components/Solution.tsx`  
**Anchor:** `#process`

### Section header

- Label: "The Plan"
- Heading: "Let's make something beautiful."

### Process steps (stacked sticky cards)

#### Step 01 — Connect

> Reach out to discuss your event and vision. We'll explore the atmosphere you want to create.

#### Step 02 — Plan the Music

> We plan the repertoire together so every piece matches the significance, pacing, and mood of your event.

#### Step 03 — Perform the Moment

> Relax and enjoy a flawless performance. The music elevates your event, exactly as planned.

---

## Testimonials

**Component:** `src/components/Testimonials.tsx`  
**Anchor:** `#testimonials`

### Section heading

> *"Don't take our word for it. See what customers are saying about us."*

*(Desktop version. Mobile version uses: "What they say about us")*

### Testimonials

| Quote | Name | Descriptor |
|---|---|---|
| "The music transformed our ceremony into something out of a film. It was the exact atmosphere we dreamed of." | Elena & James | Wedding Clients |
| "Stamer's performance at our gala was captivating. Every guest was spellbound from the first note." | Victoria Chen | Event Director |
| "He brought such warmth and elegance to my mother's memorial. The music said what words couldn't." | David Osei | Private Client |
| "We've booked Stamer for three consecutive years. His professionalism and artistry are unmatched." | Sarah Mitchell | Corporate Planner |
| "The cello added a layer of sophistication to our product launch that no other instrument could have." | Marcus Reed | Brand Director |
| "From the first consultation to the final bow, working with Stamer was effortless and extraordinary." | Amara & Liam | Wedding Clients |

### Stats (count-up on scroll)

| Value | Label |
|---|---|
| 12+ | Years of experience |
| ATCL | Qualified |
| 0 | Negative reviews... ever |
| 6,500 | Hours of playtime |

---

## CTA Banner

**Component:** `src/components/CTA.tsx`  
**Anchor:** `#booking-cta`  
**Background:** Dark primary color (`bg-primary`) with decorative gradient blur.

### Heading

> *"Make it Unforgettable."*

### Body copy

> Ensure your event has the perfect atmosphere. Reach out today to secure your date and start planning the music.

### Buttons

| Label | Href | Variant |
|---|---|---|
| Get in contact | `/book` | Primary |
| Send a message | `#contact` | Secondary |

---

## Contact

**Component:** `src/components/Contact.tsx` + `src/components/ContactForm.tsx`  
**Anchor:** `#contact`  
**API:** Form submits to `POST /api/contact`

### Section header

- Label: "Get in touch"
- Heading: "Tell me about your event."

### Left-side copy

> Share your date, venue, and the atmosphere you want to create. I'll help you shape live cello music for weddings, private celebrations, and corporate events.

### Trust indicators

- "Response within 24 hours"
- "Available for events year-round"

### Contact form (multi-step)

#### Step 1 of 3 — "Nice to meet you."

Fields:
- First name — placeholder: "Yo-Yo"
- Last name — placeholder: "Ma"
- Email — placeholder: "you@example.com"

Button: **Continue →**

#### Step 2 of 3 — "What brings you here?"

Inquiry type options (radio-style):

| Value | Label | Description |
|---|---|---|
| `wedding` | Wedding | Ceremony, cocktail hour, or reception |
| `private-event` | Private event | Birthday, dinner, party, or celebration |
| `corporate-event` | Corporate event | Client event, launch, gala, or brand gathering |
| `fundraiser` | Fundraiser or tribute | Benefit, memorial, or meaningful occasion |
| `other` | Other event | Something special that does not fit the list yet |

Buttons: **← Back** / **Continue →**

#### Step 3 of 3 — "Tell me more."

Fields:
- Your message — placeholder: "Share the details — dates, location, what you have in mind..."
- Phone *(optional)* — placeholder: "+1 (555) 000-0000"

Error state copy: "Something went wrong. Please try again or email directly."

Buttons: **← Back** / **Send message** (disabled while submitting: "Sending...")

#### Success state

> **Message received**  
> Thank you, [firstName]. I'll be in touch shortly.

---

## Footer

**Component:** `src/components/Footer.tsx`  
**Rendered on:** All pages

### Brand column

- Logo text: "Stamer"
- Tagline: "Live cello for an unforgettable event. We elevate celebrations with elegance and refined artistry."
- Status badge: "Accepting Bookings" (animated green dot)

### Navigation column

Heading: "Navigation"

- About → `#about`
- Services → `#services`
- Process → `#process`

### Legal column

Heading: "Legal"

- Privacy Policy → `#`
- Terms of Service → `#`

### Contact column

Heading: "Contact"

- luke@stamer.co.za
- +27 63 908 1386

### Bottom bar

- Copyright: "© [year] Stamer. All rights reserved."
- Credit: "Designed for Excellence"
