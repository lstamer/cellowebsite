import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

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

        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <Button href="/book" variant="primary" size="lg" className="w-full sm:w-auto">
            Get in contact
          </Button>
          <Button href="#contact" variant="secondary" size="lg" className="w-full sm:w-auto">
            Send a message
          </Button>
        </div>
      </div>
    </SectionWrapper>
  );
}
