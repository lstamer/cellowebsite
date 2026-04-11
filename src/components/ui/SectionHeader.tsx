import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

interface SectionHeaderProps {
  label: string;
  heading: ReactNode;
  className?: string;
  headingClassName?: string;
  labelClassName?: string;
  alignment?: "left" | "center";
}

export function SectionHeader({
  label,
  heading,
  className,
  headingClassName,
  labelClassName,
  alignment = "center",
}: SectionHeaderProps) {
  return (
    <div
      className={twMerge(
        clsx("mb-16 md:mb-20", alignment === "center" && "text-center flex flex-col items-center", alignment === "left" && "flex flex-col items-start", className)
      )}
    >
      <p className={twMerge(clsx("font-display text-foreground/80 text-sm tracking-widest uppercase mb-4 font-semibold border-l-2 border-accent pl-3", labelClassName))}>
        {label}
      </p>
      <h2 className={twMerge(clsx("font-serif italic text-4xl md:text-5xl lg:text-6xl text-primary tracking-tight leading-[1.05] text-balance", headingClassName))}>
        {heading}
      </h2>
    </div>
  );
}
