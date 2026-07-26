"use client";

import { useRef } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { Star } from "lucide-react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface TestimonialData {
  quote: string;
  name: string;
  descriptor: string;
  initials: string;
  image: string;
}

const testimonials: TestimonialData[] = [
  {
    quote:
      "I was blown away\u2026 the guests couldn\u2019t stop talking about the cello. I will recommend Luke any time to anyone. Bless him and his talent as he continues to live his gift out at other venues \uD83D\uDE4F",
    name: "Violet Gordon",
    descriptor: "Kirstenhof SAPS",
    initials: "VG",
    image: "/images/testimonials/violet-gordon.jpeg",
  },
  {
    quote:
      "You are so talented, Luke! I come from a family of musicians, and have never heard the cello played the way you play it. Will definitely be using you in the future",
    name: "Louise Hill",
    descriptor: "Event Manager",
    initials: "LH",
    image: "/images/testimonials/louise-hill.jpeg",
  },
  {
    quote:
      "A friend of mine recommended Luke for a celebration for our faculty, and I could not be happier. His performance was lively, captivating, and absolutely wowed the attendees.",
    name: "Organiser",
    descriptor: "University of Stellenbosch",
    initials: "US",
    image: "/images/testimonials/organiser-stellenbosch.jpeg",
  },
  {
    quote:
      "We met Luke at Cavendish and hired him for our wedding in April. He went above and beyond with including all of our favourite songs in his setlist. It was truly special - thank you Luke!",
    name: "Sophie & Bart",
    descriptor: "Wedding in Franschhoek",
    initials: "SB",
    image: "/images/testimonials/sophie-and-bart.jpeg",
  },
  {
    quote:
      "We had a very sentimental farewell for our COO, and Luke’s cello playing made for a more special night than I could've hoped for.",
 
    name: "Marcus Reed",
    descriptor: "Hotel Client",
    initials: "MR",
    image: "/images/testimonials/marcus-reed.jpeg",
  },
  {
    quote:
      "From our first interaction, working with Luke was effortless and professional. He handled our requests and mitigated a lot of the stress from planning our wedding.",
    name: "Amara & Liam",
    descriptor: "Wedding Clients",
    initials: "AL",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
];

interface CardPosition {
  align: string;
  offset: string;
  rotate: string;
  mt: string;
  z: string;
}

// Single-column layout (< md); sm offsets ~15% tighter than base
const mobilePositions: CardPosition[] = [
  {
    align: "self-start",
    offset: "ml-2 sm:ml-1.5",
    rotate: "-rotate-2",
    mt: "",
    z: "z-[6]",
  },
  {
    align: "self-end",
    offset: "mr-4 sm:mr-3.5",
    rotate: "rotate-3",
    mt: "-mt-8",
    z: "z-[5]",
  },
  {
    align: "self-start",
    offset: "ml-8 sm:ml-7",
    rotate: "rotate-1",
    mt: "-mt-5",
    z: "z-[4]",
  },
  {
    align: "self-end",
    offset: "mr-1 sm:mr-0.5",
    rotate: "-rotate-2",
    mt: "-mt-6",
    z: "z-[3]",
  },
  {
    align: "self-start",
    offset: "ml-4 sm:ml-3.5",
    rotate: "-rotate-1",
    mt: "-mt-4",
    z: "z-[2]",
  },
  {
    align: "self-end",
    offset: "mr-6 sm:mr-5",
    rotate: "rotate-2",
    mt: "-mt-5",
    z: "z-[1]",
  },
];

// Two-column layout (md+); tighter offsets on md, full spread at lg
const leftColPositions: CardPosition[] = [
  {
    align: "self-start",
    offset: "ml-2 md:ml-4 lg:ml-8",
    rotate: "-rotate-2",
    mt: "",
    z: "z-[3]",
  },
  {
    align: "self-end",
    offset: "mr-4 md:mr-6 lg:mr-10",
    rotate: "rotate-3",
    mt: "-mt-8 md:-mt-[1.67rem] lg:-mt-8",
    z: "z-[2]",
  },
  {
    align: "self-start",
    offset: "ml-4 md:ml-6 lg:ml-12",
    rotate: "rotate-1",
    mt: "-mt-6 md:-mt-5 lg:-mt-6",
    z: "z-[1]",
  },
];

const rightColPositions: CardPosition[] = [
  {
    align: "self-end",
    offset: "mr-2 md:mr-4 lg:mr-8",
    rotate: "-rotate-2",
    mt: "",
    z: "z-[3]",
  },
  {
    align: "self-start",
    offset: "ml-4 md:ml-6 lg:ml-10",
    rotate: "-rotate-1",
    mt: "-mt-8 md:-mt-[1.67rem] lg:-mt-8",
    z: "z-[2]",
  },
  {
    align: "self-end",
    offset: "mr-4 md:mr-6 lg:mr-12",
    rotate: "rotate-2",
    mt: "-mt-6 md:-mt-5 lg:-mt-6",
    z: "z-[1]",
  },
];

function StarRating({ className }: { className?: string }) {
  return (
    <div className={twMerge(clsx("flex gap-0.5", className))}>
      <span className="sr-only">Rated 5 out of 5 stars</span>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} fill="currentColor" className="w-4 h-4 text-accent" />
      ))}
    </div>
  );
}

