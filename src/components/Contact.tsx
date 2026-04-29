import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ContactForm } from "@/components/ContactForm";

export function Contact() {
  return (
    <SectionWrapper id="contact" className="bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
        {/* Left: copy */}
        <div className="flex flex-col gap-6">
          <SectionHeader
            label="Get in contact"
            heading="Let's chat about your event."
            alignment="left"
          />
          <p className="font-sans text-lg text-foreground/60 leading-relaxed max-w-md">
            Share your date, venue, and the atmosphere you want to create. I&apos;ll
            help you shape live cello music for weddings, private celebrations,
            and corporate events.
          </p>
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16z" />
                </svg>
              </div>
              <span className="font-sans text-foreground/70">Response within 24 hours</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="font-sans text-foreground/70">Available for events year-round</span>
            </div>
          </div>
        </div>

        {/* Right: form */}
        <ContactForm />
      </div>
    </SectionWrapper>
  );
}
