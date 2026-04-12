"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Star } from "lucide-react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface TestimonialData {
  quote: string;
  name: string;
  descriptor: string;
  image: string;
}

const testimonials: TestimonialData[] = [
  {
    quote: "The music transformed our ceremony into something out of a film. It was the exact atmosphere we dreamed of.",
    name: "Elena & James",
    descriptor: "Wedding Clients",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
  },
  {
    quote: "Our guests are still talking about it. The performance was the highlight of the entire evening.",
    name: "Thomas & Claire",
    descriptor: "Wedding Clients",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  },
  {
    quote: "From the first consultation to the final bow, working with Stamer was effortless and extraordinary.",
    name: "Amara & Liam",
    descriptor: "Wedding Clients",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
];

function StarRating({ className }: { className?: string }) {
  return (
    <div className={twMerge(clsx("flex gap-0.5", className))}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} fill="currentColor" className="w-4 h-4 text-accent" />
      ))}
    </div>
  );
}

function DesktopCard({ t }: { t: TestimonialData }) {
  return (
    <div className="desktop-card bg-white rounded-2xl p-8 border border-foreground/5 shadow-card hover:shadow-card-hover transition-shadow duration-300 h-full flex flex-col justify-between">
      <div>
        <StarRating className="mb-6" />
        <p className="font-sans text-[0.95rem] leading-relaxed text-foreground/80 mb-6 font-medium">
          &quot;{t.quote}&quot;
        </p>
      </div>
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover shrink-0 bg-primary/10" />
        <div>
          <p className="font-display font-bold text-sm text-foreground leading-tight">{t.name}</p>
          <p className="font-sans text-xs text-foreground/50 mt-0.5">{t.descriptor}</p>
        </div>
      </div>
    </div>
  );
}

export function WeddingAuthority() {
  const outerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const triggerStart = "top 80%";
      
      gsap.from(".desktop-col", {
        scrollTrigger: {
          trigger: ".desktop-cards-grid",
          start: triggerStart,
          once: true,
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
      });

    },
    { scope: outerRef }
  );

  return (
    <div ref={outerRef} id="testimonials" className="w-full py-24 bg-background">
      <SectionWrapper maxWidth="max-w-6xl">
        <div className="text-center mb-16">
          <p className="font-mono text-xs tracking-[0.2em] font-bold uppercase text-primary/50 mb-4">
            Trusted by couples
          </p>
          <h2 className="font-serif italic text-4xl sm:text-5xl text-foreground text-balance">
            Don&apos;t take our word for it. See what{" "}
            <HandDrawnUnderline variant={2}>customers</HandDrawnUnderline> are
            saying about us.
          </h2>
        </div>

        <div className="desktop-cards-grid grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-8 items-stretch">
          {testimonials.map((t, i) => (
            <div key={i} className="desktop-col">
              <DesktopCard t={t} />
            </div>
          ))}
        </div>
      </SectionWrapper>
    </div>
  );
}
