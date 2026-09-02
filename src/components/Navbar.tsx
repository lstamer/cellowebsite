"use client";

import { useCallback, useEffect, useId, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Observer } from "gsap/dist/Observer";
import { useGSAP } from "@gsap/react";
import { ChevronDown } from "lucide-react";
import { useHover } from "@react-aria/interactions";
import { gsap } from "@/lib/gsap-client";
import { Button } from "@/components/ui/Button";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Observer);
}

const MOBILE_NAV_MM = "(max-width: 1023px)";
const SCROLL_TOP_LOCK_PX = 32;
/** Ignore micro-jitter from touch momentum / sub-pixel scroll. */
const SCROLL_TOLERANCE_PX = 8;
/** Distance scrolled before the solid white background fades in. */
const SCROLL_SOLID_THRESHOLD_PX = 24;

/**
 * Tracks whether the user has scrolled past the first section, so the navbar
 * can sit transparent over the hero and fade its white background in on scroll.
 */
function useNavbarScrolled() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_SOLID_THRESHOLD_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return scrolled;
}

function useMobileNavbarScrollHide(
  headerRef: RefObject<HTMLElement | null>,
  mobileOpen: boolean
) {
  const isHiddenRef = useRef(false);
  const lastScrollRef = useRef(0);
  const mobileOpenRef = useRef(mobileOpen);
  const showNavRef = useRef<(() => void) | null>(null);
  const observerRef = useRef<Observer | null>(null);

  useEffect(() => {
    mobileOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const mm = gsap.matchMedia();

    mm.add(MOBILE_NAV_MM, () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const hideDuration = reduceMotion ? 0.12 : 0.38;
      const showDuration = reduceMotion ? 0.12 : 0.32;

      const hideNav = () => {
        if (mobileOpenRef.current || isHiddenRef.current) return;
        if (window.scrollY <= SCROLL_TOP_LOCK_PX) return;
        isHiddenRef.current = true;
        gsap.to(header, {
          yPercent: -100,
          duration: hideDuration,
          ease: "power3.inOut",
          overwrite: "auto",
          force3D: true,
        });
      };

      const showNav = () => {
        if (mobileOpenRef.current) return;
        if (!isHiddenRef.current && gsap.getProperty(header, "yPercent") === 0) return;
        isHiddenRef.current = false;
        gsap.to(header, {
          yPercent: 0,
          y: 0,
          duration: showDuration,
          ease: "power3.out",
          overwrite: "auto",
          force3D: true,
        });
      };

      showNavRef.current = showNav;
      gsap.set(header, { y: 0, yPercent: 0, force3D: true });
      isHiddenRef.current = false;
      lastScrollRef.current = window.scrollY;

      const applyScrollDirection = (scrollY: number) => {
        if (mobileOpenRef.current) return;

        if (scrollY <= SCROLL_TOP_LOCK_PX) {
          showNav();
          lastScrollRef.current = scrollY;
          return;
        }

        const delta = scrollY - lastScrollRef.current;
        if (delta > SCROLL_TOLERANCE_PX) hideNav();
        else if (delta < -SCROLL_TOLERANCE_PX) showNav();
        lastScrollRef.current = scrollY;
      };

      let rafId = 0;
      const onScroll = () => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          applyScrollDirection(window.scrollY);
        });
      };

      window.addEventListener("scroll", onScroll, { passive: true });

      const observer = Observer.create({
        target: window,
        type: "wheel,touch",
        tolerance: SCROLL_TOLERANCE_PX,
        preventDefault: false,
        onDown: () => hideNav(),
        onUp: () => showNav(),
        onStop: () => applyScrollDirection(window.scrollY),
      });

      observerRef.current = observer;

      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener("scroll", onScroll);
        observer.kill();
        observerRef.current = null;
        gsap.killTweensOf(header);
        gsap.set(header, { clearProps: "transform" });
        isHiddenRef.current = false;
        showNavRef.current = null;
      };
    });

    return () => mm.revert();
  }, [headerRef]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const observer = observerRef.current;

    if (mobileOpen) {
      observer?.disable();
      gsap.killTweensOf(header);
      isHiddenRef.current = false;
      gsap.set(header, { y: 0, yPercent: 0, force3D: true });
      lastScrollRef.current = window.scrollY;
      return;
    }

    observer?.enable();
    lastScrollRef.current = window.scrollY;
    if (window.scrollY <= SCROLL_TOP_LOCK_PX) {
      showNavRef.current?.();
    }
  }, [mobileOpen, headerRef]);
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
    href: "/about",
    dropdown: {
      items: [
        { label: "Brief Overview", href: "/about#overview", description: "The story behind the cello" },
        { label: "Achievements", href: "/about#achievements", description: "Training, stages, and milestones" },
        { label: "Why Me", href: "/about#why-me", description: "How the performance changes the room" },
        { label: "FAQ", href: "/book#faq", description: "Questions people ask before booking" },
      ],
    },
  },
  {
    label: "Services",
    href: "/#services",
    dropdown: {
      items: [
        { label: "Weddings", href: "/services/weddings" },
        { label: "Celebrations", href: "/services/private-events" },
        { label: "Corporate Functions", href: "/services/corporate-functions" },
      ],
    },
  },
];

