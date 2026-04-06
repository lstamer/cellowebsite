"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";

interface CalEmbedProps {
  calLink: string;
  config?: Record<string, unknown>;
}

export function CalEmbed({ calLink, config = {} }: CalEmbedProps) {
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
      <Cal
        namespace="booking"
        calLink={calLink}
        style={{ width: "100%", height: "100%", minHeight: "600px" }}
        config={{
          layout: "month_view",
          ...config,
        }}
      />
    </div>
  );
}