interface ScatteredCardProps {
  t: TestimonialData;
  pos: CardPosition;
  className?: string;
}

function ScatteredCard({ t, pos, className }: ScatteredCardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "relative",
          pos.align,
          pos.offset,
          pos.mt,
          pos.z,
          pos.rotate,
          className
        )
      )}
    >
      <div className="absolute inset-0 rounded-card border border-foreground/10 shadow-card bg-background" />
      <div className="relative p-4 md:p-5 lg:p-6">
        <StarRating className="mb-3" />
        <span className="font-serif text-4xl leading-none text-foreground/15 select-none block -mb-2">
          &ldquo;
        </span>
        <p className="font-sans text-sm sm:text-base lg:text-lg leading-relaxed text-foreground text-pretty">
          {t.quote}
        </p>
        <div className="mt-4 pt-4 border-t border-foreground/10">
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 lg:w-9 lg:h-9 rounded-full overflow-hidden shrink-0">
              <Image
                src={t.image}
                alt={t.name}
                width={36}
                height={36}
                sizes="36px"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="font-display font-bold text-sm lg:text-base text-foreground/80 leading-tight">
                {t.name}
              </p>
              <p className="font-sans text-xs lg:text-sm text-foreground/70">
                {t.descriptor}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const outerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const isMobile = window.innerWidth < 768;

      gsap.fromTo(
        ".testimonials-heading",
        { y: 30, opacity: 0 },
        {
          scrollTrigger: {
            trigger: "#testimonials",
            start: "top 85%",
            once: true,
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );

      if (isMobile) {
        gsap.fromTo(
          ".mobile-card-wrapper",
          { y: 30, opacity: 0 },
          {
            scrollTrigger: {
              trigger: ".mobile-cards-container",
              start: "top 80%",
              once: true,
            },
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.1,
            ease: "power3.out",
          }
        );
      } else {
        gsap.fromTo(
          ".desktop-col",
          { y: 40, opacity: 0 },
          {
            scrollTrigger: {
              trigger: ".desktop-cards-container",
              start: "top 75%",
              once: true,
            },
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.2,
            ease: "power3.out",
          }
        );
      }
    },
    { scope: outerRef }
  );

  return (
    <div ref={outerRef} id="testimonials">
      <SectionWrapper>
        {/* Heading */}
        <SectionHeader
          label="In their words"
          heading={<>Don&apos;t take my word for it</>}
          alignment="center"
          className="testimonials-heading gsap-reveal mb-10 md:mb-10 lg:mb-16"
          labelClassName="uppercase"
          headingClassName="text-3xl sm:text-4xl md:text-4xl lg:text-5xl text-foreground tracking-normal"
        />

        {/* Mobile: single-column scattered pile */}
        <div className="mobile-cards-container flex flex-col px-2 sm:mx-auto sm:w-[85%] md:hidden">
          {testimonials.map((t, i) => (
            <ScatteredCard
              key={i}
              t={t}
              pos={mobilePositions[i]}
              className="mobile-card-wrapper gsap-reveal w-[72%] max-w-[17rem]"
            />
          ))}
        </div>

        {/* Tablet / desktop: two scattered columns */}
        <div className="desktop-cards-container hidden md:flex md:items-start md:gap-6 lg:gap-8 xl:gap-12">
          <div className="desktop-col gsap-reveal flex flex-col flex-1">
            {testimonials.slice(0, 3).map((t, i) => (
              <ScatteredCard
                key={i}
                t={t}
                pos={leftColPositions[i]}
                className="md:w-[81%] lg:w-[75%]"
              />
            ))}
          </div>
          <div className="desktop-col gsap-reveal flex flex-col flex-1 md:mt-12 lg:mt-16">
            {testimonials.slice(3, 6).map((t, i) => (
              <ScatteredCard
                key={i}
                t={t}
                pos={rightColPositions[i]}
                className="md:w-[81%] lg:w-[75%]"
              />
            ))}
          </div>
        </div>

        {/* Proof line */}
        <div className="mt-16 lg:mt-20 lg:pt-16 lg:border-t lg:border-foreground/10">
          <p className="font-sans mx-auto max-w-2xl text-center text-lg leading-relaxed text-foreground/70 text-pretty">
            Twelve years, about 6,500 hours of playing, and still not a single
            bad review — I&apos;d like to keep it that way.
          </p>
        </div>
      </SectionWrapper>
    </div>
  );
}
