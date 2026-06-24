"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/utils";

/** Photo order drives the carousel counter and adjacent image peeks. */
const ABOUT_PHOTOS = [
  {
    src: "/images/about/concerthallfinal.jpg",
    alt: "Luke Stamer soloing with a school orchestra",
    imageClassName: "object-cover object-center grayscale-[15%] rounded-none",
  },
  {
    src: "/images/about/luke-stage-lights.png",
    alt: "Luke Stamer performing cello in a white shirt on a warmly lit stage",
    imageClassName: "object-cover object-center grayscale-[15%] rounded-none",
  },
  {
    src: "/images/about/luke-event-lights.png",
    alt: "Luke Stamer performing cello beneath colourful Confluence event lights",
    imageClassName: "object-cover object-center grayscale-[20%] rounded-none",
  },
  {
    src: "/images/about/luke-garden-cello.png",
    alt: "Luke Stamer playing cello outdoors in a white suit",
    imageClassName: "object-cover object-center grayscale-[20%] rounded-none",
  },
  {
    src: "/images/about/crowd.jpg",
    alt: "Luke Stamer performing cello for an audience in a public venue",
    imageClassName: "object-cover object-center grayscale-[15%] rounded-none",
  },
] as const;

const ABOUT_STATS = [
  {
    value: "12",
    label: "Years of experience",
  },
  {
    value: "ATCL",
    label: "Professionally qualified",
  },
  {
    value: "0",
    label: "Negative reviews, ever",
  },
] as const;

const ABOUT_PHOTO_COUNT = ABOUT_PHOTOS.length;

/**
 * One shared `sizes` for every slot (center + side peeks). Next/Image derives the
 * optimized URL (`?w=`) from `sizes`, so a single value means each photo resolves
 * to ONE optimized variant regardless of which slot it occupies. Promoting a side
 * peek into the center is then a browser-cache hit instead of a cold Vercel image
 * optimization (the AVIF transcode that left a stale "duplicate" frame on swap).
 */
const ABOUT_PHOTO_SIZES = "(max-width: 768px) 72vw, 28vw";

function getWrappedPhotoIndex(index: number) {
  return (index + ABOUT_PHOTO_COUNT) % ABOUT_PHOTO_COUNT;
}

