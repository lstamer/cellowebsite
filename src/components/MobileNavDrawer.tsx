"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, House, X } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/site-navigation";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import { trackSiteEvent } from "@/lib/analytics-client";

const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current";
const labelClass = "mb-1 flex min-h-11 items-center font-jost text-xs font-semibold uppercase tracking-[0.14em]";

/** The selected cream index drawer. Native dialog owns focus and background inertness. */
export function MobileNavDrawer({ id, isOpen, onClose }: { id: string; isOpen: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const unlockScrollRef = useRef<(() => void) | null>(null);

  useGSAP(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isOpen) {
      if (!dialog.open) {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        unlockScrollRef.current = () => {
          document.body.style.overflow = previousOverflow;
          unlockScrollRef.current = null;
        };
        dialog.showModal();
      }
      gsap.fromTo(dialog, { xPercent: reducedMotion ? 0 : 100 }, {
        xPercent: 0, duration: reducedMotion ? 0 : 0.5, ease: "power3.out",
      });
    } else if (dialog.open) {
      gsap.to(dialog, {
        xPercent: reducedMotion ? 0 : 100,
        duration: reducedMotion ? 0 : 0.3,
        ease: "power3.inOut",
        onComplete: () => {
          dialog.close();
          unlockScrollRef.current?.();
        },
      });
    }
  }, { dependencies: [isOpen], revertOnUpdate: true });

  useEffect(() => () => { unlockScrollRef.current?.(); }, []);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) onClose(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [onClose]);

  const services = NAV_LINKS.find((link) => link.label === "Services")!;
  const about = NAV_LINKS.find((link) => link.label === "About")!;

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-label="Main menu"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-[100svh] max-h-none w-[90%] max-w-md overflow-hidden border-0 border-l border-primary/20 bg-cream p-0 text-left text-primary outline-none [&::backdrop]:bg-transparent lg:hidden"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-primary/15 px-6 py-3">
          <Link href="/" onClick={onClose} className={cn("font-display text-xl font-bold tracking-tight", focusClass)}>Stamer</Link>
          <button type="button" aria-label="Close menu" onClick={onClose} className={cn("flex min-h-11 items-center gap-2 rounded-full px-[0.5em] text-xs", focusClass)}>
            Close <X size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Mobile site navigation" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          <Link href="/" onClick={onClose} className={cn("mb-4 flex min-h-11 items-center gap-3 border-b border-primary/15 pb-3 text-sm", focusClass)}>
            <House size={16} strokeWidth={1.5} aria-hidden="true" />Home
          </Link>
          <div className="mb-5">
            <Link href={services.href} onClick={onClose} className={cn(labelClass, focusClass)}>Services</Link>
            {services.dropdown?.items.map((link) => (
              <Link key={link.href} href={link.href} onClick={onClose} className={cn("flex min-h-11 items-center justify-between gap-2 font-display text-xl transition-colors hover:text-accent-ink", focusClass)}>
                {link.label}<ArrowRight size={16} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
              </Link>
            ))}
          </div>
          <div className="border-t border-primary/15 pt-3">
            <Link href={about.href} onClick={onClose} className={cn(labelClass, focusClass)}>About Luke</Link>
            <div className="grid grid-cols-2 gap-x-3">
              {about.dropdown?.items.map((link) => (
                <Link key={link.href} href={link.href} onClick={onClose} className={cn("flex min-h-11 items-center text-xs underline-offset-4 hover:underline", focusClass)}>{link.label}</Link>
              ))}
            </div>
          </div>
        </nav>
        <div className="shrink-0 border-t border-primary/15 px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <Link href="/book" onClick={onClose} className={cn("flex min-h-11 items-center justify-between gap-3 rounded-full bg-primary px-[1.4em] py-[0.85em] text-sm font-semibold text-on-dark transition-colors hover:bg-foreground", focusClass)}>
            Check Availability <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
          </Link>
          <a href={buildWhatsAppHref({ source: "mobile-nav" })} target="_blank" rel="noopener noreferrer"
            onClick={() => { trackSiteEvent("whatsapp_click", { source: "mobile-nav" }); onClose(); }}
            className={cn("mt-1 flex min-h-11 items-center justify-center text-xs underline decoration-current/40 underline-offset-4", focusClass)}>
            WhatsApp me
          </a>
        </div>
      </div>
    </dialog>
  );
}
