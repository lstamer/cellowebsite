"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ChevronDown } from "lucide-react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const OVERVIEW_PARAGRAPHS = [
  "I'm a Cape Town cellist with classical training, a modern ear, and a bit of a rebellious streak. I've played everywhere from concert halls to wedding aisles.",
  "I play both classical and modern music, and I specialise in the moments that matter most: weddings, milestone events, evenings people think back to for decades. Think of some of your oldest, most cherished memories. You might not remember every detail, but you can remember how it felt. And music is the big reason why.",
  "My mission is to bridge the gap between classical instruments and modern listeners. A Tchaikovsky overture gets me teared up – someone else might get goosebumps hearing Taylor Swift, or feel inspired listening to Frank Sinatra.",
  "I've seen how music changes people — thousands of people, in so many different ways.",
  "It can lift the atmosphere and bring out the fun or charismatic parts of you that haven't surfaced in years. Music can cause tears and goosebumps, but can also spur on immense joy and laughter.",
  "It can make a moment feel like a milestone in your life's story.",
  "That is the space I love working in. I want to spread this gift even further than I already have. I respect the classical world deeply. It gave me the foundation I rely on every time I play. But that's not why I play – not just for the approval of classically trained ears – for couples, guests, children. For everyone.",
  "If you're reading this, you're already supporting the vision ❤️",
];

const ACHIEVEMENT_STORY_INTRO = [
  "My musical path has taken me from school corridors to major Cape Town stages. And a lot of wine farms 😂",
  "I’m not just a rule breaking crazy muso. I’ve done some cool music things:",
] as const;

const ACHIEVEMENTS_LIST: { tag: string; text: string }[] = [
  { tag: "WIN", text: "Soloed at the Cape Town City Hall after winning a concerto festival" },
  {
    tag: "STAGE",
    text: "Performances at Fugard Theatre, Baxter, Hugo Lambrechts, Cape Town City Hall",
  },
  { tag: "EARLY", text: "Dominated university-level competitions before finishing high school" },
  { tag: "CRED", text: "Became a professionally qualified ATCL musician" },
  {
    tag: "MOMENT",
    text: "Made over a dozen people cry at one time without saying a word (weird flex, I know)",
  },
];

interface WhyMeReason {
  number: string;
  title: string;
  intro: ReactNode;
  body: ReactNode;
  question: ReactNode;
  accent?: boolean;
}

const WHY_ME_INTRO =
  "There are thousands of technically skilled, well-trained musicians who are perfectly capable of preparing a list of songs, playing for a few hours, and going home. So why me?";

const WHY_ME_STANDALONE =
  "You're not just hiring a musician. You're hiring someone who actually cares about your day.";

const WHY_ME_REASONS: WhyMeReason[] = [
  {
    number: "01",
    title: "We have the same goal.",
    intro: (
      <>
        What matters on a special day? Is it the performer&apos;s vibrato technique?
        <span className="font-semibold text-foreground"> No.</span>
      </>
    ),
    body: (
      <>
        It&apos;s about lifting the mood, amazing the guests, and making the occasion{" "}
        <em>feel</em> special.
      </>
    ),
    question:
      "Do you want a musician who views your day as a paycheck or as a treat?",
  },
  {
    number: "02",
    title: "I make it easy.",
    intro:
      "Planning an event means a hundred stressful decisions, whether you're a bride, groom, event planner, company organiser or friend.",
    body: "Music should not be another source of stress. Just tell me what you're envisioning, and I'll take care of the rest.",
    question: "On the day, do you want to focus on logistics or enjoy the moment?",
  },
  {
    number: "03",
    title: "The cello effect.",
    intro:
      "When a guest recognises a familiar song played on cello, it hits differently than on a speaker, guitar or piano.",
    body:
      "The cello has a human quality that is hard to explain until you hear it up close, so people often respond to it emotionally before they even know why. I build my sets around engineering that moment.",
    question: "Good luck finding another instrument that carries emotion like a cello does.",
    accent: true,
  },
];

