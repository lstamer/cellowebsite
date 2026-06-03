import { gsap, ScrollTrigger } from "@/lib/gsap-client";

type ScrollTriggerVars = ScrollTrigger.Vars;

/** Visible end state applied when a once-trigger was already passed on init. */
export type ScrollRevealEndState = {
  y?: number;
  x?: number;
  opacity?: number;
};

const DEFAULT_END: ScrollRevealEndState = { y: 0, opacity: 1 };

function resolveEndState(
  to: gsap.TweenVars,
  overrides?: ScrollRevealEndState
): ScrollRevealEndState {
  return {
    y: overrides?.y ?? (typeof to.y === "number" ? to.y : DEFAULT_END.y),
    x: overrides?.x ?? (typeof to.x === "number" ? to.x : undefined),
    opacity:
      overrides?.opacity ??
      (typeof to.opacity === "number" ? to.opacity : DEFAULT_END.opacity),
  };
}

/** True when the user has scrolled past this trigger's start (missed onEnter). */
export function isScrollTriggerPastStart(st: ScrollTrigger): boolean {
  return st.scroll() >= st.start;
}

/**
 * If a once ScrollTrigger was already passed when created (e.g. restored scroll),
 * snap targets to their revealed state so content is never stuck at opacity: 0.
 */
export function applyScrollRevealFallback(
  animation: gsap.core.Animation,
  endState?: ScrollRevealEndState
): void {
  const st = animation.scrollTrigger;
  if (!st?.vars.once) return;

  if (animation instanceof gsap.core.Tween) {
    const targets = animation.targets();
    if (!targets.length) return;

    const end = endState ?? resolveEndState(animation.vars);
    const vars: gsap.TweenVars = { ...end };
    if (end.x === undefined) delete vars.x;

    if (st.progress > 0 || isScrollTriggerPastStart(st)) {
      gsap.set(targets, vars);
    }
    return;
  }

  if (animation instanceof gsap.core.Timeline) {
    applyTimelineRevealFallbacks(animation);
  }
}

/**
 * fromTo + ScrollTrigger with once:true and automatic fallback for passed triggers.
 */
export function scrollRevealFromTo(
  targets: gsap.TweenTarget,
  from: gsap.TweenVars,
  to: gsap.TweenVars & { scrollTrigger?: ScrollTriggerVars },
  endState?: ScrollRevealEndState
): gsap.core.Tween {
  const { scrollTrigger: stVars, ...toVars } = to;
  const mergedScrollTrigger: ScrollTriggerVars = {
    once: true,
    ...(typeof stVars === "object" && stVars !== null ? stVars : {}),
  };
  const tween = gsap.fromTo(targets, from, {
    ...toVars,
    scrollTrigger: mergedScrollTrigger,
  });
  applyScrollRevealFallback(tween, endState ?? resolveEndState(toVars));
  return tween;
}

/** Run fallback for a timeline whose ScrollTrigger lives on the parent timeline. */
export function applyTimelineRevealFallbacks(timeline: gsap.core.Timeline): void {
  const st = timeline.scrollTrigger;
  if (!st?.vars.once) return;

  if (st.progress > 0 || isScrollTriggerPastStart(st)) {
    timeline.getChildren(true, true, false).forEach((child) => {
      if (child instanceof gsap.core.Tween) {
        const end = resolveEndState(child.vars);
        gsap.set(child.targets(), end);
      }
    });
  }
}

/**
 * After layout (hero image, fonts, sticky sections), refresh ST positions
 * and reveal any once-triggers that are already past their start line.
 */
export function refreshScrollReveals(): void {
  if (typeof window === "undefined") return;

  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
    ScrollTrigger.getAll().forEach((st) => {
      if (!st.vars.once) return;
      const animation = st.animation;
      if (!animation) return;
      applyScrollRevealFallback(animation);
    });
  });
}
