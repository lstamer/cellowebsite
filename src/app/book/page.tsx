"use client";

import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Navbar } from "@/components/Navbar";

export default function BookPage() {
  const calUsername = process.env.NEXT_PUBLIC_CAL_USERNAME ?? "your-cal-username";
  const calEventSlug = process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ?? "30min";
  const calLink = `${calUsername}/${calEventSlug}`;

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "booking" });
      cal("ui", {
        styles: {
          branding: {
            brandColor: "#2E4036",
          },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

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

        {/* Cal.com inline embed */}
        <div
          className="rounded-card overflow-hidden border border-foreground/10"
          style={{ minHeight: "600px" }}
        >
          {/*
            Cal.com inline embed renders inside this div.
            The data-cal-link must match your Cal.com username/event-slug.
            Update NEXT_PUBLIC_CAL_USERNAME and NEXT_PUBLIC_CAL_EVENT_SLUG in .env.local.
          */}
          <div
            data-cal-namespace="booking"
            data-cal-link={calLink}
            data-cal-config='{"layout":"month_view"}'
            style={{ width: "100%", height: "100%", minHeight: "600px" }}
          />
        </div>
      </SectionWrapper>
    </main>
    </>
  );
}
