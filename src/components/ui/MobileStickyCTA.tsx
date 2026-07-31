"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-client";
import { buildWhatsAppHref } from "@/lib/whatsapp";

/**
 * Mobile-only sticky action bar. Keeps the two ways to start a booking — the
 * one-tap WhatsApp lane and the full availability form — within thumb reach on
 * every page, so a warm lead never has to scroll back to a section CTA.
 *
 * It stays out of the way until the hero has scrolled past: the hero carries
 * its own CTAs, and a bar over it would cover the first impression. Hidden on
 * /book, where the form itself already is the conversion surface.
 */
export function MobileStickyCTA() {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const bar = ref.current;
      if (!bar) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      // Every page opens on a full-bleed hero rendered as the first <section>,
      // so that element is the handover point. Without one, fall back to a
      // viewport's worth of scroll.
      const hero = document.querySelector<HTMLElement>("main section, section");

      const show = gsap.to(bar, {
        autoAlpha: 1,
        yPercent: 0,
        duration: reduceMotion ? 0.2 : 0.5,
        ease: "power3.out",
        paused: true,
      });

      gsap.set(bar, { autoAlpha: 0, yPercent: reduceMotion ? 0 : 100 });

      const trigger = ScrollTrigger.create({
        trigger: hero ?? document.body,
        start: hero ? "bottom top+=8" : `${window.innerHeight}px top`,
        end: "max",
        onEnter: () => show.play(),
        onLeaveBack: () => show.reverse(),
      });

      return () => {
        trigger.kill();
      };
    },
    { scope: ref, dependencies: [pathname], revertOnUpdate: true }
  );

  if (pathname?.startsWith("/book")) return null;

  const actionClass =
    "flex min-h-11 items-center justify-center gap-[0.5em] rounded-full px-[1.143em] py-[0.786em] font-sans text-sm transition-colors duration-300";

  return (
    <>
      {/* Reserves the space the fixed bar covers so the footer stays readable. */}
      <div
        aria-hidden
        className="h-[calc(env(safe-area-inset-bottom)+4.75rem)] lg:hidden"
      />
      <div
        ref={ref}
        className="invisible fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-background px-[1rem] pt-[0.75rem] pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-card lg:hidden"
      >
        <div className="grid grid-cols-2 gap-[0.625rem]">
          <a
            href={buildWhatsAppHref({ source: "mobile-bar" })}
            target="_blank"
            rel="noopener noreferrer"
            className={`${actionClass} bg-primary font-semibold text-on-dark hover:bg-primary/90`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-[16px] w-[16px]"
            >
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.477-.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            WhatsApp me
          </a>
          <Link
            href="/book"
            className={`${actionClass} border border-primary/20 bg-background text-primary hover:bg-cream`}
          >
            Check availability
          </Link>
        </div>
      </div>
    </>
  );
}
