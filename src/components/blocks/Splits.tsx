import React from "react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { Check } from "lucide-react";

export const ImageRightSplit = () => {
  return (
    <SectionWrapper className="bg-cream">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="flex flex-col items-start gap-8">
          <SectionHeader 
            label="The journey"
            heading="Mastering the Strings"
            alignment="left"
            className="mb-0"
          />
          <p className="font-sans text-lg text-foreground/80 leading-relaxed max-w-lg">
            Discover the passion and dedication required to master the cello. Each performance is a culmination of years of rigorous practice and emotional exploration, bringing classical and modern compositions to life.
          </p>
          <Button href="#listen" variant="primary" className="mt-4">
            Listen to Recordings
          </Button>
        </div>
        <div className="relative w-full min-h-[30rem] lg:min-h-[40rem] rounded-card overflow-hidden shadow-card transition-shadow duration-300 hover:shadow-card-hover">
          <Image 
            src="/images/heroImage.jpeg" 
            alt="Cello Performance" 
            fill
            sizes="(max-width: 64rem) 100vw, 50vw"
            className="object-cover grayscale"
          />
        </div>
      </div>
    </SectionWrapper>
  );
};

export const ImageLeftWithList = () => {
  return (
    <SectionWrapper className="bg-surface-dark">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="relative w-full min-h-[30rem] lg:min-h-[40rem] rounded-card overflow-hidden shadow-card order-2 lg:order-1 transition-shadow duration-300 hover:shadow-card-hover">
          <Image 
            src="/images/heroImage.jpeg" 
            alt="Teaching the Cello" 
            fill
            sizes="(max-width: 64rem) 100vw, 50vw"
            className="object-cover grayscale"
          />
        </div>
        <div className="flex flex-col items-start gap-8 order-1 lg:order-2">
          <SectionHeader 
            label="Learn from a maestro"
            heading="Private Mentorship"
            alignment="left"
            className="mb-0"
          />
          <p className="font-sans text-lg text-foreground/80 leading-relaxed max-w-lg">
            Elevate your playing with personalized instruction designed to refine your technique and expand your musicality.
          </p>
          <ul className="flex flex-col gap-5 w-full mt-4">
            {[
              "Advanced bowing techniques",
              "Interpretive masterclasses",
              "Audition preparation",
              "Repertoire building"
            ].map((item, index) => (
              <li key={index} className="flex items-center gap-4 text-foreground font-sans text-lg">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                  <Check size={20} />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <Button href="#book" variant="primary" className="mt-4">
            Book a Lesson
          </Button>
        </div>
      </div>
    </SectionWrapper>
  );
};

export const AlternatingSplit = () => {
  return (
    <SectionWrapper className="bg-surface-darker">
      <div className="flex flex-col gap-24 lg:gap-32">
        {/* Row 1: Text Left, Image Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="flex flex-col items-start gap-6 lg:pr-8">
            <h3 className="font-display text-4xl lg:text-5xl text-foreground tracking-tight">
              Symphonic Engagements
            </h3>
            <p className="font-sans text-lg text-foreground/80 leading-relaxed">
              As a principal cellist, performing with world-renowned symphony orchestras brings the grandest classical compositions to life. Experience the powerful resonance of a full string section and the breathtaking synergy of master musicians.
            </p>
            <Button href="#schedule" variant="secondary" className="mt-4">
              View Schedule
            </Button>
          </div>
          <div className="relative w-full min-h-[25rem] lg:min-h-[35rem] rounded-card overflow-hidden shadow-card">
            <Image 
              src="/images/heroImage.jpeg" 
              alt="Symphony Performance" 
              fill
              sizes="(max-width: 64rem) 100vw, 50vw"
              className="object-cover grayscale"
            />
          </div>
        </div>

        {/* Row 2: Image Left, Text Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative w-full min-h-[25rem] lg:min-h-[35rem] rounded-card overflow-hidden shadow-card order-2 lg:order-1">
            <Image 
              src="/images/heroImage.jpeg" 
              alt="Chamber Music" 
              fill
              sizes="(max-width: 64rem) 100vw, 50vw"
              className="object-cover grayscale"
            />
          </div>
          <div className="flex flex-col items-start gap-6 lg:pl-8 order-1 lg:order-2">
            <h3 className="font-display text-4xl lg:text-5xl text-foreground tracking-tight">
              Chamber Ensembles
            </h3>
            <p className="font-sans text-lg text-foreground/80 leading-relaxed">
              The intimate setting of a string quartet allows for profound musical conversations. Discover the nuanced interplay and delicate harmonies of chamber music performances in exclusive, acoustic venues.
            </p>
            <Button href="#ensembles" variant="secondary" className="mt-4">
              Explore Ensembles
            </Button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};