import { twMerge } from "tailwind-merge";
import clsx from "clsx";

interface SectionHeaderProps {
  label: string;
  heading: React.ReactNode;
  className?: string;
  alignment?: "left" | "center";
}

export function SectionHeader({ label, heading, className, alignment = "center" }: SectionHeaderProps) {
  return (
    <div className={twMerge(clsx("mb-16", alignment === "center" && "text-center", className))}>
      <h2 className="font-display text-primary text-sm tracking-widest uppercase mb-4 font-bold">
        {label}
      </h2>
      <p className="font-serif italic text-4xl md:text-5xl text-foreground">
        {heading}
      </p>
    </div>
  );
}
