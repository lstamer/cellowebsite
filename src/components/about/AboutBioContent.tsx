"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { gsap } from "@/lib/gsap-client";
import { useGSAP } from "@gsap/react";
import { ChevronDown, Music2, Target, Zap, type LucideIcon } from "lucide-react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WhyMeTypewriterHeading } from "@/components/about/WhyMeTypewriterHeading";
import { cn } from "@/lib/utils";
import { faqQuestionClass, featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";

const OVERVIEW_PARAGRAPHS = [
  "I'm a Cape Town cellist with classical training, a modern ear, and a bit of a rebellious streak. I've played everywhere from concert halls to wedding aisles.",
  "I play both classical and modern music, and I specialise in the moments that matter most: weddings, milestone events, evenings people think back to for decades. Think of some of your oldest, most cherished memories. You might not remember every detail, but you can remember how it felt. And music is the big reason why.",
  "What I really care about is closing the gap between a classical instrument and a modern ear. A Tchaikovsky overture gets me teared up — someone else gets goosebumps from Taylor Swift, or goes quiet over Frank Sinatra. Same feeling, different door in.",
  "I've seen how music changes people — thousands of people, in so many different ways.",
  "It can lift the atmosphere and bring out the fun or charismatic parts of you that haven't surfaced in years. Music can cause tears and goosebumps, but can also spur on immense joy and laughter.",
  "It can make a moment feel like a milestone in your life's story.",
  "That is the space I love working in. I want to spread this gift even further than I already have. I respect the classical world deeply. It gave me the foundation I rely on every time I play. But that's not why I play – not just for the approval of classically trained ears – for couples, guests, children. For everyone.",
  "If you're reading this, you're already supporting the vision ❤️",
];

const ACHIEVEMENT_STORY_INTRO: ReactNode[] = [
  <>
    My musical path has taken me from school corridors to major Cape Town stages. And{" "}
    <em>a lot</em> of wine farms 😂
  </>,
  "I’m not just a rule breaking crazy muso. I’ve done some cool music things:",
];

interface AchievementGroup {
  title: string;
  details: ReactNode[];
}

const ACHIEVEMENTS: AchievementGroup[] = [
  {
    title: "Past performances",
    details: [
      "Soloed at the Cape Town City Hall after winning a concerto festival.",
      "Performances at the Fugard Theatre, Baxter, Hugo Lambrechts, Artscape, and the CTICC.",
    ],
  },
  {
    title: "Present activities",
    details: [
      "Active across numerous competitions and concerto festivals.",
      <>
        Most recently qualified for the <em>UCT Annual Concerto Festival</em> — performing with an
        orchestra later this year.
      </>,
    ],
  },
  {
    title: "Training & early wins",
    details: [
      "Became a professionally qualified ATCL musician.",
      "Dominated university-level competitions before finishing high school.",
    ],
  },
];

interface WhyMeReason {
  number: string;
  title: string;
  intro: ReactNode;
  question: ReactNode;
  accent?: boolean;
  icon: LucideIcon;
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
        What matters on a special day? Vibrato technique?
        <span className="font-semibold text-foreground"> No.</span>
        <br />
        It&apos;s about lifting the mood, impressing the guests, and making memories that feel special.
      </>
 
    ),
    question:
      "I want the day to land harder than you hoped — same as you do.",
    icon: Target,
  },
  {
    number: "02",
    title: "I make it easy.",
    intro:
      "Planning an event means a hundred stressful decisions. Music should not be another source of stress.",
    question: "On the day, do you want to enjoy being in the moment or worry over logistics?",
    icon: Zap,
  },
  {
    number: "03",
    title: "The cello effect.",
    intro:
      "When a guest recognises a familiar song played on cello, it hits differently than on a speaker. It's closest to the human voice, which means people respond to it emotionally before they even know why.",
    question: "If you've spotted me playing around Cape Town, you'll know what I mean.",
    accent: true,
    icon: Music2,
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
      "I'm building something bigger than just solo performances. I'm partnering with event planners and companies across Cape Town who want better live music at the heart of what they do. And I'm finding other young musicians who share this same rebellious, genre-crossing streak — because the more events we reach, the more people get to feel what live cello can really do.",
  },
];

