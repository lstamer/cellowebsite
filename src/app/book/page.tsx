import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { BookFlow } from "@/components/BookFlow";
import { Navbar } from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

const CALL_TOPICS = [
  {
    title: "Event flow and timing",
    description: "from prelude to reception.",
  },
  {
    title: "Musical direction",
    description: "setting the right atmosphere.",
  },
  {
    title: "Logistics",
    description: "setup, amplification, and coordination.",
  },
  {
    title: "Package fit",
    description: "making sure you get exactly what you need.",
  },
];

export default function BookPage() {
  const calUsername = process.env.NEXT_PUBLIC_CAL_USERNAME ?? "luke-stamer";
  const calEventSlug = process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ?? "event-planning";
  const calLink = `${calUsername}/${calEventSlug}`;

  return (
    <>
      <Navbar forceBackground />
      <main className="min-h-dvh bg-background pt-6 pb-20 lg:pt-16 lg:pb-24">
        <SectionWrapper
          maxWidth="max-w-5xl"
          className="pt-6 pb-section-y md:pt-10 md:pb-section-y-md"
        >
          <div className="flex w-full flex-col items-center">
            <div className="mb-8 w-full max-w-2xl text-center mt-4 md:mb-10">
              <SectionHeader
                label=""
                heading="Let's chat about your event"
                alignment="center"
                className="mb-4"
              />
              <p className="mx-auto max-w-xl font-sans text-lg leading-relaxed text-foreground/60">
                Book a quick 10-minute consult to confirm fit and talk through the vision
                for your event.
              </p>
            </div>

            <div className="mb-12 w-full max-w-2xl">
              <details className="group rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] p-6 lg:hidden">
                <summary className="flex list-none items-center justify-between font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  <span>On our call, we&apos;ll cover:</span>
                  <ChevronDown className="h-5 w-5 text-foreground/50 transition-transform group-open:rotate-180" />
                </summary>
                <CallTopicsList className="mt-5 hidden group-open:block" />
              </details>

              <div className="hidden rounded-2xl border border-foreground/[0.06] bg-foreground/[0.02] p-6 lg:block">
                <p className="font-display text-lg font-semibold">
                  On our call, we&apos;ll cover:
                </p>
                <CallTopicsList className="mt-5" />
              </div>
            </div>

            <div className="mb-12 w-full max-w-2xl">
              <BookFlow calLink={calLink} />
            </div>

            <div className="flex w-full max-w-2xl flex-col items-center gap-2 text-center">
              <p className="font-sans text-sm text-foreground/50">
                Not ready to book a call yet?
              </p>
              <Link
                href="/#contact"
                className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/70"
              >
                Use the contact form instead
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </SectionWrapper>
      </main>
    </>
  );
}

function CallTopicsList({ className }: { className?: string }) {
  return (
    <ul
      className={cn("flex flex-col gap-4 font-sans text-sm text-foreground/70", className)}
    >
      {CALL_TOPICS.map((topic) => (
        <li key={topic.title} className="flex items-start gap-3">
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>
            <strong>{topic.title}</strong> {"\u2014"} {topic.description}
          </span>
        </li>
      ))}
    </ul>
  );
}
