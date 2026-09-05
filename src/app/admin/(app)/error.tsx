"use client";

import { Button } from "react-aria-components";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-xl">
      <p className="font-jost text-[0.6875rem] uppercase tracking-[0.22em] text-on-dark/50">Something broke</p>
      <h1 className="mt-1 font-serif text-4xl italic leading-none">This page could not load</h1>
      <p className="mt-4 font-sans text-base leading-relaxed text-on-dark/70">
        Usually a database call failed. The message below is also in the console, and the health page shows whether Supabase is reachable.
      </p>
      <pre className="mt-4 overflow-x-auto rounded-input border border-on-dark/10 bg-surface-dark p-4 font-mono text-xs text-on-dark/80">{error.message}{error.digest ? `\n\ndigest ${error.digest}` : ""}</pre>
      <Button onPress={reset} className="mt-6 inline-flex min-h-11 items-center rounded-full bg-cream px-[1.25em] py-[0.6em] font-sans text-sm font-medium text-primary hover:bg-on-dark">
        Try again
      </Button>
    </div>
  );
}
