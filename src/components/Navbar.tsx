"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface DropdownItem {
  label: string;
  href: string;
  description?: string;
}

interface PlannerLink {
  label: string;
  href: string;
}

interface NavLink {
  label: string;
  href: string;
  dropdown?: {
    items: DropdownItem[];
    cta?: { heading: string; buttonLabel: string; buttonHref: string };
    plannerPanel?: { heading: string; links: PlannerLink[] };
  };
}

const NAV_LINKS: NavLink[] = [
  {
    label: "About",
    href: "#about",
    dropdown: {
      items: [
        { label: "My Story", href: "#about", description: "The journey behind the music" },
        { label: "Why Me", href: "#why", description: "What sets the experience apart" },
        { label: "Customer Testimonials", href: "#testimonials", description: "Words from past clients" },
      ],
    },
  },
  {
    label: "Services",
    href: "#services",
    dropdown: {
      items: [
        { label: "Weddings", href: "#weddings" },
        { label: "Private Events", href: "#private-events" },
        { label: "Corporate Functions", href: "#corporate" },
        { label: "Live Performances", href: "#live" },
        { label: "Ceremonies", href: "#ceremonies" },
      ],
      cta: {
        heading: "Need something else?",
        buttonLabel: "Get in touch",
        buttonHref: "#contact",
      },
      plannerPanel: {
        heading: "For event planners",
        links: [
          { label: "Pricing", href: "#pricing" },
          { label: "Availability", href: "#contact" },
        ],
      },
    },
  },
  {
    label: "Info",
    href: "#info",
    dropdown: {
      items: [
        { label: "Set List", href: "#setlist" },
        { label: "Contact", href: "#contact" },
      ],
    },
  },
  { label: "Blog", href: "#blog" },
];

const CLOSE_DELAY = 150;

