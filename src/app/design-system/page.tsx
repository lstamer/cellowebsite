"use client";

import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";
import { cn } from "@/lib/utils";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";
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

function ColorSwatch({
  name,
  varName,
  hex,
  swatchClassName,
}: {
  name: string;
  varName: string;
  hex: string;
  swatchClassName: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "h-24 w-full rounded-card border border-foreground/10 shadow-sm",
          swatchClassName
        )}
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
    <main className="min-h-dvh bg-background">
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
          <ColorSwatch name="Primary" varName="--color-primary" hex="#2E4036" swatchClassName="bg-primary" />
          <ColorSwatch name="Accent" varName="--color-accent" hex="#CC5833" swatchClassName="bg-accent" />
          <ColorSwatch name="Background" varName="--color-background" hex="#FFFFFF" swatchClassName="bg-background" />
          <ColorSwatch name="Cream" varName="--color-cream" hex="#F2F0E9" swatchClassName="bg-cream" />
          <ColorSwatch name="On Dark" varName="--color-on-dark" hex="#FFFFFF" swatchClassName="bg-on-dark border border-foreground/10" />
          <ColorSwatch name="Foreground" varName="--color-foreground" hex="#1A1A1A" swatchClassName="bg-foreground" />
          <ColorSwatch name="Surface Dark" varName="--color-surface-dark" hex="#1A1A1A" swatchClassName="bg-surface-dark" />
          <ColorSwatch name="Surface Darker" varName="--color-surface-darker" hex="#111111" swatchClassName="bg-surface-darker" />
          <ColorSwatch name="Success" varName="--color-success" hex="#34D399" swatchClassName="bg-success" />
        </div>
      </SectionWrapper>

      {/* 2. Typography */}
      <SectionWrapper id="typography" className="bg-foreground/5" maxWidth="max-w-none">
        <div className="max-w-7xl mx-auto">
          <SectionHeader label="Tokens" heading="Typography Scale" alignment="left" />
          <div className="space-y-16">
            <div>
              <p className="font-mono text-sm text-foreground/60 mb-4">Display (The Seasons)</p>
              <h1 className="font-display font-bold text-4xl md:text-6xl">The quick brown fox jumps over the lazy dog.</h1>
            </div>
            <div>
              <p className="font-mono text-sm text-foreground/60 mb-4">
                Feature item title + body (<code className="font-mono text-xs">typography-classes.ts</code>)
              </p>
              <h3 className={featureItemTitleClass}>Bespoke arrangements</h3>
              <p className={cn(featureItemBodyClass, "mt-3 max-w-2xl")}>
                Standard for benefit rows, service list titles, icon+text features, and FAQ questions.
                Title: <code className="font-mono text-xs">text-xl md:text-2xl</code>. Body:{" "}
                <code className="font-mono text-xs">text-base text-foreground/75</code>.
              </p>
            </div>
            <div>
              <p className="font-mono text-sm text-foreground/60 mb-4">Serif / Italic (Cormorant Garamond)</p>
              <h1 className="font-serif italic text-display leading-none">The quick brown fox.</h1>
            </div>
            <div>
              <p className="font-mono text-sm text-foreground/60 mb-4">Sans-Serif / Body (Outfit)</p>
              <p className="font-sans text-lg md:text-xl leading-relaxed max-w-3xl">
                The quick brown fox jumps over the lazy dog. This font is used for standard body copy,
                long-form text, and secondary UI elements where readability is paramount.                 Feature item bodies use <code className="font-mono text-sm text-foreground/80">text-base</code> at
                all breakpoints; major section titles stay in Cormorant
                italic via <code className="font-mono text-sm text-foreground/80">SectionHeader</code>{" "}
                and hero patterns.
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
            {/* SectionHeader */}
            <div>
              <h3 className="mb-8 border-b border-foreground/10 pb-4 font-display text-2xl font-bold">
                SectionHeader
              </h3>
              <p className="mb-8 max-w-3xl font-sans text-sm text-foreground/80">
                Props: <code className="font-mono text-xs">label</code>,{" "}
                <code className="font-mono text-xs">heading</code> (ReactNode),{" "}
                <code className="font-mono text-xs">alignment</code> (&quot;left&quot; | &quot;center&quot;),{" "}
                <code className="font-mono text-xs">className</code>,{" "}
                <code className="font-mono text-xs">headingClassName</code>,{" "}
                <code className="font-mono text-xs">labelClassName</code>. Default label uses an accent
                left rule; default heading is primary serif at display scale with tight leading.
              </p>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="rounded-card border border-primary/10 bg-background p-8">
                  <p className="mb-4 font-mono text-xs text-foreground/60">alignment=&quot;left&quot;</p>
                  <SectionHeader label="Example" heading="Left-aligned title" alignment="left" />
                </div>
                <div className="rounded-card border border-primary/10 bg-background p-8">
                  <p className="mb-4 font-mono text-xs text-foreground/60">alignment=&quot;center&quot;</p>
                  <SectionHeader label="Example" heading="Centered title" alignment="center" />
                </div>
              </div>
            </div>

            {/* HandDrawnUnderline */}
            <div>
              <h3 className="mb-8 border-b border-foreground/10 pb-4 font-display text-2xl font-bold">
                HandDrawnUnderline
              </h3>
              <p className="mb-6 max-w-3xl font-sans text-sm text-foreground/80">
                Animated SVG underline for emphasis inside serif headings. Pass{" "}
                <code className="font-mono text-xs">variant</code>{" "}
                <code className="font-mono text-xs">1 | 2 | 3</code> so nearby sections can use different
                stroke shapes (for example Testimonials vs. weddings authority blocks).
              </p>
              <div className="space-y-6 rounded-card border border-primary/10 bg-background p-8">
                <p className="font-serif text-2xl italic text-balance text-foreground md:text-3xl">
                  Variant 1: see what <HandDrawnUnderline variant={1}>customers</HandDrawnUnderline> are
                  saying.
                </p>
                <p className="font-serif text-2xl italic text-balance text-foreground md:text-3xl">
                  Variant 2: see what <HandDrawnUnderline variant={2}>customers</HandDrawnUnderline> are
                  saying.
                </p>
                <p className="font-serif text-2xl italic text-balance text-foreground md:text-3xl">
                  Variant 3: see what <HandDrawnUnderline variant={3}>customers</HandDrawnUnderline> are
                  saying.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div>
              <h3 className="font-display font-bold text-2xl mb-8 border-b border-foreground/10 pb-4">Buttons</h3>
              <div className="flex flex-wrap items-center gap-8 bg-background p-8 rounded-card border border-primary/10">
                <div className="space-y-4">
                  <p className="font-mono text-xs text-foreground/60">Primary</p>
                  <Button href="#" variant="primary" size="md">Get in contact</Button>
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

            {/* Section patterns */}
            <div>
              <h3 className="font-display font-bold text-2xl mb-8 border-b border-foreground/10 pb-4">
                Section patterns
              </h3>

              <div className="mb-12">
                <p className="mb-4 font-mono text-xs text-foreground/60">Services row (editorial)</p>
                <div className="rounded-card border border-primary/10 bg-background p-6 md:p-8">
                  <div className="group relative flex flex-col items-center gap-8 md:flex-row md:gap-12 lg:gap-16">
                    <div className="relative w-full md:w-3/5">
                      <div
                        className={cn(
                          "absolute inset-0 -z-10 bg-primary/5 transition-transform duration-700 ease-out",
                          "translate-x-3 translate-y-3 group-hover:scale-105"
                        )}
                      />
                      <div className="relative aspect-[5/4] max-h-[28rem] overflow-hidden shadow-2xl md:aspect-[3/2] md:max-h-none">
                        <Image
                          src="/images/wedding.jpg"
                          alt="Sample service image — wedding setting"
                          fill
                          sizes="(max-width: 48rem) 100vw, 60vw"
                          className="object-cover object-center grayscale-[15%] transition-transform duration-1000 ease-out group-hover:scale-105"
                        />
                      </div>
                    </div>
                    <div className="flex w-full flex-col justify-center md:w-2/5 md:pr-6">
                      <h3
                        className={cn(
                          featureItemTitleClass,
                          "mb-4 transition-colors duration-500 group-hover:text-primary"
                        )}
                      >
                        Sample service title
                      </h3>
                      <p className={cn(featureItemBodyClass, "max-w-md")}>
                        Short description matching the home Services text column.
                      </p>
                      <div className="mt-8">
                        <Button
                          href="#"
                          variant="primary"
                          size="sm"
                          className="font-display text-xs font-bold uppercase tracking-widest"
                        >
                          View details
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="mt-6 max-w-2xl font-sans text-sm text-foreground/60">
                    Matches home{" "}
                    <code className="font-mono text-xs text-foreground/80">Services</code>: alternating
                    rows use <code className="font-mono text-xs text-foreground/80">md:flex-row-reverse</code>
                    ; the serif &ldquo;And much more…&rdquo; line sits below the full list in production, not
                    inside each row.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <p className="mb-4 font-mono text-xs text-foreground/60">Problem block</p>
                  <div className="max-w-xl border-l-2 border-accent pl-8">
                    <h3 className="mb-3 font-sans text-xl font-semibold text-foreground md:text-2xl">
                      Sample problem heading
                    </h3>
                    <p className="font-sans text-lg leading-relaxed text-foreground/60">
                      Body copy as used in the Problem section on the home page.
                    </p>
                  </div>
                </div>

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
            <div className="absolute top-0 left-0 bg-primary text-on-dark font-mono text-xs px-4 py-1 rounded-br-card z-50">Navbar</div>
            <div className="relative h-[200px] overflow-hidden">
              <Navbar />
            </div>
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-on-dark font-mono text-xs px-4 py-1 rounded-br-card z-50">Hero Section</div>
            <Hero />
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-on-dark font-mono text-xs px-4 py-1 rounded-br-card z-50">About Section</div>
            <About />
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-on-dark font-mono text-xs px-4 py-1 rounded-br-card z-50">Services Section</div>
            <Services />
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-on-dark font-mono text-xs px-4 py-1 rounded-br-card z-50">Problem Section</div>
            <Problem />
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-on-dark font-mono text-xs px-4 py-1 rounded-br-card z-50">Solution Section</div>
            <Solution />
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-on-dark font-mono text-xs px-4 py-1 rounded-br-card z-50">Testimonials Section</div>
            <Testimonials />
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-on-dark font-mono text-xs px-4 py-1 rounded-br-card z-50">CTA Section</div>
            <CTA />
          </div>

          <div className="bg-background rounded-card overflow-hidden shadow-xl border border-foreground/10 relative">
            <div className="absolute top-0 left-0 bg-primary text-on-dark font-mono text-xs px-4 py-1 rounded-br-card z-50">Footer</div>
            <Footer />
          </div>

        </div>
      </SectionWrapper>
    </main>
  );
}
