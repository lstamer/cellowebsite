"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/Button";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Info", href: "#info" },
  { label: "Blog", href: "#blog" },
] as const;

export function Navbar() {
  const [showBackground, setShowBackground] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const hero = document.querySelector("section:first-of-type");
    if (!hero) return;

    ScrollTrigger.create({
      trigger: hero,
      start: "bottom top",
      onEnter: () => setShowBackground(true),
      onLeaveBack: () => setShowBackground(false),
    });
  });

  return (
    <>
      <header
        ref={headerRef}
        className={clsx(
          "fixed top-0 left-0 right-0 z-50 transition-colors duration-300",
          showBackground
            ? "bg-background text-foreground"
            : "bg-transparent text-background"
        )}
      >
        <nav className="mx-auto grid max-w-7xl grid-cols-3 items-center px-section-x-sm md:px-section-x-md lg:px-section-x-lg py-2">
          {/* Left — nav links (desktop) */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-sans font-medium">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="link-hover opacity-80 hover:opacity-100 transition-opacity"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Spacer on mobile (replaces left links) */}
          <div className="lg:hidden" />

          {/* Center — logo */}
          <Link
            href="/"
            className="text-xl font-display font-bold tracking-tight justify-self-center"
          >
            Stamer
          </Link>

          {/* Right — CTA + mobile menu */}
          <div className="flex items-center gap-4 justify-self-end">
            <Button
              href="#contact"
              variant={showBackground ? "primary" : "secondary"}
              size="sm"
              className="hidden lg:inline-flex"
            >
              Book a call
            </Button>

            {/* Mobile menu button — below lg */}
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="lg:hidden relative z-50 flex flex-col items-center justify-center w-10 h-10 gap-1.5"
            >
              <span
                className={twMerge(
                  "block h-[2px] w-6 rounded-full transition-all duration-300 origin-center",
                  mobileOpen
                    ? "rotate-45 translate-y-[4px] bg-background"
                    : showBackground
                      ? "bg-foreground"
                      : "bg-background"
                )}
              />
              <span
                className={twMerge(
                  "block h-[2px] w-6 rounded-full transition-all duration-300 origin-center",
                  mobileOpen
                    ? "-rotate-45 -translate-y-[4px] bg-background"
                    : showBackground
                      ? "bg-foreground"
                      : "bg-background"
                )}
              />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile overlay — below lg */}
      <div
        className={clsx(
          "fixed inset-0 z-40 flex flex-col items-center justify-center bg-surface-dark transition-opacity duration-300 lg:hidden",
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <nav className="flex flex-col items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-background font-display text-3xl font-semibold tracking-tight link-hover opacity-80 hover:opacity-100 transition-opacity"
            >
              {link.label}
            </Link>
          ))}
          <Button
            href="#contact"
            variant="primary"
            size="md"
            className="mt-4"
          >
            Book a call
          </Button>
        </nav>
      </div>
    </>
  );
}
