import { Avatar } from "@/components/ui/Avatar";
import { testimonials } from "@/lib/testimonials";

const hotelTestimonial = testimonials.find((testimonial) => testimonial.name === "Marcus Reed");

export function HotelTestimonial() {
  if (!hotelTestimonial) return null;

  const { quote, highlight, name, image, initials } = hotelTestimonial;
  const highlightStart = highlight ? quote.indexOf(highlight) : -1;

  return (
    <figure className="self-center rounded-card bg-rose px-7 py-9 text-foreground shadow-card sm:px-10 sm:py-12">
      <span aria-hidden className="-mb-6 block select-none font-serif text-7xl leading-none text-foreground/20 md:-mb-8 md:text-8xl">
        &ldquo;
      </span>

      <blockquote>
        <p className="font-display text-2xl leading-snug text-foreground text-pretty sm:text-3xl">
          {highlight && highlightStart >= 0 ? (
            <>
              {quote.slice(0, highlightStart)}
              <mark className="box-decoration-clone bg-transparent bg-[linear-gradient(var(--color-background),var(--color-background))] bg-size-[100%_0.34em] bg-position-[0_92%] bg-no-repeat text-foreground">
                {highlight}
              </mark>
              {quote.slice(highlightStart + highlight.length)}
            </>
          ) : quote}
        </p>
      </blockquote>

      <figcaption className="mt-8 flex items-center gap-4 border-t border-foreground/15 pt-6">
        <Avatar
          src={image}
          alt=""
          fallback={initials}
          size="md"
          className="border border-foreground/20"
        />
        <div>
          <p className="font-display text-lg font-semibold leading-tight text-foreground">{name}</p>
          <p className="mt-0.5 font-sans text-sm text-foreground/70">Hotel client · COO farewell event</p>
        </div>
      </figcaption>
    </figure>
  );
}
