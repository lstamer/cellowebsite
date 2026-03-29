"use client";

import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Services } from "@/components/Services";
import { Problem } from "@/components/Problem";
import { Solution } from "@/components/Solution";
import { Testimonials } from "@/components/Testimonials";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

// NEW BLOCKS
import { StatsBanner, CalloutBanner, NewsletterBanner } from "@/components/blocks/Banners";
import { FeatureGrid, BentoGrid, ProcessCards } from "@/components/blocks/Cards";
import { ImageRightSplit, ImageLeftWithList, AlternatingSplit } from "@/components/blocks/Splits";

function ColorSwatch({ name, varName, hex }: { name: string; varName: string; hex: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-24 w-full rounded-card border border-foreground/10 shadow-sm"
        style={{ backgroundColor: `var(${varName})` }}
      />
      <div>
        <p className="font-display font-bold text-sm">{name}</p>
        <p className="font-mono text-xs text-foreground/60">{varName}</p>
        <p className="font-mono text-xs text-foreground/40">{hex}</p>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Design System Header */}
      <section className="pt-32 pb-16 px-section-x-sm md:px-section-x-md lg:px-section-x-lg max-w-7xl mx-auto border-b border-foreground/10">
        <h1 className="font-serif italic text-6xl md:text-8xl mb-6">Design System</h1>
        <p className="font-sans text-xl text-foreground/80 max-w-2xl">
          Source of truth for the brand&apos;s visual identity, component library, and section templates. 
          Use this page to reference standard patterns when building new features.
        </p>
      </section>

      {/* 1. Color Palette */}
      <SectionWrapper id="colors">
        <SectionHeader label="Tokens" heading="Color Palette" alignment="left" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <ColorSwatch name="Primary" varName="--color-primary" hex="#2E4036" />
          <ColorSwatch name="Accent" varName="--color-accent" hex="#CC5833" />
          <ColorSwatch name="Background" varName="--color-background" hex="#F2F0E9" />
          <ColorSwatch name="Foreground" varName="--color-foreground" hex="#1A1A1A" />
          <ColorSwatch name="Surface Dark" varName="--color-surface-dark" hex="#1A1A1A" />
          <ColorSwatch name="Surface Darker" varName="--color-surface-darker" hex="#111111" />
          <ColorSwatch name="Success" varName="--color-success" hex="#34D399" />
        </div>
      </SectionWrapper>

      {/* 2. Typography */}
      <SectionWrapper id="typography" className="bg-foreground/5" maxWidth="max-w-none">
        <div className="max-w-7xl mx-auto">
          <SectionHeader label="Tokens" heading="Typography Scale" alignment="left" />
          <div className="space-y-16">
            <div>
              <p className="font-mono text-sm text-foreground/60 mb-4">Display (Plus Jakarta Sans)</p>
              <h1 className="font-display font-bold text-4xl md:text-6xl">The quick brown fox jumps over the lazy dog.</h1>
            </div>
            <div>
              <p className="font-mono text-sm text-foreground/60 mb-4">Serif / Italic (Cormorant Garamond)</p>
              <h1 className="font-serif italic text-display leading-none">The quick brown fox.</h1>
            </div>
            <div>
              <p className="font-mono text-sm text-foreground/60 mb-4">Sans-Serif / Body (Outfit)</p>
              <p className="font-sans text-lg md:text-xl leading-relaxed max-w-3xl">
                The quick brown fox jumps over the lazy dog. This font is used for standard body copy,
                long-form text, and secondary UI elements where readability is paramount.
              </p>
            </div>
            <div>
              <p className="font-mono text-sm text-foreground/60 mb-4">Monospace (IBM Plex Mono)</p>
              <p className="font-mono text-sm md:text-base">0123456789 STEP 01 ACCEPTING BOOKINGS</p>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 3. Spacing */}
      <SectionWrapper id="spacing">
        <SectionHeader label="Tokens" heading="Spacing & Layout" alignment="left" />
        <div className="space-y-8">
          <p className="font-sans text-foreground/80 max-w-2xl mb-8">
            All sections should be wrapped in the <code>&lt;SectionWrapper&gt;</code> component which handles responsive X and Y padding automatically.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-24 font-mono text-sm">X-SM</div>
              <div className="h-8 bg-primary/20 w-[1.5rem]" />
              <div className="font-mono text-xs text-foreground/60">1.5rem (24px) - Mobile</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 font-mono text-sm">X-MD</div>
              <div className="h-8 bg-primary/20 w-[3rem]" />
              <div className="font-mono text-xs text-foreground/60">3rem (48px) - Tablet</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 font-mono text-sm">X-LG</div>
              <div className="h-8 bg-primary/20 w-[6rem]" />
              <div className="font-mono text-xs text-foreground/60">6rem (96px) - Desktop</div>
            </div>
            <div className="flex items-center gap-4 mt-8">
              <div className="w-24 font-mono text-sm">Y-Base</div>
              <div className="h-8 bg-accent/20 w-[6rem]" />
              <div className="font-mono text-xs text-foreground/60">6rem (96px) - Default vertical</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 font-mono text-sm">Y-MD</div>
              <div className="h-8 bg-accent/20 w-[8rem]" />
              <div className="font-mono text-xs text-foreground/60">8rem (128px) - Large vertical</div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 4. Components */}
      <SectionWrapper id="components" className="bg-foreground/5" maxWidth="max-w-none">
        <div className="max-w-7xl mx-auto">
          <SectionHeader label="Library" heading="UI Components" alignment="left" />
          
          <div className="space-y-24">
            {/* Buttons */}
            <div>
              <h3 className="font-display font-bold text-2xl mb-8 border-b border-foreground/10 pb-4">Buttons</h3>
              <div className="flex flex-wrap items-center gap-8 bg-background p-8 rounded-card border border-primary/10">
                <div className="space-y-4">
                  <p className="font-mono text-xs text-foreground/60">Primary</p>
                  <Button href="#" variant="primary" size="md">Book a call</Button>
                </div>
                <div className="space-y-4">
                  <p className="font-mono text-xs text-foreground/60">Secondary</p>
                  <div className="p-4 bg-primary rounded-card">
                    <Button href="#" variant="secondary" size="md">View Services</Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="font-mono text-xs text-foreground/60">Ghost</p>
                  <div className="p-4 bg-surface-dark rounded-card">
                    <Button href="#" variant="ghost" size="sm">About</Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="font-mono text-xs text-foreground/60">Sizes</p>
                  <div className="flex items-center gap-4">
                    <Button href="#" variant="primary" size="sm">Small</Button>
                    <Button href="#" variant="primary" size="md">Medium</Button>
                    <Button href="#" variant="primary" size="lg">Large</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards */}
            <div>
              <h3 className="font-display font-bold text-2xl mb-8 border-b border-foreground/10 pb-4">Cards & Patterns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Service Card Pattern */}
                <div>
                  <p className="font-mono text-xs text-foreground/60 mb-4">Service Card</p>
                  <div className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-primary/10 bg-background p-8 shadow-card transition-all duration-500 hover:-translate-y-1 hover:border-primary/20 hover:shadow-card-hover">
                    <span className="mb-6 font-display text-xs font-bold uppercase tracking-widest text-foreground/50">
                      Category
                    </span>
                    <div className="relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-lg border border-primary/10">
                      <Image
                        src="/images/wedding.jpg"
                        alt="Sample service image — wedding setting"
                        fill
                        sizes="(max-width: 48rem) 100vw, 50vw"
                        className="object-cover object-center grayscale-[15%] transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                    </div>
                    <h3 className="mb-3 font-display text-xl font-bold text-foreground md:text-2xl">
                      Sample Service
                    </h3>
                    <p className="max-w-prose flex-grow font-sans leading-relaxed text-foreground/70">
                      Matches the home Services cards: display label, photo with in-frame hover zoom, body, serif italic tagline.
                    </p>
                    <p className="mt-6 font-serif text-sm italic text-foreground/60">
                      A quiet editorial line under the description.
                    </p>
                  </div>
                </div>

                {/* Testimonial Card Pattern */}
                <div>
                  <p className="font-mono text-xs text-foreground/60 mb-4">Testimonial Card</p>
                  <div className="bg-background p-10 rounded-card border border-primary/10 shadow-card flex flex-col items-center text-center justify-center h-full">
                    <p className="font-serif italic text-2xl md:text-3xl text-primary leading-tight mb-8">
                      &ldquo;The music transformed our ceremony into something out of a movie.&rdquo;
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-bold text-primary">
                        E&J
                      </div>
                      <div className="text-left">
                        <p className="font-display font-bold text-foreground">Elena & James</p>
                        <p className="font-sans text-sm text-foreground/60">Wedding</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* 5. Section Templates */}
      <SectionWrapper id="templates" maxWidth="max-w-none" className="p-0! md:p-0! lg:p-0!">
        <div className="px-section-x-sm md:px-section-x-md lg:px-section-x-lg py-16 max-w-7xl mx-auto">
          <SectionHeader label="Layouts" heading="Section Templates" alignment="left" />
          <p className="font-sans text-lg text-foreground/80 max-w-2xl mb-12">
            These are the fully functional page sections, ready to be used and combined to build out new pages.
          </p>
        </div>

        <div className="flex flex-col gap-8 bg-foreground/10 p-4 md:p-8">
          
          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Navbar</div>
            <div className="relative h-[200px] overflow-hidden">
              <Navbar />
            </div>
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Hero Section</div>
            <Hero />
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">About Section</div>
            <About />
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Services Section</div>
            <Services />
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Problem Section</div>
            <Problem />
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Solution Section</div>
            <Solution />
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Testimonials Section</div>
            <Testimonials />
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">CTA Section</div>
            <CTA />
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Footer</div>
            <Footer />
          </div>

          {/* Banners */}
          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Stats Banner</div>
            <StatsBanner />
          </div>
          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Callout Banner</div>
            <CalloutBanner />
          </div>
          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Newsletter Banner</div>
            <NewsletterBanner />
          </div>

          {/* Cards */}
          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Feature Grid</div>
            <FeatureGrid />
          </div>
          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Bento Grid</div>
            <BentoGrid />
          </div>
          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Process Cards</div>
            <ProcessCards />
          </div>

          {/* Splits */}
          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Image Right Split</div>
            <ImageRightSplit />
          </div>
          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Image Left With List</div>
            <ImageLeftWithList />
          </div>
          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-background font-mono text-xs px-4 py-1 rounded-br-card z-50">Alternating Split</div>
            <AlternatingSplit />
          </div>

        </div>
      </SectionWrapper>
    </main>
  );
}
