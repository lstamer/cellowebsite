import { CalendarCheck, MessagesSquare, Music2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { FAQAccordion } from "@/components/ui/FAQAccordion";
import { FAQJsonLd } from "@/components/ui/FAQJsonLd";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";
import { HotelAuditionSteps } from "@/components/hotels/HotelAuditionSteps";
import { HotelTestimonial } from "@/components/hotels/HotelTestimonial";
import { PUBLIC_EMAIL } from "@/lib/email";
import { PUBLIC_WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";

const auditionMessage =
  "Hi Luke, I'd love to explore recurring live cello for our hotel or estate. Could we arrange a private audition for our team?";
const auditionHref = `https://wa.me/${PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(auditionMessage)}`;
const emailHref = `mailto:${PUBLIC_EMAIL}?subject=${encodeURIComponent("Live cello for our hotel or estate")}&body=${encodeURIComponent(auditionMessage)}`;
const focusClass =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";
const photoBackingClass =
  "pointer-events-none absolute inset-0 -z-10 translate-x-1.5 translate-y-3 motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:scale-105 md:translate-x-3";
const photoZoomClass =
  "motion-safe:transition-transform motion-safe:duration-1000 motion-safe:ease-out motion-safe:group-hover:scale-105";

const fitDetails = [
  {
    title: "A sound of your own",
    body: "I get to know your space and what your guests respond to. The music starts to feel like part of your property.",
    icon: Music2,
  },
  {
    title: "Room for conversation",
    body: "I adjust the volume, repertoire and energy to the room. Guests can enjoy the music and still hear the person across the table. Your service keeps its rhythm.",
    icon: MessagesSquare,
  },
  {
    title: "Less to explain each time",
    body: "We agree on dates, setup and timings in advance. I reserve those dates and personally play each agreed event. As I get to know your team, the familiar details stay handled.",
    icon: CalendarCheck,
  },
];

const hotelFaqs = [
  {
    question: "How often would you come?",
    answer:
      "Twice a month, weekly in peak season, or around an existing series of events are all possibilities. We choose a rhythm that suits your guests and calendar, then agree the dates in advance. The point is to return often enough to learn what works and build on it.",
  },
  {
    question: "Where could the music fit?",
    answer:
      "Sundowners on the terrace, an afternoon in the lounge, dinner, wine tastings or an evening you already host. We start with the spaces and occasions your guests enjoy, then consider the atmosphere, service timings and sound requirements together.",
  },
  {
    question: "What do we need to provide?",
    answer:
      "A suitable performance space and access for setup. My own speaker suits indoor rooms of around 100 guests or fewer. Larger or outdoor settings need a suitable PA and, where necessary, a sound technician. We agree the equipment, power, placement and a weather plan before the event.",
  },
  {
    question: "How does the recurring budget work?",
    answer:
      "I'll quote for the schedule, performance length, location and sound requirements we agree. The private audition comes first, followed by the option of one complimentary event. You can judge the experience with your guests before deciding whether a recurring budget makes sense.",
  },
];

export function HotelsPage() {
  return (
    <>
      <FAQJsonLd faqs={hotelFaqs} />
      <SectionWrapper
        id="hotels"
        surface="cream"
        maxWidth="max-w-none"
        className="pb-8 pt-24 max-lg:[@media(hover:none)]:pb-0 md:pt-28 lg:pb-16"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="pb-2 lg:py-10">
            <SectionHeader
              as="h1"
              alignment="left"
              label="Live cello for hotels & estates"
              className="mb-7 md:mb-8"
              headingClassName="text-[3.5rem] leading-[0.95] tracking-[-0.025em] md:text-[4.5rem] lg:text-[clamp(4.5rem,7vw,6rem)]"
              heading={
                <>
                  A reason to{" "}
                  <br />
                  <HandDrawnUnderline variant={2} underlineClassName="text-accent">
                    come back.
                  </HandDrawnUnderline>
                </>
              }
            />
            <p className="max-w-lg font-sans text-lg leading-relaxed text-foreground/80">
              I come back regularly, get to know your guests and play the music they’ll look forward to hearing again.
            </p>
            <Button href={auditionHref} className={cn(focusClass, "mt-6 w-full sm:w-auto")}>
              Arrange a private audition
            </Button>
          </div>
          <figure className="group relative isolate max-md:[@media(hover:none)]:-mx-6 md:max-lg:[@media(hover:none)]:-mx-12">
            <span
              aria-hidden="true"
              className={cn(photoBackingClass, "bg-background max-lg:[@media(hover:none)]:hidden")}
            />
            <div className="relative aspect-square w-full overflow-hidden sm:aspect-[4/3] lg:aspect-[4/5]">
              <Image
                src="/images/hotels/luke-playing-cello.webp"
                alt="Luke Stamer playing cello outdoors"
                fill
                preload
                sizes="(min-width: 1024px) 45vw, 100vw"
                className={cn(photoZoomClass, "object-cover object-[50%_25%] grayscale-[15%] lg:object-center")}
              />
            </div>
          </figure>
        </div>
      </SectionWrapper>

      <SectionWrapper id="the-idea" surface="background" className="scroll-mt-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
          <div>
            <SectionHeader
              label="The idea"
              alignment="left"
              className="mb-6 md:mb-6"
              heading="Entertainment which gets better with time"
            />
            <div className="max-w-xl space-y-4 font-sans text-base leading-relaxed text-foreground/75">
              <p>
                Every aspect of hospitality takes time and iterations to perfect. Your food menu needed guest feedback. Then the chef improved the food.
              </p>
              <p>
                I bring that same care to the music. By returning regularly, I&apos;m able to learn which songs the guests respond to, the energy the room likes, when to let things breathe. When a first-time guest walks in, they hear a performance shaped by everything I&apos;ve learned from the previous visits.
              </p>
              <p>
                <strong className="font-semibold text-foreground">My thirteenth visit may be their first impression.</strong>
                <br />
                Imagine what that does over time.
              </p>
              <p>What other hotel has music this tailored to the people staying there?</p>
            </div>
          </div>
          <HotelTestimonial />
        </div>
      </SectionWrapper>

      <SectionWrapper id="your-guest-experience" surface="background">
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1fr] lg:gap-20">
          <div className="group relative isolate">
            <span aria-hidden="true" className={cn(photoBackingClass, "bg-cream")} />
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <Image
                src="/images/about-perf1.jpg"
                alt="Luke Stamer playing cello for guests at an outdoor wedding ceremony"
                fill
                sizes="(min-width: 1024px) 38vw, 100vw"
                className={cn(photoZoomClass, "object-cover grayscale-[15%]")}
              />
            </div>
          </div>
          <div>
            <SectionHeader
              label="Your guests, your atmosphere"
              alignment="left"
              className="mb-6 md:mb-8"
              heading="The music should feel at home here."
            />
            <ul role="list" className="divide-y divide-primary/15 border-t border-primary/15">
              {fitDetails.map(({ title, body, icon: Icon }) => (
                <li key={title} className="flex gap-4 py-6 last:pb-0 md:gap-5">
                  <span aria-hidden="true" className="flex size-[40px] shrink-0 items-center justify-center bg-foreground text-on-dark">
                    <Icon className="size-[20px]" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <h3 className={featureItemTitleClass}>{title}</h3>
                    <p className={cn(featureItemBodyClass, "mt-2")}>{body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-8 font-sans text-sm leading-relaxed text-foreground/65">From terrace sundowners and wine tastings to dinner and evening gatherings. We start with what already brings your guests together.</p>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper id="private-audition" surface="cream">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <SectionHeader
            label="Let me play it for you"
            alignment="left"
            className="mb-0 md:mb-0"
            heading="Hear me first, then decide"
          />
          <p className="max-w-xl self-end font-sans text-base leading-relaxed text-foreground/75">
            You should be able to hear it in your own space before giving it a place in your calendar. Here&apos;s what I have in mind.
          </p>
        </div>
        <HotelAuditionSteps />
        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Button href={auditionHref} className={focusClass}>Arrange a private audition</Button>
          <p className="font-sans text-sm text-foreground/70">Message me on WhatsApp to find a time.</p>
        </div>
      </SectionWrapper>

      <SectionWrapper id="hotel-questions" surface="cream" maxWidth="max-w-5xl">
        <SectionHeader
          label="FAQs"
          className="mb-12 md:mb-16"
          headingClassName="text-foreground"
          heading="A few things you might be wondering."
        />
        <FAQAccordion
          faqs={hotelFaqs}
          defaultOpenIndex={0}
          numbered
          className="rounded-card border border-primary/10 bg-background px-6 py-1.5 shadow-card md:px-10"
        />
      </SectionWrapper>

      <SectionWrapper id="lets-meet" surface="dark" maxWidth="max-w-none" className="text-on-dark">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <SectionHeader
            label="An invitation"
            alignment="left"
            className="mb-0 md:mb-0"
            labelClassName="text-on-dark/70"
            headingClassName="text-on-dark"
            heading="I'd love to hear what you have in mind."
          />
          <div>
            <p className="max-w-lg font-sans text-base leading-relaxed text-on-dark/80">Tell me about an event your guests already look forward to, or a spot you think would sound lovely with a cello. I&apos;ll bring mine.</p>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button href={auditionHref} variant="white" className={focusClass}>Arrange a private audition</Button>
              <a href={emailHref} className={cn(focusClass, "py-3 text-center font-sans text-sm text-on-dark underline decoration-on-dark/50 underline-offset-4 sm:px-1")}>Email me</a>
            </div>
            <p className="mt-5 font-sans text-sm text-on-dark/65">Prefer a form? <Link href="/book" className={cn(focusClass, "text-on-dark underline underline-offset-4")}>Send an enquiry</Link>.</p>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
