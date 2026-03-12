import { ReactNode, forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

interface SectionWrapperProps {
  id?: string;
  children: ReactNode;
  className?: string;
  maxWidth?: "max-w-5xl" | "max-w-7xl" | "max-w-none";
}

export const SectionWrapper = forwardRef<HTMLElement, SectionWrapperProps>(
  ({ id, children, className, maxWidth = "max-w-7xl" }, ref) => {
    return (
      <section
        id={id}
        ref={ref}
        className={twMerge(
          clsx(
            "py-section-y md:py-section-y-md px-section-x-sm md:px-section-x-md lg:px-section-x-lg mx-auto",
            maxWidth,
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
