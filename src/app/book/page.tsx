import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Navbar } from "@/components/Navbar";
import { BookFlow } from "@/components/BookFlow";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function BookPage() {
  const calUsername = process.env.NEXT_PUBLIC_CAL_USERNAME ?? "luke-stamer";
  // Updated to the user's requested slug
  const calEventSlug = process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ?? "event-planning";
  const calLink = `${calUsername}/${calEventSlug}`;

  return (
    <>
      <Navbar forceBackground />
      <main className="bg-background min-h-screen pt-12 lg:pt-24 pb-24">
        <SectionWrapper maxWidth="max-w-5xl">
          {/* Mobile Header */}
          <div className="lg:hidden flex flex-col mb-16">
            <SectionHeader
              label="Plan your event"
              heading="Let's make it unforgettable."
              alignment="left"
              className="mb-6"
            />
            <p className="font-sans text-lg text-foreground/60 leading-relaxed">
              Book a quick 10-minute consult to confirm fit and talk through the vision for your event. 
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-12 lg:gap-24 items-start">
            {/* Left: Copy & Context */}
            <div className="flex flex-col gap-8 lg:sticky lg:top-32 order-2 lg:order-1">
              <div className="hidden lg:block">
                <SectionHeader
                  label="Plan your event"
                  heading="Let's make it unforgettable."
                  alignment="left"
                  className="mb-6"
                />
                <p className="font-sans text-lg text-foreground/60 leading-relaxed">
                  Book a quick 10-minute consult to confirm fit and talk through the vision for your event. 
                </p>
              </div>

              <div className="flex flex-col gap-6 p-8 rounded-2xl bg-foreground/[0.02] border border-foreground/[0.06]">
                <h4 className="font-display font-semibold text-lg">On our call, we&apos;ll cover:</h4>
                <ul className="flex flex-col gap-4 font-sans text-foreground/70 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span><strong>Event flow and timing</strong> — from prelude to reception.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span><strong>Musical direction</strong> — setting the right atmosphere.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span><strong>Logistics</strong> — setup, amplification, and coordination.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span><strong>Package fit</strong> — making sure you get exactly what you need.</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <p className="font-sans text-sm text-foreground/50">
                  Not ready to book a call yet?
                </p>
                <Link
                  href="/#contact"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/70 transition-colors w-fit"
                >
                  Use the contact form instead
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: Booking Flow */}
            <div className="w-full order-1 lg:order-2">
              <BookFlow calLink={calLink} />
            </div>
          </div>
        </SectionWrapper>
      </main>
    </>
  );
}
