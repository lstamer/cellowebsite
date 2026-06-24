import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond, Jost, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { WhatsAppFab } from "@/components/ui/WhatsAppFab";
import { MobileStickyCTA } from "@/components/ui/MobileStickyCTA";
import "./globals.css";

const theSeasons = localFont({
  src: [
    {
      path: "../../public/fonts/the-seasons-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/the-seasons-light-italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-the-seasons",
  display: "swap",
});

const theSeasonsEmphasis = localFont({
  src: "../../public/fonts/the-seasons-regular.ttf",
  variable: "--font-the-seasons-emphasis",
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
  weight: ["300", "400"],
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
        className={`${theSeasons.variable} ${theSeasonsEmphasis.variable} ${cormorant.variable} ${manrope.variable} ${jost.variable} ${jakarta.variable} font-sans antialiased text-foreground bg-background`}
      >
        <noscript><style>{`.gsap-reveal{opacity:1!important;transform:none!important}`}</style></noscript>
        {/* Global SVG Noise Overlay */}
        <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.05]">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
        {children}
        <WhatsAppFab />
        <MobileStickyCTA />
        <SpeedInsights />
      </body>
    </html>
  );
}
