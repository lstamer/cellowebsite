"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppHref } from "@/lib/whatsapp";

/**
 * Mobile-only persistent WhatsApp bar. Pins the WhatsApp reply channel to the
 * bottom of every page so a warm lead always has a one-tap way to reach Luke.
 * Hidden on /book, where the form already offers a WhatsApp fast lane.
 */
export function MobileStickyCTA() {
  const pathname = usePathname();

  if (pathname?.startsWith("/book")) return null;

  return (
    <>
      {/* In-flow spacer so the fixed bar never occludes the footer's bottom content. */}
      <div aria-hidden className="h-[calc(4.25rem+env(safe-area-inset-bottom))] lg:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 bg-surface-darker pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="px-section-x-sm py-[0.75rem]">
          <a
            href={buildWhatsAppHref({ source: "mobile-bar" })}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Message Luke on WhatsApp"
            className="btn-magnetic flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-[1.429em] py-[0.714em] text-sm font-normal text-on-dark transition-colors duration-300"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            WhatsApp me
          </a>
        </div>
      </div>
    </>
  );
}
