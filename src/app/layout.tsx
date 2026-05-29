import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond, Jost, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
  title: "Stamer - Live cello for an unforgettable event",
  description: "Live cello music for weddings, private events, and corporate functions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${manrope.variable} ${jost.variable} ${jakarta.variable} font-sans antialiased text-foreground bg-background`}
      >
        {/* Global SVG Noise Overlay */}
        <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.05]">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
        {children}
      </body>
    </html>
  );
}
