import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-surface-darker text-background pt-24 pb-12 px-section-x-sm md:px-section-x-md lg:px-section-x-lg -mt-8 rounded-t-[4rem] relative z-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          
          {/* Column 1: Brand */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="font-display font-bold text-3xl tracking-tight">
              Stamer
            </Link>
            <p className="font-sans text-background/60 leading-relaxed text-sm">
              Live cello for an unforgettable event. We elevate celebrations with elegance and refined artistry.
            </p>
            {/* Status Indicator */}
            <div className="flex items-center gap-3 mt-4">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
              </div>
              <span className="font-mono text-xs text-background/50 uppercase tracking-widest">
                Accepting Bookings
              </span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="font-display font-bold text-sm tracking-widest uppercase mb-6 text-background/40">
              Navigation
            </h4>
            <ul className="flex flex-col gap-4 font-sans text-sm">
              <li><Link href="/about" className="link-hover text-background/80 hover:text-accent">About</Link></li>
              <li><Link href="#services" className="link-hover text-background/80 hover:text-accent">Services</Link></li>
              <li><Link href="#process" className="link-hover text-background/80 hover:text-accent">Process</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h4 className="font-display font-bold text-sm tracking-widest uppercase mb-6 text-background/40">
              Legal
            </h4>
            <ul className="flex-col gap-4 font-sans text-sm">
              <li><Link href="#" className="link-hover text-background/80 hover:text-accent">Privacy Policy</Link></li>
              <li><Link href="#" className="link-hover text-background/80 hover:text-accent">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h4 className="font-display font-bold text-sm tracking-widest uppercase mb-6 text-background/40">
              Contact
            </h4>
            <ul className="flex flex-col gap-4 font-sans text-sm">
              <li><a href="mailto:contact@stamer.com" className="link-hover text-background/80 hover:text-accent">contact@stamer.com</a></li>
              <li><a href="tel:+1234567890" className="link-hover text-background/80 hover:text-accent">+1 (234) 567-890</a></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-background/40">
            &copy; {new Date().getFullYear()} Stamer. All rights reserved.
          </p>
          <div className="font-mono text-xs text-background/40">
            Designed for Excellence
          </div>
        </div>
      </div>
    </footer>
  );
}
