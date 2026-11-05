import Image from "next/image";
import { featureItemBodyClass, featureItemTitleClass } from "@/lib/typography-classes";
import { cn } from "@/lib/utils";

const auditionSteps = [
  {
    icon: "/images/hotels/audition-badge.webp",
    title: "A private audition",
    body: "I come to your property and play a few different styles for you and your team. We talk about your guests, existing events and where the music could fit.",
  },
  {
    icon: "/images/hotels/complimentary-badge.webp",
    title: "One complimentary event",
    body: "If you like what you hear, I'll play at one event you already host, free of charge. See how the music fits the room and how your guests respond.",
  },
  {
    icon: "/images/hotels/recurring-badge.webp",
    title: "A rhythm that suits you",
    body: "Only if it feels right, we work out a recurring arrangement around your calendar and budget. There's no obligation to continue after the audition or complimentary event.",
  },
];

export function HotelAuditionSteps() {
  return (
    <ol role="list" className="mt-12 grid list-none gap-8 p-0 md:grid-cols-3">
      {auditionSteps.map((step, index) => (
        <li key={step.title} className="relative isolate grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-4 md:flex md:flex-col md:items-center md:text-center">
          {index < auditionSteps.length - 1 && (
            <span
              aria-hidden
              className="absolute -z-10 left-9 top-9 h-[calc(100%+2rem)] w-[2px] -translate-x-1/2 bg-accent md:left-1/2 md:top-14 md:h-[2px] md:w-[calc(100%+2rem)] md:translate-x-0 md:-translate-y-1/2"
            />
          )}
          <Image
            src={step.icon}
            alt=""
            width={256}
            height={256}
            sizes="(min-width: 768px) 112px, 72px"
            className="h-auto w-[4.5rem] md:w-28"
          />
          <div className="min-w-0 md:w-full">
            <h3 className={featureItemTitleClass}>{step.title}</h3>
            <p className={cn(featureItemBodyClass, "mt-3")}>{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
