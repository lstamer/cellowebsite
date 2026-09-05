"use client";

import { useEffect } from "react";

import { EmptyState, PageHeader } from "@/components/admin/ui";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Something broke" />
      <EmptyState
        title="This page could not load"
        body={error.message || "An unexpected error occurred."}
        action={
          <button type="button" onClick={reset} className="inline-flex min-h-10 items-center rounded-full bg-primary px-[1.25em] py-[0.5em] font-sans text-sm font-medium text-on-dark">
            Try again
          </button>
        }
      />
    </>
  );
}
