"use client";

import { useEffect } from "react";
import { getCalApi } from "@calcom/embed-react";

interface CalEmbedProps {
  calLink: string;
}

export function CalEmbed({ calLink }: CalEmbedProps) {
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
    <div
      className="rounded-card overflow-hidden border border-foreground/10"
      style={{ minHeight: "600px" }}
    >
      <div
        data-cal-namespace="booking"
        data-cal-link={calLink}
        data-cal-config='{"layout":"month_view"}'
        style={{ width: "100%", height: "100%", minHeight: "600px" }}
      />
    </div>
  );
}
