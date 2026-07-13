import { SectionWrapper } from "@/components/ui/SectionWrapper";

export function BelowFoldSectionSkeleton() {
  return (
    <SectionWrapper className="min-h-[28rem] bg-cream" aria-hidden>
      <span className="sr-only">Loading section</span>
    </SectionWrapper>
  );
}
