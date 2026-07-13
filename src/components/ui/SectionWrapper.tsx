import { ReactNode, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

interface SectionWrapperProps {
  id?: string;
  children: ReactNode;
  className?: string;
  maxWidth?: "max-w-4xl" | "max-w-5xl" | "max-w-6xl" | "max-w-7xl" | "max-w-none";
  surface?: "background" | "cream" | "dark";
}

const surfaceClasses = {
  background:
    "relative isolate bg-background before:absolute before:inset-y-0 before:left-1/2 before:-z-10 before:w-screen before:-translate-x-1/2 before:bg-background",
  cream:
    "relative isolate bg-cream before:absolute before:inset-y-0 before:left-1/2 before:-z-10 before:w-screen before:-translate-x-1/2 before:bg-cream",
  dark:
    "relative isolate bg-surface-dark before:absolute before:inset-y-0 before:left-1/2 before:-z-10 before:w-screen before:-translate-x-1/2 before:bg-surface-dark",
} as const;

export const SectionWrapper = forwardRef<HTMLElement, SectionWrapperProps>(
  ({ id, children, className, maxWidth = "max-w-7xl", surface }, ref) => {
    return (
      <section
        id={id}
        ref={ref}
        className={twMerge(
          clsx(
            "py-section-y md:py-section-y-md px-section-x-sm md:px-section-x-md lg:px-section-x-lg mx-auto",
            maxWidth,
            surface && surfaceClasses[surface],
            className
          )
        )}
      >
        {children}
      </section>
    );
  }
);

SectionWrapper.displayName = "SectionWrapper";
