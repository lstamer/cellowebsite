"use client";

import { useRef } from "react";
import { MessageCircle } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { buildWhatsAppHref } from "@/lib/whatsapp";

/**
 * Desktop-only floating WhatsApp button. Sits bottom-right under the navbar
 * (z-40 < the navbar's z-50) so the reply channel is reachable from any page.
 */
export function WhatsAppFab() {
  const ref = useRef<HTMLAnchorElement>(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduceMotion || !ref.current) return;

      gsap.from(ref.current, {
        opacity: 0,
        scale: 0.6,
        y: 16,
        duration: 0.5,
        delay: 0.8,
        ease: "power3.out",
      });
    },
    { scope: ref }
  );

  return (
    <a
      ref={ref}
      href={buildWhatsAppHref({ source: "fab" })}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message Luke on WhatsApp"
      className="btn-magnetic fixed bottom-[1.5rem] right-[1.5rem] z-40 hidden h-[3.5rem] w-[3.5rem] items-center justify-center rounded-full bg-whatsapp text-on-dark shadow-card lg:flex"
    >
      <MessageCircle className="h-6 w-6" strokeWidth={2} />
    </a>
  );
}
