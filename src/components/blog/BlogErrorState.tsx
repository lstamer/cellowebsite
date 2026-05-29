"use client";

import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

interface BlogErrorStateProps {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  onRetry?: () => void;
}

export function BlogErrorState({
  title,
  description,
  actionHref,
  actionLabel,
  onRetry,
}: BlogErrorStateProps) {
  return (
    <main className="bg-background min-h-dvh pt-24">
      <SectionWrapper maxWidth="max-w-5xl">
        <div className="overflow-hidden rounded-card border border-primary/10 bg-background shadow-card">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="px-8 py-12 md:px-12 md:py-16">
              <SectionHeader
                label="Journal Recovery"
                heading={title}
                alignment="left"
                className="mb-10"
              />

              <p className="max-w-2xl font-sans text-lg leading-relaxed text-foreground/80">
                {description}
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Button href={actionHref}>{actionLabel}</Button>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center justify-center rounded-full border border-primary/10 bg-background px-8 py-4 font-display text-lg font-semibold text-primary transition-colors duration-300 hover:bg-primary/5"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-between bg-surface-dark px-8 py-12 text-on-dark md:px-10 md:py-16">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-on-dark/60">
                  What happened
                </p>
                <p className="mt-4 font-serif text-3xl italic leading-tight">
                  One piece of publishing data arrived in an unexpected shape.
                </p>
              </div>

              <div className="mt-12 border-t border-on-dark/10 pt-8">
                <p className="font-sans text-sm leading-relaxed text-on-dark/70">
                  The page is now set up to recover gracefully, but this fallback keeps
                  the journal usable whenever content or rendering fails unexpectedly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </main>
  );
}
