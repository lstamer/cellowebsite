import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppHref, PUBLIC_WHATSAPP_DISPLAY } from "@/lib/whatsapp";

export function Footer() {
  return (
    <footer className="bg-surface-darker text-on-dark pt-24 pb-12 px-section-x-sm md:px-section-x-md lg:px-section-x-lg -mt-8 rounded-t-[4rem] relative z-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          
          {/* Column 1: Brand */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="font-display font-bold text-3xl tracking-tight">
              Stamer
            </Link>
            <p className="font-sans text-on-dark/60 leading-relaxed text-sm">
              Live cello for the moments people remember first: weddings, private events, and corporate functions across Cape Town.
            </p>
            {/* Status Indicator */}
            <div className="flex items-center gap-3 mt-4">
              <div className="relative flex h-3 w-3">
                <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
              </div>
              <span className="font-jost text-xs text-on-dark/50 uppercase tracking-widest">
                Limited booking availability
              </span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h3 className="font-jost font-bold text-sm tracking-widest uppercase mb-6 text-on-dark/60">
              Navigation
            </h3>
            <ul className="flex flex-col gap-4 font-sans text-sm">
              <li><Link href="/about" className="link-hover inline-block py-2.5 text-on-dark/80 hover:text-accent">About</Link></li>
              <li><Link href="/#services" className="link-hover inline-block py-2.5 text-on-dark/80 hover:text-accent">Services</Link></li>
              <li><Link href="/gallery" className="link-hover inline-block py-2.5 text-on-dark/80 hover:text-accent">Gallery</Link></li>
              <li><Link href="/pricing" className="link-hover inline-block py-2.5 text-on-dark/80 hover:text-accent">Pricing</Link></li>
              <li><Link href="/#process" className="link-hover inline-block py-2.5 text-on-dark/80 hover:text-accent">Process</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="font-jost font-bold text-sm tracking-widest uppercase mb-6 text-on-dark/60">
              Legal
            </h3>
            <ul className="flex flex-col gap-4 font-sans text-sm">
              <li><Link href="/privacy" className="link-hover inline-block py-2.5 text-on-dark/80 hover:text-accent">Privacy Policy</Link></li>
              <li><Link href="/terms" className="link-hover inline-block py-2.5 text-on-dark/80 hover:text-accent">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-jost font-bold text-sm tracking-widest uppercase mb-6 text-on-dark/60">
              Contact
            </h3>
            <ul className="flex flex-col gap-4 font-sans text-sm">
              <li><a href="mailto:luke@stamer.co.za" className="link-hover inline-block py-2.5 text-on-dark/80 hover:text-accent">luke@stamer.co.za</a></li>
              <li><a href="tel:+27639081386" className="link-hover inline-block py-2.5 text-on-dark/80 hover:text-accent">+27 63 908 1386</a></li>
              <li>
                <a
                  href={buildWhatsAppHref({ source: "footer" })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-hover inline-flex items-center gap-2 py-2.5 text-on-dark/80 hover:text-accent"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={2} />
                  WhatsApp {PUBLIC_WHATSAPP_DISPLAY}
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-on-dark/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-jost text-xs text-on-dark/60">
            &copy; {new Date().getFullYear()} Stamer. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
