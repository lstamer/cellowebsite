import { SectionWrapper } from "@/components/ui/SectionWrapper";

export function BelowFoldSectionSkeleton() {
  return (
    <SectionWrapper className="min-h-[28rem] bg-foreground/5" aria-hidden>
      <span className="sr-only">Loading section</span>
    </SectionWrapper>
  );
}
