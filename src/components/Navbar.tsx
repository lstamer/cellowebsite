"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav
        className={twMerge(
          "flex items-center justify-between px-6 py-4 rounded-full transition-all duration-500 w-full max-w-5xl",
          isScrolled
            ? "bg-background/80 backdrop-blur-xl border border-primary/10 text-primary shadow-sm"
            : "bg-transparent text-background"
        )}
      >
        <Link href="/" className="text-xl font-display font-bold tracking-tight">
          Stamer
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="#about" className="link-hover opacity-80 hover:opacity-100">About</Link>
          <Link href="#services" className="link-hover opacity-80 hover:opacity-100">Services</Link>
          <Link href="#experience" className="link-hover opacity-80 hover:opacity-100">Experience</Link>
        </div>

        <Button
          href="#contact"
          variant={isScrolled ? "primary" : "ghost"}
          size="sm"
        >
          Book a call
        </Button>
      </nav>
    </header>
  );
}