interface FaqItem {
  question: string;
  answer: ReactNode;
}

const FAQS: FaqItem[] = [
  {
    question: "How did you start playing cello?",
    answer:
      "I was in Grade 2 and watched a cellist play the Star Wars theme with a lightsaber instead of a bow. I have no idea who that person was, but they're single-handedly responsible for everything that's happened since. I picked up the cello and never really considered putting it down.",
  },
  {
    question: "What made you stick with it?",
    answer: (
      <>
        Honestly? Watching people react. Early on I started noticing that my playing
        actually <em>did something</em> to people — tears, goosebumps, people coming up
        afterwards just to say thank you. That&apos;s a powerful thing to experience when
        you&apos;re young. It stopped being about practice and started being about impact.
      </>
    ),
  },
  {
    question: "Why the cello specifically?",
    answer:
      "Because it's the closest instrument to the human voice. It can whisper, it can roar, it can break your heart in four notes. And it's impossibly versatile — most people just haven't been shown that yet. The cello doesn't belong locked in a concert hall. It belongs wherever people are feeling something.",
  },
  {
    question: "You're classically trained — so why do you play modern music?",
    answer:
      "Because different people respond to different music. One person gets emotional hearing Elgar. Another person tears up at a Taylor Swift song. Another gets chills from Frank Sinatra. The emotion is the same — the entry point is different. I think classical musicians sometimes forget that. I'd rather meet people where they are and let the cello do something unexpected with a song they already love.",
  },
  {
    question: "Where did you study music?",
    answer: (
      <>
        I studied through the classical tradition — competitions, performance
        festivals, formal training. I was competing in university-level competitions
        before I even finished high school and solo&apos;d at venues like the Cape Town
        City Hall and the Fugard Theatre. But some of my most formative &quot;training&quot;
        happened in the hallways of my high school, skipping class with my friend Ben,
        playing rock songs on our cellos in the passages until we got caught. I got
        in a lot of trouble for that. Worth every detention.
      </>
    ),
  },
  {
    question: "Who are your musical influences?",
    answer:
      "On the classical side: Daniil Shafran and Sheku Kanneh-Mason — two cellists who play with raw emotional depth, not just technical precision. On the modern side: the 2CELLOS group, especially Maestro Hauser. They proved that a cello can fill an arena, not just an orchestra pit. That changed everything for me.",
  },
  {
    question: "Why should I book you instead of another musician?",
    answer:
      "Because I'm not just showing up to play songs. I'm showing up because I believe that the music at your event will be the thing people remember most — and I take that seriously. I'm emotionally invested in getting it right. I make the process stress-free. And I play with the kind of energy that turns a nice evening into an unforgettable one.\n\nBut honestly — just listen to a track. That answers the question better than I ever could.",
  },
  {
    question: "What are you working on right now?",
    answer:
      "I'm building something bigger than just solo performances. I'm partnering with event planners and companies across Cape Town who want better live music as part of their offering. And I'm finding other young musicians who share this same rebellious, genre-crossing philosophy — because the more events we can reach, the more people get to experience what live cello can really do.",
  },
];

const HERO_NOTES = [
  "Cape Town weddings and milestone events",
  "Classical training with modern repertoire",
  "Music that becomes part of the memory",
];

