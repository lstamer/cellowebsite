import Link from "next/link";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Button({ href, children, variant = "primary", size = "md", className }: ButtonProps) {
  const baseStyles = "btn-magnetic inline-flex items-center justify-center rounded-full font-semibold transition-colors duration-300";
  
  const variants = {
    primary: "bg-primary text-on-dark hover:bg-primary/90",
    secondary: "bg-on-dark/10 text-on-dark border border-on-dark/20 hover:bg-on-dark/20",
    ghost: "bg-background text-primary hover:bg-background/90",
    white: "bg-background text-primary hover:bg-background/90 border border-primary/10"
  };

  const sizes = {
    sm: "text-sm px-[1.429em] py-[0.714em]",
    md: "text-lg px-[1.778em] py-[0.889em]",
    lg: "text-lg px-[2.222em] py-[1.111em]",
  };

  return (
    <Link
      href={href}
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
    >
      {children}
    </Link>
  );
}
