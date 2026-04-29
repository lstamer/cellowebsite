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

const WHY_ME_PARAGRAPHS: ReactNode[] = [
  "You're not just hiring a cellist. You're hiring someone who actually cares about your day.",
  "Let me be honest: there are plenty of talented musicians in Cape Town. Technically skilled, well-trained, perfectly capable of showing up, playing through a setlist, and going home.",
  "Here's the difference.",
  "I'm emotionally invested. I believe — genuinely — that a performer's energy transfers directly to the room. If a musician plays your wedding but isn't moved by the moment, the audience feels it. Maybe not consciously. But something falls flat. The music becomes background noise instead of the heartbeat of the evening.",
  "I don't do background noise.",
  "I make it easy. If you're a bride, an event planner, or a company organising something important — you already have a hundred stressful decisions on your plate. Music shouldn't be one of them. I handle it. You tell me what you're envisioning, and I take care of the rest. No complicated processes. No guesswork. Just the confidence that when the moment comes, the music will be right.",
  <>
    I play what moves people — not what impresses critics. My goal has never been to
    perform for rooms full of classical purists nodding along politely. It&apos;s to play
    for real people having real moments. The song that makes a groom&apos;s breath catch.
    The first dance that makes the whole room go quiet. The cocktail hour that people
    talk about on the drive home. <em>That&apos;s</em> what I care about.
  </>,
  "And the cello does something no other instrument can. It sits in the range closest to the human voice. When you hear a familiar song — something you love, something tied to a memory — played on a cello, it hits differently than a speaker or a band or a piano. It's warm. It's intimate. It's alive in front of you. And it turns a special day into something people carry with them.Familiar songs, unfamiliar instrument. There's a specific kind of moment that happens when a guest recognises their favourite song — but on a cello. It's unexpected, unusual, and unreasonably moving. I build entire sets around engineering that moment.",
  "Still not sure? Listen to a track first. You won't have to ask after that.",
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
                Book a call
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
        className="scroll-mt-24 bg-surface-dark text-background"
        maxWidth="max-w-none"
      >
        <div
          data-about-section
          className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16"
        >
          <div data-about-reveal className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeader
              label="Why Me"
              heading="Care changes the room."
              alignment="left"
              className="mb-8"
              labelClassName="border-background/20 text-background/70"
              headingClassName="text-background"
            />
            <p className="max-w-xs font-sans text-sm leading-relaxed text-background/60">
              Not autopilot. Not filler music. A performance style built around care,
              clarity, and the feeling people carry home.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {WHY_ME_PARAGRAPHS.map((paragraph, index) => {
              const emphasized =
                index === 0 || index === 2 || index === 4 || index === WHY_ME_PARAGRAPHS.length - 1;

              return (
                <div
                  key={index}
                  data-about-reveal
                  className={cn(
                    "rounded-[2rem] border p-6 md:p-8",
                    emphasized
                      ? "border-accent/20 bg-accent/10"
                      : "border-background/10 bg-background/5"
                  )}
                >
                  <p
                    className={cn(
                      "text-pretty",
                      emphasized
                        ? "font-serif text-3xl italic leading-tight text-background md:text-4xl"
                        : "font-sans text-lg leading-relaxed text-background/80"
                    )}
                  >
                    {paragraph}
                  </p>
                </div>
              );
            })}
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
