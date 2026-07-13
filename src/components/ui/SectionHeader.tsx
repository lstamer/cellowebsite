import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  label: string;
  heading: ReactNode;
  className?: string;
  headingClassName?: string;
  labelClassName?: string;
  alignment?: "left" | "center";
  /** Heading element — use "h1" when the header is the page's top-level heading. */
  as?: "h1" | "h2" | "h3";
}

export function SectionHeader({
  label,
  heading,
  className,
  headingClassName,
  labelClassName,
  alignment = "center",
  as: HeadingTag = "h2",
}: SectionHeaderProps) {
  return (
    <div
      className={cn("mb-16 md:mb-20", alignment === "center" && "text-center flex flex-col items-center", alignment === "left" && "flex flex-col items-start", className)}
    >
      <p className={cn("font-jost text-foreground/70 text-sm tracking-widest mb-4 font-semibold border-l-2 border-accent pl-3", labelClassName)}>
        {label}
      </p>
      <HeadingTag className={cn("font-serif italic text-4xl md:text-5xl lg:text-6xl text-primary tracking-tight leading-[1.05] text-balance", headingClassName)}>
        {heading}
      </HeadingTag>
    </div>
  );
}