export function About() {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef(1);
  const [activeIndex, setActiveIndex] = useState(2);

  const previousIndex = getWrappedPhotoIndex(activeIndex - 1);
  const nextIndex = getWrappedPhotoIndex(activeIndex + 1);
  const activePhoto = ABOUT_PHOTOS[activeIndex];
  const previousPhoto = ABOUT_PHOTOS[previousIndex];
  const nextPhoto = ABOUT_PHOTOS[nextIndex];

  useGSAP(
    () => {
      // Text fade in
      gsap.fromTo(
        ".about-text",
        { y: 40, autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
            once: true,
          },
          y: 0,
          autoAlpha: 1,
          duration: 1,
          stagger: 0.15,
          ease: "power3.out",
        }
      );

      if (!carouselRef.current) return;

      gsap.fromTo(
        carouselRef.current,
        { y: 32, scale: 0.96, autoAlpha: 0 },
        {
          scrollTrigger: {
            trigger: carouselRef.current,
            start: "top 85%",
            once: true,
          },
          y: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 0.9,
          ease: "power3.out",
        }
      );
    },
    { scope: containerRef }
  );

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-about-carousel-card]");
      if (!cards.length) return;

      gsap.killTweensOf(cards);
      gsap.fromTo(
        cards,
        { y: directionRef.current * 18, scale: 0.98, autoAlpha: 0 },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          duration: 0.55,
          stagger: {
            each: 0.05,
            from: "center",
          },
          ease: "power3.out",
          overwrite: "auto",
        }
      );
    },
    { dependencies: [activeIndex], scope: carouselRef }
  );

  const goToPreviousPhoto = () => {
    directionRef.current = -1;
    setActiveIndex((currentIndex) => getWrappedPhotoIndex(currentIndex - 1));
  };

  const goToNextPhoto = () => {
    directionRef.current = 1;
    setActiveIndex((currentIndex) => getWrappedPhotoIndex(currentIndex + 1));
  };

  const goToPhoto = (index: number) => {
    if (index === activeIndex) return;
    directionRef.current = index > activeIndex ? 1 : -1;
    setActiveIndex(index);
  };

  return (
    <div className="bg-cream">
    <SectionWrapper id="about" ref={containerRef}>
      <div className="grid grid-cols-1 items-center gap-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-x-20">
        {/* 1 — Section header: first on mobile, left-col row-1 on desktop */}
        <div className="max-w-md md:mx-auto md:max-w-2xl lg:mx-0 lg:max-w-md">
          <div className="about-text gsap-reveal mb-0">
            <SectionHeader
              label="About me"
              heading="Hi, I'm Luke"
              alignment="left"
              className="mb-0 md:mb-0 md:items-center md:text-center lg:items-start lg:text-left"
              labelClassName="md:border-l-0 md:pl-0 lg:border-l-2 lg:pl-3"
            />
          </div>
        </div>

        {/* 2 — Image carousel: second on mobile, right-col spanning both rows on desktop */}
        <div
          ref={carouselRef}
          className="about-grid gsap-reveal relative mx-auto mt-8 w-full max-w-[24rem] overflow-visible py-0 sm:max-w-[31rem] lg:row-span-2 lg:mt-0 lg:self-center lg:ml-auto lg:max-w-[42rem] lg:translate-x-8 lg:py-4"
        >
          {/*
            Cache warmer: renders every photo once at the shared `sizes`, so all
            optimized variants are fetched as soon as the section enters view.
            After this, navigating the carousel is always a browser-cache hit —
            no cold Vercel transcode, so no stale "duplicate" frame on swap.
          */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute h-px w-px -z-10 overflow-hidden opacity-0"
          >
            {ABOUT_PHOTOS.map((photo) => (
              <div key={photo.src} className="relative h-px w-px">
                <Image src={photo.src} alt="" fill sizes={ABOUT_PHOTO_SIZES} />
              </div>
            ))}
          </div>

          <div className="relative mx-auto flex h-[25rem] w-full max-w-[19.5rem] items-center justify-center overflow-visible sm:max-w-none sm:h-[31rem] lg:h-[34rem]">
            <div
              className="absolute left-0 top-1/2 z-[1] h-[17rem] w-[10.5rem] -translate-y-1/2 -rotate-[8deg] overflow-hidden sm:h-[22rem] sm:w-[14rem] lg:left-[0.5rem] lg:h-[26rem] lg:w-[16.5rem]"
              aria-hidden="true"
            >
              <div
                className="relative h-full w-full overflow-hidden rounded-none shadow-card"
                data-about-carousel-card="previous"
              >
                <Image
                  src={previousPhoto.src}
                  alt=""
                  fill
                  className="rounded-none object-cover object-center grayscale-[20%]"
                  sizes={ABOUT_PHOTO_SIZES}
                />
              </div>
            </div>

            <div
              className="absolute right-0 top-1/2 z-[1] h-[17rem] w-[10.5rem] -translate-y-1/2 rotate-[8deg] overflow-hidden sm:h-[22rem] sm:w-[14rem] lg:right-[0.5rem] lg:h-[26rem] lg:w-[16.5rem]"
              aria-hidden="true"
            >
              <div
                className="relative h-full w-full overflow-hidden rounded-none shadow-card"
                data-about-carousel-card="next"
              >
                <Image
                  src={nextPhoto.src}
                  alt=""
                  fill
                  className="rounded-none object-cover object-center grayscale-[20%]"
                  sizes={ABOUT_PHOTO_SIZES}
                />
              </div>
            </div>

            <div className="relative z-[3]">
              <button
                type="button"
                onClick={goToPreviousPhoto}
                className="absolute left-[-1.375rem] top-1/2 z-[5] flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center rounded-full border border-primary bg-primary text-on-dark transition-colors duration-300 md:h-[48px] md:w-[48px] md:hover:border-on-dark md:hover:bg-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Show previous About image"
              >
                <ChevronLeft className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>

              <div
                className="relative h-[21.5rem] w-[min(72vw,18rem)] overflow-hidden rounded-none shadow-card sm:h-[27rem] sm:w-[22rem] lg:h-[31rem] lg:w-[25rem]"
                data-about-carousel-card="active"
              >
                <Image
                  src={activePhoto.src}
                  alt={activePhoto.alt}
                  fill
                  className={activePhoto.imageClassName}
                  sizes={ABOUT_PHOTO_SIZES}
                  priority={activeIndex === 2}
                />
              </div>

              <button
                type="button"
                onClick={goToNextPhoto}
                className="absolute right-[-1.375rem] top-1/2 z-[5] flex h-[44px] w-[44px] -translate-y-1/2 items-center justify-center rounded-full border border-primary bg-primary text-on-dark transition-colors duration-300 md:h-[48px] md:w-[48px] md:hover:border-on-dark md:hover:bg-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Show next About image"
              >
                <ChevronRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center gap-3" aria-label="About image carousel pagination">
              {ABOUT_PHOTOS.map((photo, index) => (
                <button
                  key={photo.src}
                  type="button"
                  onClick={() => goToPhoto(index)}
                  className={cn(
                    "h-[8px] w-[8px] rounded-full border border-primary/40 bg-background transition-colors duration-300 hover:border-primary",
                    index === activeIndex && "border-primary bg-primary"
                  )}
                  aria-label={`Show About image ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 3 — Body text + stats: third on mobile, left-col row-2 on desktop */}
        <div className="max-w-md md:mx-auto md:max-w-2xl lg:mx-0 lg:max-w-md">
          <hr
            className="about-text gsap-reveal my-10 h-px w-full shrink-0 border-0 bg-foreground/15 md:mx-auto md:max-w-xl lg:mx-0 lg:max-w-none"
            aria-hidden="true"
          />
          <div className="about-text gsap-reveal space-y-6 text-left font-sans text-lg leading-relaxed text-foreground/80 md:mx-auto md:max-w-xl md:text-center lg:mx-0 lg:max-w-none lg:text-left">
            <p>
              I&apos;m a Cape Town cellist — classically trained, modern ear, and a bit of a rebellious streak. I was soloing at the Cape Town City Hall before I&apos;d finished high school, and I&apos;ve been playing everywhere from concert halls to wedding aisles ever since.
            </p>
            <p>
              What I&apos;m really after is closing the gap between a classical instrument and people who don&apos;t think they like classical music. I play for the moments that matter most — weddings, milestones, evenings people think back to for decades — because the music is usually the thing they remember first.
            </p>
          </div>
          <dl className="about-text gsap-reveal mt-10 grid w-full grid-cols-3 md:mx-auto md:max-w-xl lg:mx-0 lg:max-w-none">
            {ABOUT_STATS.map((stat, index) => (
              <div
                key={stat.value}
                className={cn(
                  "flex flex-col items-center px-0 py-5 pr-4 sm:pr-6 lg:items-start",
                  index !== 0 && "border-l border-primary/20 pl-4 sm:pl-6"
                )}
              >
                <dt className="text-center font-display font-bold text-2xl text-primary lg:text-left lg:text-3xl xl:text-4xl">
                  {stat.value}
                </dt>
                <dd className="mt-1 block max-w-[7rem] text-center font-sans text-sm leading-snug text-foreground/60 lg:text-left">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </SectionWrapper>
    </div>
  );
}