function DropdownPanel({
  link,
  open,
  onMouseEnter,
  onMouseLeave,
}: {
  link: NavLink;
  open: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const dropdown = link.dropdown;
  const panelRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useGSAP(() => {
    if (!cardRef.current || !panelRef.current) return;

    const items = cardRef.current.querySelectorAll("[data-dropdown-item]");
    const cta = cardRef.current.querySelector("[data-dropdown-cta]");

    if (open) {
      hasAnimated.current = true;
      gsap.set(panelRef.current, { visibility: "visible", pointerEvents: "auto" });

      gsap.fromTo(
        cardRef.current,
        { opacity: 0, scale: 0.96, y: -4 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: "power3.out" }
      );

      gsap.fromTo(
        items,
        { opacity: 0, filter: "blur(4px)", x: -8 },
        { opacity: 1, filter: "blur(0px)", x: 0, stagger: 0.07, duration: 0.45, ease: "power3.out", delay: 0.06 }
      );

      if (cta) {
        gsap.fromTo(cta, { opacity: 0, x: 8 }, { opacity: 1, x: 0, duration: 0.45, delay: 0.2, ease: "power3.out" });
      }
    } else if (hasAnimated.current) {
      gsap.to(cardRef.current, {
        opacity: 0,
        scale: 0.96,
        y: -4,
        duration: 0.15,
        ease: "power2.in",
        onComplete() {
          gsap.set(panelRef.current, { visibility: "hidden", pointerEvents: "none" });
        },
      });
    }
  }, { dependencies: [open] });

  if (!dropdown) return null;

  const hasCta = !!dropdown.cta;

  return (
    <div
      ref={panelRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="absolute top-full left-0 pt-3"
      style={{ visibility: "hidden", pointerEvents: "none" }}
    >
      <div
        ref={cardRef}
        className={clsx(
          "origin-top rounded-2xl bg-background border border-foreground/[0.06] shadow-card overflow-hidden",
          hasCta ? "min-w-[28rem]" : "min-w-[16rem]"
        )}
      >
        <div className={clsx(hasCta && "grid grid-cols-[1fr_auto]")}>
          <div className="p-4 flex flex-col gap-0.5">
            <span
              data-dropdown-item
              className="px-3 pt-1 pb-2 text-[0.6875rem] font-mono font-medium uppercase tracking-widest text-foreground/40"
            >
              {link.label}
            </span>
            {dropdown.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-dropdown-item
                className="group flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-primary/[0.06]"
              >
                <span className="text-sm font-sans font-medium text-foreground group-hover:text-primary transition-colors duration-150">
                  {item.label}
                </span>
                {item.description && (
                  <span className="text-xs font-sans text-foreground/50">
                    {item.description}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {(dropdown.cta || dropdown.plannerPanel) && (
            <div
              data-dropdown-cta
              className="flex flex-col justify-between border-l border-foreground/[0.06] bg-primary/[0.03] px-8 py-6 min-w-[13rem]"
            >
              {dropdown.plannerPanel && (
                <div className="flex flex-col gap-1">
                  <span className="pb-2 text-[0.6875rem] font-mono font-medium uppercase tracking-widest text-foreground/40">
                    {dropdown.plannerPanel.heading}
                  </span>
                  {dropdown.plannerPanel.links.map((plannerLink) => (
                    <Link
                      key={plannerLink.href}
                      href={plannerLink.href}
                      className="group rounded-xl px-3 py-2 text-sm font-sans font-medium text-foreground transition-colors duration-150 hover:bg-primary/[0.06] hover:text-primary"
                    >
                      {plannerLink.label}
                    </Link>
                  ))}
                </div>
              )}

              {dropdown.cta && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-serif italic text-foreground/70">
                    {dropdown.cta.heading}
                  </p>
                  <Button href={dropdown.cta.buttonHref} variant="primary" size="sm">
                    {dropdown.cta.buttonLabel}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NavItem({
  link,
  showBackground,
}: {
  link: NavLink;
  showBackground: boolean;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY);
  }, [cancelClose]);

  useEffect(() => {
    return () => cancelClose();
  }, [cancelClose]);

  const hasDropdown = !!link.dropdown;

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        if (hasDropdown) {
          cancelClose();
          setOpen(true);
        }
      }}
      onMouseLeave={() => {
        if (hasDropdown) scheduleClose();
      }}
    >
      <Link
        href={link.href}
        className={clsx(
          "link-hover flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity",
          open && "opacity-100"
        )}
      >
        {link.label}
        {hasDropdown && (
          <ChevronDown
            className={clsx(
              "h-3.5 w-3.5 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        )}
      </Link>

      {hasDropdown && (
        <DropdownPanel
          link={link}
          open={open}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        />
      )}
    </div>
  );
}

export function Navbar() {
  const [showBackground, setShowBackground] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
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

  const toggleMobileDropdown = (label: string) => {
    setMobileExpanded((prev) => (prev === label ? null : label));
  };

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
              <NavItem
                key={link.label}
                link={link}
                showBackground={showBackground}
              />
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
        <nav className="flex flex-col items-center gap-6 w-full max-w-xs">
          {NAV_LINKS.map((link) => (
            <div key={link.label} className="flex flex-col items-center w-full">
              {link.dropdown ? (
                <>
                  <button
                    type="button"
                    onClick={() => toggleMobileDropdown(link.label)}
                    className="flex items-center gap-2 text-background font-display text-3xl font-semibold tracking-tight opacity-80 hover:opacity-100 transition-opacity"
                  >
                    {link.label}
                    <ChevronDown
                      className={clsx(
                        "h-5 w-5 transition-transform duration-200",
                        mobileExpanded === link.label && "rotate-180"
                      )}
                    />
                  </button>
                  {mobileExpanded === link.label && (
                    <div className="mt-3 flex flex-col items-center gap-2">
                      {link.dropdown.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="text-background/70 font-sans text-lg hover:text-background transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-background font-display text-3xl font-semibold tracking-tight link-hover opacity-80 hover:opacity-100 transition-opacity"
                >
                  {link.label}
                </Link>
              )}
            </div>
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
