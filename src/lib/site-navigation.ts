interface DropdownItem {
  label: string;
  href: string;
  description?: string;
}

interface PlannerLink {
  label: string;
  href: string;
}

export interface NavLink {
  label: string;
  href: string;
  dropdown?: {
    items: DropdownItem[];
    cta?: { heading: string; buttonLabel: string; buttonHref: string };
    plannerPanel?: { heading: string; links: PlannerLink[] };
  };
}

export const NAV_LINKS: NavLink[] = [
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
        { label: "Hotels & Estates", href: "/services/hotels" },
      ],
    },
  },
];
