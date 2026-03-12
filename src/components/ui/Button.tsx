import Link from "next/link";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Button({ href, children, variant = "primary", size = "md", className }: ButtonProps) {
  const baseStyles = "btn-magnetic inline-flex items-center justify-center rounded-full font-semibold transition-colors duration-300";
  
  const variants = {
    primary: "bg-accent text-background hover:bg-accent/90",
    secondary: "bg-background/10 text-background border border-background/20 hover:bg-background/20",
    ghost: "bg-background text-primary hover:bg-background/90"
  };

  const sizes = {
    sm: "px-5 py-2.5 text-sm",
    md: "px-8 py-4 text-lg",
    lg: "px-10 py-5 text-lg"
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
