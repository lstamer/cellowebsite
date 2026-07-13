import { SectionWrapper } from "@/components/ui/SectionWrapper";

export function BelowFoldSectionSkeleton() {
  return (
    <SectionWrapper surface="cream" className="min-h-[28rem]" aria-hidden>
      <span className="sr-only">Loading section</span>
    </SectionWrapper>
  );
}
