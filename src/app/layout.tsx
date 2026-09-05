import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond, Jost, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { WhatsAppFab } from "@/components/ui/WhatsAppFab";
import { MobileStickyCTA } from "@/components/ui/MobileStickyCTA";
import { SiteTracker } from "@/components/analytics/SiteTracker";
import "./globals.css";

const theSeasons = localFont({
  src: [
    {
      path: "../../public/fonts/the-seasons-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/the-seasons-light-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-the-seasons",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stamer Cello — Classically trained, happily unconventional",
  description:
    "I'm Luke, a Cape Town cellist who plays the moments people remember first — weddings, private events, and corporate functions. Classical and modern, played live.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${theSeasons.variable} ${cormorant.variable} ${manrope.variable} ${jost.variable} ${jakarta.variable} font-sans antialiased text-foreground bg-background`}
      >
        <noscript><style>{`.gsap-reveal{opacity:1!important;transform:none!important}`}</style></noscript>
        {/* Global grain overlay: tiled 128px noise PNG (static raster, no live SVG filter) */}
        <div
          aria-hidden
          className="site-chrome pointer-events-none fixed inset-0 z-50 bg-grain opacity-[0.05]"
        />
        {children}
        <WhatsAppFab />
        <MobileStickyCTA />
        <SiteTracker />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
