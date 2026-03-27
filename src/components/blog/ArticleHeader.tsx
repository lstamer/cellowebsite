"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface ArticleHeaderProps {
  title: string;
  category?: string;
  formattedDate: string;
  readingTime: number;
  imageUrl?: string;
  imageAlt?: string;
}

export function ArticleHeader({
  title,
  category,
  formattedDate,
  readingTime,
  imageUrl,
  imageAlt,
}: ArticleHeaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(".article-header-el", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: "power3.out",
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef}>
      <Link
        href="/blog"
        className="article-header-el inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-foreground/40 hover:text-accent transition-colors mb-12"
      >
        &larr; Back to Journal
      </Link>

      <header className="mb-16">
        {category && (
          <div className="article-header-el mb-6">
            <span className="font-mono text-sm uppercase tracking-widest text-accent font-medium bg-accent/10 py-1 px-3 rounded-full">
              {category}
            </span>
          </div>
        )}

        <h1 className="article-header-el font-serif italic text-5xl md:text-7xl lg:text-8xl text-foreground leading-[1.1] tracking-tight mb-8">
          {title}
        </h1>

        <div className="article-header-el flex items-center gap-6 text-foreground/50">
          <div className="flex items-center gap-4 border-l-2 border-accent pl-4">
            <div className="flex flex-col">
              <span className="font-sans font-medium text-foreground">
                Lukas Stamer
              </span>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="font-mono text-xs text-foreground/40">
                  {formattedDate}
                </span>
                <span className="text-foreground/20">&middot;</span>
                <span className="font-mono text-xs text-foreground/40">
                  {readingTime} min read
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {imageUrl && (
        <div className="article-header-el relative w-full aspect-[21/9] md:aspect-[16/9] mb-20 rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src={imageUrl}
            alt={imageAlt || "Article image"}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/10 via-transparent to-transparent" />
        </div>
      )}
    </div>
  );
}
