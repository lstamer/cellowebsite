"use client";

import { Button } from "react-aria-components";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-xl">
      <p className="font-jost text-xs font-semibold uppercase tracking-[0.18em] text-accent">Something broke</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">This page could not load</h1>
      <p className="mt-4 font-sans text-base leading-relaxed text-foreground/70">
        Usually a database call failed. The message below is also in the console, and the health page shows whether Supabase is reachable.
      </p>
      <pre className="mt-4 overflow-x-auto rounded-input border border-foreground/10 bg-background p-4 font-mono text-xs text-foreground/70">{error.message}{error.digest ? `\n\ndigest ${error.digest}` : ""}</pre>
      <Button onPress={reset} className="mt-6 inline-flex min-h-11 items-center rounded-full bg-cream px-[1.25em] py-[0.6em] font-sans text-sm font-medium text-primary hover:bg-primary/90 hover:text-on-dark">
        Try again
      </Button>
    </div>
  );
}
