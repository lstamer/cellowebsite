"use client";

import { useRef } from "react";
import { MessageCircle } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { buildWhatsAppHref } from "@/lib/whatsapp";

/**
 * Desktop-only floating WhatsApp button. Sits bottom-right under the navbar
 * (z-40 < the navbar's z-50) so the reply channel is reachable from any page.
 *
 * The entrance tween runs on a plain wrapper span so GSAP never shares a node
 * with .btn-magnetic's CSS transform transition (see gsap-css-safety).
 */
export function WhatsAppFab() {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const el = ref.current;
      if (reduceMotion || !el) return;

      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.6, y: 16 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          delay: 0.8,
          ease: "power3.out",
          onComplete: () => {
            gsap.set(el, { clearProps: "transform,opacity" });
          },
        }
      );
    },
    { scope: ref }
  );

  return (
    <span
      ref={ref}
      className="fixed bottom-[1.5rem] right-[1.5rem] z-40 hidden lg:block"
    >
      <a
        href={buildWhatsAppHref({ source: "fab" })}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message Luke on WhatsApp"
        className="btn-magnetic flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-full bg-whatsapp text-on-dark shadow-card"
      >
        <MessageCircle className="h-6 w-6" strokeWidth={2} />
      </a>
    </span>
  );
}
