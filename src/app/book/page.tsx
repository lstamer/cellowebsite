import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Navbar } from "@/components/Navbar";
import { CalEmbed } from "@/components/CalEmbed";

export default function BookPage() {
  const calUsername = process.env.NEXT_PUBLIC_CAL_USERNAME ?? "your-cal-username";
  const calEventSlug = process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ?? "30min";
  const calLink = `${calUsername}/${calEventSlug}`;

  return (
    <>
      <Navbar forceBackground />
      <main className="bg-background min-h-screen pt-24">
      <SectionWrapper maxWidth="max-w-5xl">
        <div className="mb-16">
          <SectionHeader
            label="Schedule a call"
            heading="Find a time that works."
            alignment="left"
          />
          <p className="mt-4 font-sans text-lg text-foreground/60 max-w-lg">
            Book a free 30-minute call to discuss your event, lessons, or any questions you have.
          </p>
        </div>

        <CalEmbed calLink={calLink} />
      </SectionWrapper>
    </main>
    </>
  );
}
