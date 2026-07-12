# Product

## Register

brand

## Platform

web

## Users

Three audiences carry equal weight: couples planning weddings (and their planners), hosts of private events (birthdays, anniversaries, dinners that matter), and corporate or brand event bookers (planners, agencies, EAs). Primarily Cape Town and the Western Cape. They arrive mid-planning for a high-stakes event, often on mobile, comparing options quickly. They want the atmosphere handled without adding another thing to manage. The homepage stays neutral across the three; each service page speaks to its own audience with equal care.

## Product Purpose

Marketing and booking site for Stamer Cello — Luke Stamer, a Cape Town cellist performing live at weddings, private events, and corporate functions. The site turns event-planning interest into direct conversations: success is a steady stream of qualified WhatsApp inquiries feeding the speed-to-lead automation and converting into booked performances.

## Positioning

Effortless live music, handled. Premium live cello that runs itself — Luke covers the repertoire, the gear, the timing, and the logistics so the host never has to think about the music.

## Conversion & proof

- Primary CTA: start a WhatsApp conversation (feeds the speed-to-lead automation). Secondary fallback: the /book inquiry flow for visitors not ready to chat.
- The line a visitor remembers after 10 seconds: **Effortless live music, handled.**
- Belief ladder (in order):
  1. He can play exactly what my event needs — live cello is the atmospheric element I'm looking for, this is a highly premium service, and Luke is right for my event.
  2. Real people like me — couples, hosts, corporate bookers — use Luke and vouch for him.
  3. He's effortless to work with and extremely reliable.
  4. His playing sounds great and he's clearly an advanced musician (least important relative to the others).
- Proof on hand: client testimonials with names and photos (`public/images/testimonials/`, e.g. the Stellenbosch organiser and Sophie & Bart), stats and track record (the count-up figures in `src/components/Testimonials.tsx`), and recognizable venue/client names. No performance video or audio currently.

## Brand Personality

Confident, refined, warm — never clinical or corporate. Classically trained, happily unconventional: first-person (Luke talking), witty, rebellious-classical, but unmistakably premium. Default copy register is the characterful voice (`.cursor/skills/voice-characterful`); the minimal-luxury voice is reserved for stripped-back briefs. The feel is premium editorial minimalism — high-end event branding, not tech startup.

## Anti-references

- Tech-startup and SaaS-template looks: hero-metric blocks, identical card grids, gradient accents.
- Clinical or corporate tone; AI-cliché copy ("Elevate", "Seamless", "Unleash", "Next-Gen").
- Glassmorphism, translucent panels, faded overlays, semi-transparent section design — banned outright by the design system.

## Design Principles

1. **Handled, not hyped.** Every page demonstrates effortlessness: a clear plan, fast answers, zero friction to inquire. The site itself must feel as low-effort to use as Luke is to book.
2. **Proof before performance.** Lead with fit and social proof — testimonials, track record, venues — before musicianship claims. Sound quality is the floor, not the pitch.
3. **Three doors, one house.** The homepage stays neutral; weddings, private events, and corporate each get their own persuasive path with equal weight, positioning the visitor as the hero and Luke as the guide.
4. **Conversation over form.** The shortest path to a WhatsApp chat wins. Every section is a step toward starting one; the booking form is the fallback, not the goal.
5. **Premium is calm.** Restraint, whitespace, and editorial confidence signal the price point. Never shout.

## Accessibility & Inclusion

Formal WCAG 2.2 AA is a hard requirement across the site: AA contrast ratios, visible focus states, accessible form errors, meaningful alt text, and keyboard-usable flows. Every GSAP animation ships a `prefers-reduced-motion` alternative (the global reveal fallback in `globals.css` is the baseline pattern).
