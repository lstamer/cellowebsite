import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond, Jost, Plus_Jakarta_Sans } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { WhatsAppFab } from "@/components/ui/WhatsAppFab";
import { MobileStickyCTA } from "@/components/ui/MobileStickyCTA";
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
          className="pointer-events-none fixed inset-0 z-50 bg-repeat opacity-[0.05] bg-[url('data:image/png;base64,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')]"
        />
        {children}
        <WhatsAppFab />
        <MobileStickyCTA />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
