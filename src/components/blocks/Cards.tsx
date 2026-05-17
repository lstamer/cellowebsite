import React from "react";
import Image from "next/image";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { Sparkles, Music, Star } from "lucide-react";

export function FeatureGrid() {
  const features = [
    {
      title: "Solo Performances",
      description: "Elevate your event with the rich, resonant tones of a solo cello performance tailored to your unique vision.",
      icon: Music,
    },
    {
      title: "Chamber Ensembles",
      description: "Collaborative performances with other talented musicians, bringing classical masterworks to life.",
      icon: Sparkles,
    },
    {
      title: "Studio Recording",
      description: "Professional session playing with sight-reading expertise and improvisational flexibility.",
      icon: Star,
    },
  ];

  return (
    <SectionWrapper>
      <SectionHeader 
        label="Musical Services" 
        heading="Bringing exquisite artistry and profound emotion." 
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {features.map((feature, idx) => (
          <div 
            key={idx} 
            className="flex flex-col p-8 bg-surface-dark rounded-card shadow-card hover:shadow-card-hover transition-all duration-300 border border-primary/10 group"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300 shrink-0">
              <feature.icon className="w-7 h-7 text-primary group-hover:text-background transition-colors duration-300" />
            </div>
            <h3 className="font-display text-2xl mb-4 text-foreground">{feature.title}</h3>
            <p className="text-foreground/70 font-sans leading-relaxed flex-grow">
              {feature.description}
            </p>
            <div className="mt-8 pt-6 border-t border-primary/10">
              <button className="text-primary font-jost text-sm tracking-widest uppercase hover:text-accent transition-colors flex items-center gap-2">
                Learn More <span className="text-lg">→</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function BentoGrid() {
  return (
    <SectionWrapper>
      <SectionHeader 
        label="A Life in Music" 
        heading="Exploring the intersections of classical tradition and modern innovation."
      />
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 mt-12 h-auto md:h-[40rem]">
        {/* Large Featured Item */}
        <div className="md:col-span-2 md:row-span-2 relative rounded-card overflow-hidden shadow-card group min-h-[24rem]">
          <Image 
            src="/images/heroImage.jpeg" 
            alt="Cello performance" 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105 grayscale hover:grayscale-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 w-full flex flex-col items-start">
            <h3 className="font-serif text-3xl mb-3 text-foreground">The Art of Resonance</h3>
            <p className="text-foreground/80 font-sans mb-6 max-w-md">
              Discovering the depths of emotional expression through the timeless voice of the cello.
            </p>
            <Button href="#watch" variant="secondary" size="sm">
              Watch Performance
            </Button>
          </div>
        </div>

        {/* Top Right Small Item */}
        <div className="md:col-span-2 bg-surface-dark rounded-card p-8 shadow-card flex flex-col justify-center relative overflow-hidden group border border-primary/5">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
          <h4 className="font-display text-2xl mb-3 text-foreground relative z-10">Masterclasses</h4>
          <p className="text-foreground/70 font-sans relative z-10 max-w-sm">
            Passing on the tradition to the next generation of cellists through focused, intensive instruction and personalized mentorship.
          </p>
        </div>

        {/* Bottom Right Split Items */}
        <div className="bg-primary rounded-card p-6 shadow-card flex flex-col items-center justify-center text-center group transition-colors duration-300 hover:bg-accent cursor-pointer">
          <Sparkles className="w-10 h-10 text-background mb-4 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110" />
          <h4 className="font-display text-xl text-background">Repertoire</h4>
          <p className="text-background/80 font-sans text-sm mt-2">
            From Bach to Contemporary
          </p>
        </div>

        <div className="bg-surface-dark rounded-card p-6 shadow-card flex flex-col justify-between border border-primary/10 group hover:border-primary/30 transition-colors duration-300 cursor-pointer relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          <h4 className="font-jost text-sm tracking-widest text-primary uppercase mb-4 relative z-10">Latest Release</h4>
          <div className="relative z-10">
            <div className="font-serif text-xl text-foreground mb-1">Cello Suites</div>
            <div className="text-foreground/60 font-sans text-sm">J.S. Bach</div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}

export function ProcessCards() {
  const steps = [
    {
      number: "01",
      title: "Consultation",
      description: "We begin with a detailed discussion of your musical needs, event atmosphere, and repertoire preferences.",
    },
    {
      number: "02",
      title: "Curation",
      description: "I carefully select and arrange pieces that perfectly complement the narrative and tone of your occasion.",
    },
    {
      number: "03",
      title: "Preparation",
      description: "Rigorous rehearsal and preparation to ensure a flawless, emotionally resonant performance.",
    },
    {
      number: "04",
      title: "Performance",
      description: "Delivering an unforgettable musical experience that elevates your event to the extraordinary.",
    },
  ];

  return (
    <SectionWrapper>
      <SectionHeader 
        label="The Approach" 
        heading="A meticulous process designed to deliver exceptional musical experiences."
      />
      <div className="flex flex-col md:flex-row gap-6 mt-16 relative">
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-[2.5rem] left-[10%] w-[80%] h-px bg-primary/20 z-0" />
        
        {steps.map((step, idx) => (
          <div key={idx} className="flex-1 relative z-10">
            <div className="flex flex-col items-center md:items-start text-center md:text-left group">
              {/* Number Badge */}
              <div className="w-20 h-20 rounded-full bg-surface-dark border border-primary/20 flex items-center justify-center mb-8 shadow-card shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:border-primary group-hover:bg-primary/5">
                <span className="font-jost text-2xl text-primary font-bold">{step.number}</span>
              </div>
              
              {/* Content */}
              <div className="bg-surface-dark rounded-card p-8 shadow-card h-full w-full border border-primary/5 group-hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <h3 className="font-display text-xl mb-4 text-foreground">{step.title}</h3>
                <p className="text-foreground/70 font-sans text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}