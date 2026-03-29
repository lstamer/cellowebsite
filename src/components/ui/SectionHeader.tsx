import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

interface SectionHeaderProps {
  label: string;
  heading: ReactNode;
  className?: string;
  alignment?: "left" | "center";
}

export function SectionHeader({
  label,
  heading,
  className,
  alignment = "center",
}: SectionHeaderProps) {
  return (
    <div
      className={twMerge(
        clsx("mb-16", alignment === "center" && "text-center", className)
      )}
    >
      <p className="font-display text-primary text-sm tracking-widest uppercase mb-4 font-bold">
        {label}
      </p>
      <h2 className="font-serif italic text-4xl md:text-5xl text-foreground">
        {heading}
      </h2>
    </div>
  );
}
