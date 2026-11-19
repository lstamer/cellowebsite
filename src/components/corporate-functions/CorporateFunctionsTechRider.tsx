import Image from "next/image";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import riderContent from "@/content/corporate-functions-tech-rider.json";

export function CorporateFunctionsTechRider() {
  return (
    <SectionWrapper id="tech-rider" surface="cream" className="py-12! md:py-20!">
      <div className="grid grid-cols-[minmax(0,1fr)_24%] items-center gap-x-3 border-y border-primary/25 py-6 md:grid-cols-[minmax(0,1fr)_32%] md:py-9">
        <SectionHeader
          label={riderContent.sectionLabel}
          heading={riderContent.heading}
          alignment="left"
          className="mb-0 md:mb-0"
          labelClassName="mb-3 pl-0 font-semibold text-primary uppercase before:hidden"
          headingClassName="max-w-[14ch] font-display not-italic text-[clamp(2.5rem,5vw,5rem)] leading-[0.96] md:text-[clamp(2.5rem,5vw,5rem)] lg:text-[clamp(2.5rem,5vw,5rem)]"
        />
        <Image
          src="/images/brand/stamer-scroll.webp"
          alt="Stamer Cello"
          width={512}
          height={512}
          unoptimized
          className="h-auto w-full justify-self-end md:col-start-2 md:row-span-2 md:row-start-1"
        />
        <div className="col-span-2 mt-5 md:col-span-1 md:col-start-1 md:mt-7">
          <p className="max-w-[46ch] font-sans text-base leading-relaxed text-pretty text-foreground/75">
            {riderContent.intro}
          </p>
          <Button
            href={riderContent.downloadHref}
            download
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            className="mt-5 w-full gap-2 hover:bg-surface-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:transform-none sm:w-auto"
          >
            <Download aria-hidden="true" size={17} />
            {riderContent.downloadLabel}
          </Button>
        </div>
      </div>
    </SectionWrapper>
  );
}
