import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { FAQAccordion } from "@/components/ui/FAQAccordion";
import { FAQJsonLd } from "@/components/ui/FAQJsonLd";
import { HandDrawnUnderline } from "@/components/ui/HandDrawnUnderline";
import { PUBLIC_EMAIL } from "@/lib/email";
import { PUBLIC_WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { testimonials } from "@/lib/testimonials";
import { cn } from "@/lib/utils";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";

const auditionMessage =
  "Hi Luke, I'd love to explore recurring live cello for our hotel or estate. Could we arrange a private audition for our team?";
const auditionHref = `https://wa.me/${PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(auditionMessage)}`;
const emailHref = `mailto:${PUBLIC_EMAIL}?subject=${encodeURIComponent("Live cello for our hotel or estate")}&body=${encodeURIComponent(auditionMessage)}`;
const focusClass =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";
const labelClass = "uppercase";
const plainLabelClass = "pl-0 uppercase before:hidden";
const hotelTestimonial = testimonials.find((testimonial) => testimonial.name === "Marcus Reed");

const fitDetails = [
  {
    title: "A familiar song. A fresh feeling.",
    body: "Classical, cinematic, acoustic, rock and contemporary favourites. I can follow an unhurried afternoon with a livelier evening set. Recognising a favourite song on cello is half the fun.",
  },
  {
    title: "Room for conversation",
    body: "I adjust the volume, repertoire and energy to the room. Guests can enjoy the music and still hear the person across the table. Your service keeps its rhythm.",
  },
  {
    title: "Less to explain each time",
    body: "We agree on dates, setup and timings in advance. I reserve those dates and personally play each agreed event. As I get to know your team, the familiar details stay handled.",
  },
];

const auditionSteps = [
  {
    title: "A private audition",
    body: "I come to your property and play a few different styles for you and your team. We talk about your guests, existing events and where the music could fit.",
  },
  {
    title: "One complimentary event",
    body: "If you like what you hear, I'll play at one event you already host, free of charge. See how the music fits the room and how your guests respond.",
  },
  {
    title: "A rhythm that suits you",
    body: "Only if it feels right, we work out a recurring arrangement around your calendar and budget. There's no obligation to continue after the audition or complimentary event.",
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
        className="pb-0 pt-24 md:pb-0 md:pt-28 lg:pb-16"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="pb-2 lg:py-10">
            <SectionHeader
              as="h1"
              alignment="left"
              label="Live cello for hotels & estates"
              labelClassName={plainLabelClass}
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
            <div className="mt-6 flex flex-col items-stretch gap-1 sm:flex-row sm:items-center sm:gap-4">
              <Button href={auditionHref} className={focusClass}>
                Arrange a private audition
              </Button>
              <Link href="#the-idea" className={cn(focusClass, "py-3 text-center font-sans text-sm text-primary underline decoration-primary/40 underline-offset-4 sm:px-1")}>
                How it works
              </Link>
            </div>
            <p className="mt-2 font-sans text-sm text-foreground/70 sm:mt-4">Luke Stamer · Cape Town & the Winelands</p>
          </div>
          <figure className="-mx-6 md:-mx-12 lg:mx-0">
            <div className="relative aspect-[4/3] w-full lg:aspect-[4/5]">
              <Image
                src="/images/hotels/estate-lounge.webp"
                alt="An imagined estate lounge, with a cello beside an armchair and doors opening onto a garden"
                fill
                preload
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover object-[50%_60%] grayscale-[15%] lg:object-center"
              />
            </div>
            <figcaption className="bg-cream px-6 py-3 font-sans text-xs text-foreground/65 md:px-12 lg:px-0">
              An imagined estate lounge.
            </figcaption>
          </figure>
        </div>
      </SectionWrapper>

      <SectionWrapper id="the-idea" surface="background" className="scroll-mt-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
          <div>
            <SectionHeader
              label="The idea"
              alignment="left"
              labelClassName={labelClass}
              className="mb-6 md:mb-6"
              heading="Your menu got better with time. So can the music."
            />
            <div className="max-w-xl space-y-4 font-sans text-base leading-relaxed text-foreground/75">
              <p>You listen to your guests. Tweak a recipe. Bring back the dish they ask for. Little by little, it becomes part of why they love being here.</p>
              <p>I&apos;d love to bring that same care to the music. Returning regularly gives me time to learn which songs land, when the room wants a little more energy, and when to let it breathe.</p>
            </div>
          </div>
          {hotelTestimonial && (
            <figure className="self-center border-y border-primary/15 py-8 lg:py-10">
              <p className="mb-5 font-sans text-sm leading-relaxed text-foreground/75">
                I&apos;m a professional cellist based in Cape Town. Here&apos;s what Marcus said after I played at a hotel farewell.
              </p>
              <blockquote className="font-serif text-2xl italic leading-snug text-primary md:text-3xl">
                &ldquo;{hotelTestimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 font-sans text-sm leading-relaxed text-foreground/70">
                <span className="block font-medium text-foreground">{hotelTestimonial.name}</span>
                Hotel client · COO farewell event
              </figcaption>
            </figure>
          )}
        </div>
      </SectionWrapper>

      <SectionWrapper id="a-signature" surface="dark" maxWidth="max-w-none" className="text-on-dark">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            label="Imagine a few months from now"
            alignment="left"
            className="mb-10 md:mb-12"
            labelClassName={cn(plainLabelClass, "text-on-dark/70")}
            headingClassName="max-w-5xl text-[2.75rem] leading-[1.02] text-on-dark md:text-[clamp(3.5rem,5.4vw,5.5rem)] lg:text-[clamp(3.5rem,5.4vw,5.5rem)]"
            heading={
              <>
                My thirteenth visit.{" "}
                <br />
                Their{" "}
                <HandDrawnUnderline variant={1} underlineClassName="text-accent" textClassName="text-on-dark">
                  first impression.
                </HandDrawnUnderline>
              </>
            }
          />
          <div className="grid gap-8 border-t border-on-dark/20 pt-8 md:grid-cols-2 md:gap-16">
            <p className="max-w-xl font-sans text-lg leading-relaxed text-on-dark/85">
              A guest walks in for the first time. They hear a performance shaped by everything I&apos;ve learned on the previous twelve visits. The songs, the timing, the feeling of that particular room.
            </p>
            <div className="max-w-xl space-y-4 font-sans text-base leading-relaxed text-on-dark/75">
              <p>Before long, those details add up to a sound that belongs to your property. The first notes on the terrace at sundown might become as familiar as the view.</p>
              <p>It gives guests a story to tell and something to look forward to on their next visit.</p>
              <p>Even one extra night, a recommendation or an event booking can give the music value beyond that evening.</p>
            </div>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper id="your-guest-experience" surface="background">
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1fr] lg:gap-20">
          <figure>
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <Image
                src="/images/about-perf1.jpg"
                alt="Luke Stamer playing cello for guests at an outdoor wedding ceremony"
                fill
                sizes="(min-width: 1024px) 38vw, 100vw"
                className="object-cover grayscale-[15%]"
              />
            </div>
            <figcaption className="mt-3 font-sans text-xs leading-relaxed text-foreground/65">Playing at an outdoor wedding.</figcaption>
          </figure>
          <div>
            <SectionHeader
              label="Your guests, your atmosphere"
              labelClassName={labelClass}
              alignment="left"
              className="mb-8 md:mb-10"
              heading="The music should feel at home here."
            />
            <div className="divide-y divide-primary/15">
              {fitDetails.map((detail) => (
                <article key={detail.title} className="py-6 first:pt-0 last:pb-0">
                  <h3 className={featureItemTitleClass}>{detail.title}</h3>
                  <p className={cn(featureItemBodyClass, "mt-3")}>{detail.body}</p>
                </article>
              ))}
            </div>
            <p className="mt-8 font-sans text-sm leading-relaxed text-foreground/65">From terrace sundowners and wine tastings to dinner and evening gatherings. We start with what already brings your guests together.</p>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper id="private-audition" surface="cream">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <SectionHeader
            label="Let me play it for you"
            labelClassName={labelClass}
            alignment="left"
            className="mb-0 md:mb-0"
            heading="First, a little music. Then, a conversation."
          />
          <p className="max-w-xl self-end font-sans text-base leading-relaxed text-foreground/75">
            You should be able to hear it in your own space before giving it a place in your calendar. Here&apos;s what I have in mind.
          </p>
        </div>
        <ol role="list" className="mt-12 grid list-none gap-8 p-0 md:grid-cols-3 md:gap-10">
          {auditionSteps.map((step, index) => (
            <li key={step.title} className="border-t border-primary/20 pt-5">
              <span aria-hidden="true" className="font-mono text-sm tabular-nums text-primary/75">0{index + 1}</span>
              <h3 className={cn(featureItemTitleClass, "mt-4")}>{step.title}</h3>
              <p className={cn(featureItemBodyClass, "mt-3")}>{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Button href={auditionHref} className={focusClass}>Arrange a private audition</Button>
          <p className="font-sans text-sm text-foreground/70">Message me on WhatsApp to find a time.</p>
        </div>
      </SectionWrapper>

      <SectionWrapper id="hotel-questions" surface="background">
        <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <SectionHeader
            label="The practical bits"
            labelClassName={labelClass}
            alignment="left"
            className="mb-5 md:mb-5"
            heading="A few things you might be wondering."
          />
          <FAQAccordion faqs={hotelFaqs} defaultOpenIndex={0} />
        </div>
      </SectionWrapper>

      <SectionWrapper id="lets-meet" surface="dark" maxWidth="max-w-none" className="text-on-dark">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <SectionHeader
            label="An invitation"
            alignment="left"
            className="mb-0 md:mb-0"
            labelClassName="uppercase text-on-dark/70"
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
