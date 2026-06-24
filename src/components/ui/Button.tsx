import Link from "next/link";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
  download?: boolean | string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
}

export function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  download,
  target,
  rel,
}: ButtonProps) {
  const baseStyles = "btn-magnetic inline-flex items-center justify-center rounded-full font-normal transition-colors duration-300";
  
  const variants = {
    primary: "bg-primary text-on-dark hover:bg-primary/90",
    secondary: "bg-on-dark/10 text-on-dark border border-on-dark/20 hover:bg-on-dark/20",
    ghost: "bg-background text-primary hover:bg-background/90",
    white: "bg-background text-primary hover:bg-background/90 border border-primary/10"
  };

  const sizes = {
    sm: "text-sm px-[1.429em] py-[0.714em]",
    md: "text-sm md:text-lg px-[1.429em] py-[0.714em] md:px-[1.778em] md:py-[0.889em]",
    lg: "text-base md:text-lg px-[1.5em] py-[0.75em] md:px-[2.222em] md:py-[1.111em]",
  };

  const classes = twMerge(clsx(baseStyles, variants[variant], sizes[size], className));

  // External / protocol links (WhatsApp wa.me, mailto:, tel:) render a native
  // anchor — next/link is for internal route navigation only.
  const isExternal = /^(https?:|mailto:|tel:|\/\/)/.test(href);
  if (isExternal) {
    return (
      <a href={href} download={download} target={target} rel={rel} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      download={download}
      target={target}
      rel={rel}
      className={classes}
    >
      {children}
    </Link>
  );
}