const CLOSE_DELAY = 150;

const NAV_ITEM_LINK_CLASS =
  "link-hover flex items-center gap-1 text-sm font-sans font-medium opacity-80 hover:opacity-100 transition-opacity";

const MOBILE_NAV_ITEM_LINK_CLASS =
  "link-hover flex items-center gap-1 text-sm font-sans font-medium text-foreground";

const NAV_ITEM_CHEVRON_CLASS = "h-3.5 w-3.5 transition-transform duration-200";

const NAV_ITEM_DISCLOSURE_CLASS =
  "flex h-6 w-6 items-center justify-center rounded-full opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function DropdownPanel({
  link,
  open,
  panelId,
}: {
  link: NavLink;
  open: boolean;
  panelId: string;
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
      id={panelId}
      className="absolute top-full left-0 pt-3"
      style={{ visibility: "hidden", pointerEvents: "none" }}
    >
      <div
        ref={cardRef}
        className={clsx(
          "origin-top rounded-card bg-background border border-foreground/10 shadow-card overflow-hidden",
          hasCta ? "min-w-[28rem]" : "min-w-[16rem]"
        )}
      >
        <div className={clsx(hasCta && "grid grid-cols-[1fr_auto]")}>
          <div className="p-4 flex flex-col gap-0.5">
            <span
              data-dropdown-item
              className="px-3 pt-1 pb-2 text-[0.6875rem] font-jost font-medium uppercase tracking-widest text-foreground/70"
            >
              {link.label}
            </span>
            {dropdown.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-dropdown-item
                className="group flex flex-col gap-0.5 rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-primary/5"
              >
                <span className="text-sm font-sans font-medium text-foreground group-hover:text-primary transition-colors duration-150">
                  {item.label}
                </span>
                {item.description && (
                  <span className="text-xs font-sans text-foreground/70">
                    {item.description}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {(dropdown.cta || dropdown.plannerPanel) && (
            <div
              data-dropdown-cta
              className="flex flex-col justify-between border-l border-foreground/10 bg-background px-8 py-6 min-w-[13rem]"
            >
              {dropdown.plannerPanel && (
                <div className="flex flex-col gap-1">
                  <span className="pb-2 text-[0.6875rem] font-jost font-medium uppercase tracking-widest text-foreground/70">
                    {dropdown.plannerPanel.heading}
                  </span>
                  {dropdown.plannerPanel.links.map((plannerLink) => (
                    <Link
                      key={plannerLink.href}
                      href={plannerLink.href}
                      className="group rounded-xl px-3 py-2 text-sm font-sans font-medium text-foreground transition-colors duration-150 hover:bg-primary/5 hover:text-primary"
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
}: {
  link: NavLink;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disclosureRef = useRef<HTMLButtonElement>(null);
  const panelId = `nav-dropdown-${useId()}`;

  const hasDropdown = !!link.dropdown;

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

  // React Aria's useHover ignores the emulated mouse events touch devices fire
  // after a tap, so tapping the link on a touch screen never opens the panel.
  const { hoverProps } = useHover({
    isDisabled: !hasDropdown,
    onHoverStart: () => {
      cancelClose();
      setOpen(true);
    },
    onHoverEnd: () => scheduleClose(),
  });

  return (
    <div
      {...hoverProps}
      className="relative flex items-center gap-1"
      onBlur={(event) => {
        if (!hasDropdown) return;
        const nextFocus = event.relatedTarget as Node | null;
        if (!event.currentTarget.contains(nextFocus)) {
          cancelClose();
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (hasDropdown && event.key === "Escape") {
          cancelClose();
          setOpen(false);
          disclosureRef.current?.focus();
        }
      }}
    >
      <Link
        href={link.href}
        className={clsx(NAV_ITEM_LINK_CLASS, open && "opacity-100")}
      >
        {link.label}
      </Link>

      {hasDropdown && (
        <>
          <button
            ref={disclosureRef}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`Show ${link.label.toLowerCase()} links`}
            onClick={() => {
              cancelClose();
              setOpen((prev) => !prev);
            }}
            className={clsx(NAV_ITEM_DISCLOSURE_CLASS, open && "opacity-100")}
          >
            <ChevronDown
              aria-hidden="true"
              className={clsx(NAV_ITEM_CHEVRON_CLASS, open && "rotate-180")}
            />
          </button>

          <DropdownPanel link={link} open={open} panelId={panelId} />
        </>
      )}
    </div>
  );
}

export function Navbar({
  heroVariant = "light",
}: {
  /**
   * Treatment of the first section the navbar sits over while transparent.
   * `"dark"` (dark hero) keeps the nav text light until the user scrolls;
   * `"light"` keeps it dark over a light first section.
   */
  heroVariant?: "dark" | "light";
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  const scrolled = useNavbarScrolled();
  useMobileNavbarScrollHide(headerRef, mobileOpen);

  // The white background is solid once scrolled, or whenever the mobile menu is
  // open (so the open menu reads against a solid bar). Text stays dark unless
  // we're transparent over a dark hero.
  const showSolid = scrolled || mobileOpen;
  const textDark = showSolid || heroVariant === "light";

  const toggleMobileDropdown = (label: string) => {
    setMobileExpanded((prev) => (prev === label ? null : label));
  };

  return (
    <>
      <header
        ref={headerRef}
        className={clsx(
          "fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ease-out",
          textDark ? "text-foreground" : "text-on-dark",
          showSolid
            ? "bg-background lg:border-b lg:border-foreground/10"
            : "bg-transparent"
        )}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-section-x-sm md:px-section-x-md lg:px-section-x-lg py-2 lg:grid lg:grid-cols-3">
          {/* Left — nav links (desktop) */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <NavItem
                key={link.label}
                link={link}
              />
            ))}
          </div>

          {/* Logo — left on mobile, centered on desktop */}
          <Link
            href="/"
            className="py-2 text-xl font-display font-bold tracking-tight lg:justify-self-center"
          >
            Stamer
          </Link>

          {/* Right — CTA + mobile menu */}
          <div className="flex items-center gap-4 lg:justify-self-end">
            <Button
              href="/book"
              variant="primary"
              size="sm"
              className="hidden lg:inline-flex"
            >
              Check my date
            </Button>

            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => {
                setMobileOpen((prev) => {
                  const next = !prev;
                  if (!next) setMobileExpanded(null);
                  return next;
                });
              }}
              className="lg:hidden relative z-50 flex flex-col items-center justify-center w-11 h-11 gap-1.5"
            >
              <span
                className={clsx(
                  "block h-[2px] w-6 rounded-full bg-current transition-all duration-300 origin-center",
                  mobileOpen && "rotate-45 translate-y-[4px]"
                )}
              />
              <span
                className={clsx(
                  "block h-[2px] w-6 rounded-full bg-current transition-all duration-300 origin-center",
                  mobileOpen && "-rotate-45 -translate-y-[4px]"
                )}
              />
            </button>
          </div>
        </nav>

        {/* Mobile menu — instant show/hide, below lg */}
        <div
          className={clsx(
            "lg:hidden border-t border-foreground/10 bg-background",
            !mobileOpen && "hidden"
          )}
          aria-hidden={!mobileOpen}
        >
          <nav className="flex flex-col gap-1 px-section-x-sm pb-5 pt-3 md:px-section-x-md">
            {NAV_LINKS.map((link) => (
              <div key={link.label} className="flex flex-col">
                {link.dropdown ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleMobileDropdown(link.label)}
                      aria-expanded={mobileExpanded === link.label}
                      className={clsx(MOBILE_NAV_ITEM_LINK_CLASS, "w-full py-3")}
                    >
                      {link.label}
                      <ChevronDown
                        className={clsx(
                          NAV_ITEM_CHEVRON_CLASS,
                          mobileExpanded === link.label && "rotate-180"
                        )}
                      />
                    </button>
                    <div
                      aria-hidden={mobileExpanded !== link.label}
                      className={clsx(
                        "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
                        mobileExpanded === link.label
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="flex flex-col gap-0.5 pb-1 pl-3">
                          {link.dropdown.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => {
                                setMobileOpen(false);
                                setMobileExpanded(null);
                              }}
                              tabIndex={mobileExpanded === link.label ? undefined : -1}
                              className="flex min-h-11 items-center py-2 font-sans text-sm text-foreground/70 transition-colors hover:text-foreground"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(MOBILE_NAV_ITEM_LINK_CLASS, "py-3")}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
            <div className="mt-3 w-full">
              <Button href="/book" variant="primary" size="sm" className="w-full">
                Check my date
              </Button>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