/** Matches the overview section title — reuse for all about-page section headings */
const ABOUT_SECTION_HEADING_CLASS =
  "font-serif italic text-5xl leading-[0.92] tracking-tight text-foreground md:text-6xl text-balance";

const ABOUT_SECTION_RULE_CLASS = "mt-4 h-px w-full bg-primary/15";

/** Small-caps tagline label used above section headings and in cards */
const ABOUT_TAGLINE_CLASS =
  "font-jost text-[0.6875rem] uppercase tracking-[0.22em] text-primary/70";

/** Accented left-bordered section label (Introduction, Achievements, etc.) */
const ABOUT_SECTION_LABEL_CLASS =
  "font-jost border-l-2 border-accent pl-3 text-sm font-semibold uppercase tracking-[0.22em] text-foreground/70";


export function AboutBioContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number>(0);

  useGSAP(
    () => {
      gsap.fromTo(
        ".about-overview-image",
        { y: 40, autoAlpha: 0 },
        {
          scrollTrigger: { trigger: ".about-overview-image", start: "top 85%", once: true },
          y: 0,
          autoAlpha: 1,
          duration: 1,
          ease: "power3.out",
        }
      );

      gsap.utils.toArray<HTMLElement>("[data-about-reveal]", containerRef.current).forEach((el) => {
        gsap.fromTo(
          el,
          { y: 32, autoAlpha: 0 },
          {
            scrollTrigger: { trigger: el, start: "top 80%", once: true },
            y: 0,
            autoAlpha: 1,
            duration: 0.8,
            ease: "power3.out",
          }
        );
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef}>
      <SectionWrapper
        id="overview"
        className="scroll-mt-24 pt-28 pb-16 md:pt-32 md:pb-24"
        maxWidth="max-w-7xl"
      >
        <div
          data-about-section
          className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:items-start"
        >
          {/* Sticky image column */}
          <div data-about-reveal className="lg:sticky lg:top-28 lg:self-start">
            <div className="about-overview-image gsap-reveal group relative w-full">
              <div
                className="absolute inset-0 -z-10 bg-cream transition-transform duration-700 ease-out group-hover:scale-105 translate-x-3 translate-y-3"
                aria-hidden
              />
              <div className="relative aspect-[3/4] overflow-hidden shadow-card">
                <Image
                  src="/images/edit-20260614-200357-1e5069-retake-v2-clean2.jpeg"
                  alt="Luke Stamer performing cello at a corporate event"
                  fill
                  className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 44vw"
                />
              </div>
            </div>
          </div>

          {/* Text column */}
          <div className="flex flex-col gap-8">
            <div data-about-reveal className="flex flex-col">
              <div className="flex flex-col gap-4">
                <p className={ABOUT_SECTION_LABEL_CLASS}>
                  introduction
                </p>
                <h1 className={ABOUT_SECTION_HEADING_CLASS}>Brief overview</h1>
              </div>
              <div className={ABOUT_SECTION_RULE_CLASS} aria-hidden />
              <div className="mt-8 flex flex-col gap-6">
                {OVERVIEW_PARAGRAPHS.map((paragraph, index) => (
                  <p
                    key={paragraph}
                    data-about-reveal
                    className={cn(
                      "font-sans text-lg leading-relaxed text-pretty text-foreground/75",
                      index === OVERVIEW_PARAGRAPHS.length - 1 && "font-medium"
                    )}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper
        id="achievements"
        className="scroll-mt-24 bg-cream py-20 md:py-28"
        maxWidth="max-w-none"
      >
        <div
          data-about-section
          className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-[8%]"
        >
          <div data-about-reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className={ABOUT_SECTION_LABEL_CLASS}>Achievements</p>

            <h2 className={cn("mt-5", ABOUT_SECTION_HEADING_CLASS)}>Long story short</h2>

            <div className={ABOUT_SECTION_RULE_CLASS} aria-hidden />

            <div className="mt-8 flex max-w-xl flex-col gap-5">
              {ACHIEVEMENT_STORY_INTRO.map((line, index) => (
                <p
                  key={index}
                  className="font-sans text-lg leading-relaxed text-foreground/80 text-pretty"
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          <ol
            className="overflow-hidden rounded-card bg-primary shadow-card"
            aria-label="Selected musical achievements"
          >
            {ACHIEVEMENTS.map((item, index) => (
              <li
                key={item.title}
                data-about-reveal
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-5 border-b border-on-dark/15 px-6 py-8 last:border-b-0 md:gap-7 md:px-9 md:py-10"
              >
                <span
                  className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border border-on-dark/20 font-mono text-xs font-semibold text-accent"
                  aria-hidden
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 pt-1">
                  <h3 className={cn(featureItemTitleClass, "text-on-dark")}>{item.title}</h3>

                  <ul className="mt-5 flex flex-col gap-3 border-t border-on-dark/15 pt-5">
                    {item.details.map((detail, detailIndex) => (
                      <li
                        key={detailIndex}
                        className={cn(featureItemBodyClass, "relative pl-5 text-on-dark/80")}
                      >
                        <span
                          className="absolute left-0 top-[0.6em] h-[5px] w-[5px] rounded-full bg-accent"
                          aria-hidden
                        />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </SectionWrapper>

      <SectionWrapper
        id="why-me"
        className="scroll-mt-24 bg-background py-20 md:py-28"
        maxWidth="max-w-none"
      >
        <div data-about-section className="mx-auto max-w-7xl">
          <div data-about-reveal className="mx-auto max-w-2xl md:ml-[20%]">
            <SectionHeader
              label="Why me"
              heading={<WhyMeTypewriterHeading />}
              alignment="left"
              className="!mb-0"
              headingClassName={ABOUT_SECTION_HEADING_CLASS}
            />

            <div className={ABOUT_SECTION_RULE_CLASS} aria-hidden />

            <p className="mt-8 font-sans text-lg leading-relaxed text-foreground/80 text-pretty">
              {WHY_ME_INTRO}
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-5 md:mt-20 md:grid-cols-3 md:gap-6">
            {WHY_ME_REASONS.map((reason) => {
              const Icon = reason.icon;
              return (
                <article
                  key={reason.number}
                  data-about-reveal
                  className={cn(
                    "group relative flex min-h-full flex-col gap-6 rounded-card border bg-background p-7 shadow-card md:p-8",
                    reason.accent ? "border-accent/20" : "border-primary/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex h-[40px] w-[40px] shrink-0 items-center justify-center bg-foreground text-on-dark"
                      aria-hidden
                    >
                      <Icon className="h-[20px] w-[20px]" strokeWidth={1.75} />
                    </div>

                    <span className={cn(ABOUT_TAGLINE_CLASS, reason.accent && "text-accent")}>
                      {reason.number}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className={featureItemTitleClass}>
                      {reason.title}
                    </h3>
                    <p className={featureItemBodyClass}>
                      {reason.intro}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-col gap-3 border-t border-primary/10 pt-5">
                    <p className="font-serif text-lg italic leading-snug text-foreground/70 text-balance">
                      {reason.question}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <div
            data-about-reveal
            className="mx-auto mt-14 flex max-w-3xl flex-col items-center border-t border-primary/10 pt-8 text-center"
          >
            <p className={cn(ABOUT_TAGLINE_CLASS, "text-accent")}>
              The difference
            </p>
            <p className="mt-3 font-display text-2xl leading-tight text-primary text-balance not-italic md:text-3xl">
              {WHY_ME_STANDALONE}
            </p>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper id="faq" className="scroll-mt-24" maxWidth="max-w-5xl">
        <div data-about-section className="flex flex-col gap-10">
          <div data-about-reveal className="mx-auto max-w-3xl text-center">
            <SectionHeader
              label="FAQ"
              heading="Questions everyone asks"
              alignment="center"
              className="mb-0"
              headingClassName={ABOUT_SECTION_HEADING_CLASS}
            />
          </div>

          <div className="divide-y divide-primary/10 rounded-card border border-primary/10 bg-background px-6 shadow-card md:px-8">
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
                      <span className={cn(ABOUT_TAGLINE_CLASS, "text-primary/20")}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={faqQuestionClass}>{faq.question}</span>
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
                      "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
                      isOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="max-w-3xl space-y-4 pr-8">
                        {typeof faq.answer === "string" && faq.answer.includes("\n\n") ? (
                          faq.answer.split("\n\n").map((paragraph) => (
                            <p
                              key={paragraph}
                              className={featureItemBodyClass}
                            >
                              {paragraph}
                            </p>
                          ))
                        ) : (
                          <p className={featureItemBodyClass}>
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
