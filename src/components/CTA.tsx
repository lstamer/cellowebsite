import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import Link from "next/link";

export function CTA() {
  return (
    <SectionWrapper id="booking-cta" className="bg-primary text-background relative overflow-hidden" maxWidth="max-w-none">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[37.5rem] bg-accent/20 blur-[7.5rem] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        <h2 className="font-serif italic text-6xl md:text-8xl text-background leading-[0.9] mb-8">
          Make it <br /> Unforgettable.
        </h2>
        
        <p className="font-sans text-xl text-background/80 max-w-2xl mb-12 leading-relaxed">
          Ensure your event has the perfect atmosphere. Reach out today to secure your date and start planning the music.
        </p>

        <div className="flex flex-col sm:flex-row gap-8 sm:gap-10 items-center justify-center">
          <Button 
            href="/book" 
            variant="white" 
            size="lg" 
            className="w-full sm:w-auto active:scale-95 transition-transform duration-200"
          >
            Book a call
          </Button>
          <Link 
            href="#contact" 
            className="group flex items-center gap-2 font-display font-bold uppercase tracking-widest text-sm text-background/80 hover:text-background transition-colors duration-300"
          >
            <span className="relative overflow-hidden">
              <span className="inline-block transition-transform duration-300 group-hover:-translate-y-full">Send a message</span>
              <span className="absolute inset-0 inline-block transition-transform duration-300 translate-y-full group-hover:translate-y-0">Send a message</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:translate-x-1">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </SectionWrapper>
  );
}
