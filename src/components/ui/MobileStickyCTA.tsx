"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppHref } from "@/lib/whatsapp";

/**
 * Mobile-only floating WhatsApp shortcut. Keeps a one-tap reply channel in the
 * corner without turning the whole bottom edge into a persistent bar.
 * Hidden on /book, where the form already offers a WhatsApp fast lane.
 */
export function MobileStickyCTA() {
  const pathname = usePathname();

  if (pathname?.startsWith("/book")) return null;

  return (
    <a
      href={buildWhatsAppHref({ source: "mobile-bar" })}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message Luke on WhatsApp"
      className="btn-magnetic fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-[1rem] z-40 flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-full bg-whatsapp text-on-dark shadow-card transition-shadow duration-300 hover:shadow-card-hover lg:hidden"
    >
      <MessageCircle className="h-5 w-5" strokeWidth={2} />
    </a>
  );
}