export function AboutBioContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number>(0);

  useGSAP(
    () => {
      gsap.from("[data-hero-reveal]", {
        opacity: 0,
        y: 24,
        duration: 0.65,
        stagger: 0.06,
        ease: "power3.out",
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef}>
      <SectionWrapper className="pt-32 md:pt-36 pb-16 md:pb-20" maxWidth="max-w-7xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(22rem,0.98fr)] lg:items-start">
          <div className="flex flex-col gap-8">
            <div data-hero-reveal className="flex flex-col gap-5">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary/60">
                About
              </p>
              <h1 className="max-w-3xl font-serif italic text-5xl leading-[0.94] tracking-tight text-primary text-balance md:text-7xl">
                Classical training.
                <br />
                Modern instinct.
              </h1>
              <p className="max-w-2xl font-sans text-lg leading-relaxed text-foreground/80 text-pretty md:text-xl">
                The story, philosophy, and performance style behind the cello work Luke
                Stamer brings into weddings, milestone events, and once-in-a-lifetime
                evenings.
              </p>
            </div>

            <div
              data-hero-reveal
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {HERO_NOTES.map((note) => (
                <div
                  key={note}
                  className="rounded-card border border-primary/10 bg-primary/5 px-5 py-4 shadow-card"
                >
                  <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-primary/60">
                    Note
                  </p>
                  <p className="mt-3 font-sans text-sm leading-relaxed text-foreground/80">
                    {note}
                  </p>
                </div>
              ))}
            </div>

            <div data-hero-reveal className="flex flex-col gap-3 sm:flex-row">
              <Button href="/book" variant="primary" size="md">
                Get in contact
              </Button>
              <Button href="/#contact" variant="white" size="md">
                Send a message
              </Button>
            </div>
          </div>

          <div data-hero-reveal className="grid grid-cols-2 gap-4 md:gap-5">
            <div className="flex flex-col gap-4 pt-10 md:pt-16">
              <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-primary/5 shadow-card">
                <div className="relative aspect-[4/5]">
                  <Image
                    src="/images/about-perf1.jpg"
                    alt="Luke Stamer performing live with cello"
                    fill
                    className="object-cover object-left grayscale-[18%]"
                    sizes="(max-width: 1024px) 50vw, 28vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-primary/5 to-transparent" />
                </div>
              </div>

              <div className="rounded-[2rem] border border-primary/10 bg-background p-5 shadow-card">
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-primary/60">
                  Approach
                </p>
                <p className="mt-3 font-serif text-2xl italic leading-tight text-foreground md:text-3xl">
                  Familiar songs, unfamiliar instrument.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-[2rem] border border-primary/10 bg-primary/5 p-5 shadow-card">
                <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-primary/60">
                  Selected stages
                </p>
                <div className="mt-4 space-y-3">
                  <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                    Cape Town City Hall
                  </p>
                  <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                    Fugard Theatre
                  </p>
                  <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                    Trinity ACTL
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-primary/5 shadow-card">
                <div className="relative aspect-[4/5]">
                  <Image
                    src="/images/heroImage.jpeg"
                    alt="Close portrait of cello performance"
                    fill
                    className="object-cover object-left grayscale-[20%]"
                    sizes="(max-width: 1024px) 50vw, 28vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-primary/10 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper
        id="overview"
        className="scroll-mt-24 pt-8 md:pt-12"
        maxWidth="max-w-7xl"
      >
        <div
          data-about-section
          className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:items-start"
        >
          {/* Sticky image column */}
          <div data-about-reveal className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative pb-8">
              <div className="relative overflow-hidden rounded-[2rem] border border-primary/10 shadow-card">
                <div className="relative aspect-[3/4]">
                  <Image
                    src="/images/about-perf1.jpg"
                    alt="Luke Stamer performing live with cello"
                    fill
                    className="object-cover object-center grayscale-[12%]"
                    sizes="(max-width: 1024px) 100vw, 44vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-primary/5 to-transparent" />
                </div>
              </div>
              {/* Floating quote tag */}
              <div className="absolute -bottom-2 -left-4 max-w-[13rem] rotate-[-2deg] rounded-xl bg-[#EDE8DE] px-4 py-3 shadow-card">
                <p className="font-serif italic text-sm leading-snug text-foreground/80">
                  &ldquo;The right music doesn&rsquo;t just complement a moment — it becomes the moment.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Text column */}
          <div className="flex flex-col gap-8">
            <div data-about-reveal className="flex flex-col gap-4">
              <p className="border-l-2 border-accent pl-3 font-mono text-xs uppercase tracking-[0.24em] text-primary/60">
                Brief Overview
              </p>
              <h2 className="font-serif italic text-5xl leading-[0.92] tracking-tight text-foreground md:text-6xl">
                In my own words.
              </h2>
            </div>

            <div className="flex flex-col gap-6">
              {OVERVIEW_PARAGRAPHS.map((paragraph, index) => (
                <p
                  key={paragraph}
                  data-about-reveal
                  className={cn(
                    "font-sans leading-relaxed text-pretty",
                    index === 0
                      ? "text-xl font-medium text-foreground/90 md:text-2xl"
                      : "text-lg text-foreground/75"
                  )}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper
        id="achievements"
        className="scroll-mt-24 py-12 md:py-16"
        maxWidth="max-w-7xl"
      >
        <div data-about-section className="flex flex-col gap-8">
          <div data-about-reveal>
            <div className="flex items-start justify-between gap-4">
              <p className="font-display border-l-2 border-accent pl-3 text-sm font-semibold uppercase tracking-[0.22em] text-foreground/80">
                Achievements
              </p>
              <p className="shrink-0 font-mono text-[0.6875rem] tracking-tight text-foreground/45">
                V — highlights.md
              </p>
            </div>

            <h2 className="mt-5 font-display text-3xl font-bold leading-[1.12] tracking-tight text-primary text-balance md:text-4xl">
              long story short
            </h2>

            <div className="mt-8 h-px w-full bg-primary/15" aria-hidden />

            <div className="mt-8 flex max-w-2xl flex-col gap-4">
              {ACHIEVEMENT_STORY_INTRO.map((line) => (
                <p
                  key={line}
                  className="font-sans text-lg leading-relaxed text-foreground/80 text-pretty"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          <ul className="flex flex-col gap-4" role="list">
            {ACHIEVEMENTS_LIST.map((item, index) => (
              <li
                key={item.text}
                data-about-reveal
                className="group relative flex flex-col gap-4 rounded-2xl border border-dashed border-primary/20 bg-background/60 px-5 py-5 shadow-card sm:flex-row sm:items-center sm:gap-5 sm:py-5 md:px-6"
              >
                <div className="flex min-w-0 items-center gap-3 sm:shrink-0">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-mono font-bold text-background"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <span className="rounded border border-primary/10 bg-primary/5 px-2.5 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-foreground/80">
                    {item.tag}
                  </span>
                </div>
                <p className="min-w-0 flex-1 font-display text-base font-medium not-italic leading-relaxed text-foreground text-pretty md:text-lg">
                  {item.text}
                </p>
                <span
                  className="self-end text-xl font-light leading-none text-foreground/20 sm:ml-2 sm:self-center"
                  aria-hidden
                >
                  +
                </span>
              </li>
            ))}
          </ul>
        </div>
      </SectionWrapper>

      <SectionWrapper
        id="why-me"
        className="scroll-mt-24 bg-background"
        maxWidth="max-w-none"
      >
        <div
          data-about-section
          className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] lg:gap-16"
        >
          <div
            data-about-reveal
            className="order-1 flex flex-col gap-6 lg:order-2 lg:sticky lg:top-28 lg:self-start"
          >
            <SectionHeader
              label="Why Me"
              heading="Why me?"
              alignment="left"
              className="mb-0"
            />

            <p className="max-w-xl font-sans text-lg leading-relaxed text-foreground/80 text-pretty">
              {WHY_ME_INTRO}
            </p>

            <div className="max-w-md rounded-[2rem] border border-accent/20 bg-accent/10 p-6 shadow-card">
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-primary/60">
                The difference
              </p>
              <p className="mt-4 font-serif text-3xl italic leading-tight text-primary text-balance md:text-4xl">
                {WHY_ME_STANDALONE}
              </p>
            </div>

            <div className="max-w-sm border-t border-primary/10 pt-5">
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-primary/60">
                Not background music
              </p>
              <p className="mt-3 font-sans text-sm leading-relaxed text-foreground/60">
                A performance designed to shift the mood, calm the planning, and make the
                room feel something.
              </p>
            </div>
          </div>

          <div className="order-2 flex flex-col gap-5 md:gap-6 lg:order-1">
            {WHY_ME_REASONS.map((reason, index) => (
              <article
                key={reason.number}
                data-about-reveal
                className={cn(
                  "relative overflow-hidden rounded-[2rem] border p-6 shadow-card md:p-8",
                  reason.accent
                    ? "border-accent/20 bg-accent/10"
                    : "border-primary/10 bg-primary/5",
                  index === 0 && "lg:ml-12",
                  index === 1 && "lg:mr-14",
                  index === 2 && "lg:ml-6"
                )}
              >
                <div className="absolute right-5 top-5 font-mono text-[3.5rem] leading-none text-primary/5 md:text-[4.5rem]">
                  {reason.number}
                </div>

                <div className="relative z-10 flex flex-col gap-6">
                  <div className="flex flex-col gap-4 border-b border-primary/10 pb-6">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/10 bg-primary/5 font-mono text-sm font-semibold text-primary">
                        {reason.number}
                      </span>
                      <p className="font-display text-2xl font-semibold tracking-tight text-primary md:text-[2rem]">
                        {reason.title}
                      </p>
                    </div>

                    <p className="max-w-2xl font-sans text-lg leading-relaxed text-foreground/80 text-pretty">
                      {reason.intro}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_15rem] md:items-start">
                    <p className="max-w-2xl font-sans text-lg leading-relaxed text-foreground/80 text-pretty">
                      {reason.body}
                    </p>

                    <div className="rounded-2xl border border-primary/10 bg-background p-4 shadow-card">
                      <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-primary/60">
                        Why it matters
                      </p>
                      <p className="mt-3 font-serif text-xl italic leading-snug text-primary text-balance">
                        {reason.question}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            <div
              data-about-reveal
              className="rounded-[2rem] border border-primary/10 bg-primary/5 px-6 py-5 md:px-8"
            >
              <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-primary/60">
                In short
              </p>
              <p className="mt-3 max-w-3xl font-sans text-base leading-relaxed text-foreground/80 md:text-lg">
                The point is not to prove how trained I am. The point is to make your day
                feel effortless, emotional, and unforgettable.
              </p>
            </div>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper id="faq" className="scroll-mt-24" maxWidth="max-w-5xl">
        <div data-about-section className="flex flex-col gap-10">
          <div data-about-reveal className="max-w-3xl">
            <SectionHeader
              label="FAQ"
              heading="Questions people usually ask before they reach out."
              alignment="left"
              className="mb-0"
            />
          </div>

          <div className="divide-y divide-primary/10 rounded-[2rem] border border-primary/10 bg-primary/5 px-6 shadow-card md:px-8">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div key={faq.question} data-about-reveal className="py-6">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="group flex w-full items-start justify-between gap-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="flex flex-col gap-2">
                      <span className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-primary/50">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-xl font-semibold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary md:text-2xl">
                        {faq.question}
                      </span>
                    </span>

                    <ChevronDown
                      className={cn(
                        "mt-1 h-5 w-5 shrink-0 text-foreground/50 transition-transform duration-300",
                        isOpen && "rotate-180 text-primary"
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-in-out",
                      isOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="max-w-3xl space-y-4 pr-8">
                        {typeof faq.answer === "string" && faq.answer.includes("\n\n") ? (
                          faq.answer.split("\n\n").map((paragraph) => (
                            <p
                              key={paragraph}
                              className="font-sans text-lg leading-relaxed text-foreground/75 text-pretty"
                            >
                              {paragraph}
                            </p>
                          ))
                        ) : (
                          <p className="font-sans text-lg leading-relaxed text-foreground/75 text-pretty">
                            {faq.answer}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}
