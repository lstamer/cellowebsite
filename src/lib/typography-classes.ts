/**
 * Canonical typography for feature / benefit list items and matching FAQ rows.
 * Documented in `.cursor/skills/brand-consistency/SKILL.md` (Feature Item Pattern).
 */

/** The Seasons — item title (benefits, service rows, icon+text features, etc.) */
export const featureItemTitleClass =
  "font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl";

/** Outfit — item description / answer body */
export const featureItemBodyClass =
  "font-sans text-base leading-relaxed text-foreground/75 text-pretty";

/** FAQ accordion question — same scale as {@link featureItemTitleClass} + hover */
export const faqQuestionClass =
  "font-display text-xl font-semibold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary md:text-2xl";
