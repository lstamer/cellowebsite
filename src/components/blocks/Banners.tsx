import React from 'react';
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";

// ==========================================
// 1. StatsBanner
// ==========================================
export const StatsBanner = () => {
  return (
    <div className="bg-surface-dark relative overflow-hidden border-y border-primary/10">
      {/* Decorative organic background element echoing cello curves */}
      <div className="absolute -top-1/2 -right-[10%] w-[60%] h-[200%] bg-primary/10 rounded-full blur-3xl pointer-events-none opacity-50" />
      
      <SectionWrapper>
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
          {[
            { number: "15+", label: "Years Playing" },
            { number: "250", label: "Global Concerts" },
            { number: "4", label: "Studio Albums" },
            { number: "50+", label: "Masterclass Students" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center space-y-4 group">
              <span className="text-5xl md:text-7xl font-serif text-accent tracking-tighter group-hover:scale-110 transition-transform duration-500">
                {stat.number}
              </span>
              <span className="text-xs md:text-sm font-jost text-primary uppercase tracking-[0.2em] opacity-80">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </SectionWrapper>
    </div>
  );
};

// ==========================================
// 2. CalloutBanner
// ==========================================
export const CalloutBanner = () => {
  return (
    <SectionWrapper>
      <div className="bg-surface-darker py-20 md:py-32 px-6 md:px-16 relative overflow-hidden rounded-card shadow-card group border border-primary/10">
        {/* Subtle radial texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-1000" />
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-10">
          <h2 className="text-4xl md:text-6xl font-serif text-foreground leading-tight">
            Elevate Your Event with <span className="text-accent italic block mt-4">Resonant Elegance</span>
          </h2>
          <p className="text-lg md:text-xl font-sans text-foreground max-w-2xl leading-relaxed opacity-90">
            Available for private bookings, orchestral solos, and intimate chamber music performances across the globe. Experience the depth and emotion of masterful cello performance.
          </p>
          <div className="pt-6">
            <Button 
              href="/booking" 
              variant="primary" 
              size="lg" 
              className="shadow-card-hover"
            >
              Inquire for Booking
            </Button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

// ==========================================
// 3. NewsletterBanner
// ==========================================
export const NewsletterBanner = () => {
  return (
    <div className="bg-background relative border-y border-primary/10">
      <SectionWrapper>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 max-w-6xl mx-auto">
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <SectionHeader 
              label="Symphonic Updates" 
              heading={
                <>
                  Join the <span className="text-primary italic">Mailing List</span>
                </>
              }
              alignment="left"
              className="mb-6 lg:mb-8"
            />
            <p className="font-sans text-foreground text-base md:text-lg max-w-md mx-auto lg:mx-0 leading-relaxed opacity-80">
              Receive exclusive updates on upcoming performances, masterclasses, and new album releases directly to your inbox.
            </p>
          </div>
          
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <div className="w-full max-w-md flex flex-col space-y-4">
              <form className="relative flex flex-col sm:flex-row gap-4 sm:gap-0 w-full group">
                {/* Input background layer */}
                <div className="absolute inset-0 bg-surface-dark rounded-full -z-10 transition-transform duration-500 group-focus-within:scale-105" />
                
                <input 
                  type="email" 
                  placeholder="Your email address..." 
                  className="flex-1 bg-transparent text-foreground font-sans px-8 py-5 sm:py-6 rounded-full border border-primary/10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all w-full placeholder:opacity-50"
                  required
                />
                <div className="sm:absolute sm:right-2 sm:top-2 sm:bottom-2 flex items-center">
                  <Button 
                    href="#subscribe" 
                    variant="primary"
                    className="w-full sm:w-auto px-8 py-4 sm:py-0 h-full rounded-full uppercase tracking-widest text-sm"
                  >
                    Subscribe
                  </Button>
                </div>
              </form>
              <p className="text-xs font-mono text-foreground opacity-50 text-center lg:text-left sm:ml-6 mt-2">
                Unsubscribe at any time. No spam, just music.
              </p>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
};