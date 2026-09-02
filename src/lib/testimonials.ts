export type TestimonialOccasion =
  | "wedding"
  | "private-event"
  | "corporate"
  | "general";

export interface TestimonialData {
  quote: string;
  name: string;
  descriptor: string;
  initials: string;
  image: string;
  occasion: TestimonialOccasion;
}

export const testimonials: TestimonialData[] = [
  {
    quote:
      "I was blown away… the guests couldn’t stop talking about the cello. I will recommend Luke any time to anyone. Bless him and his talent as he continues to live his gift out at other venues 🙏",
    name: "Violet Gordon",
    descriptor: "Kirstenhof SAPS",
    initials: "VG",
    image: "/images/testimonials/violet-gordon.jpeg",
    occasion: "general",
  },
  {
    quote:
      "You are so talented, Luke! I come from a family of musicians, and have never heard the cello played the way you play it. Will definitely be using you in the future",
    name: "Louise Hill",
    descriptor: "Event Manager",
    initials: "LH",
    image: "/images/testimonials/louise-hill.jpeg",
    occasion: "general",
  },
  {
    quote:
      "A friend of mine recommended Luke for a celebration for our faculty, and I could not be happier. His performance was lively, captivating, and absolutely wowed the attendees.",
    name: "Organiser",
    descriptor: "University of Stellenbosch",
    initials: "US",
    image: "/images/testimonials/organiser-stellenbosch.jpeg",
    occasion: "corporate",
  },
  {
    quote:
      "We met Luke at Cavendish and hired him for our wedding in April. He went above and beyond with including all of our favourite songs in his setlist. It was truly special - thank you Luke!",
    name: "Sophie & Bart",
    descriptor: "Wedding in Franschhoek",
    initials: "SB",
    image: "/images/testimonials/sophie-and-bart.jpeg",
    occasion: "wedding",
  },
  {
    quote:
      "We had a very sentimental farewell for our COO, and Luke’s cello playing made for a more special night than I could've hoped for.",
    name: "Marcus Reed",
    descriptor: "Hotel Client",
    initials: "MR",
    image: "/images/testimonials/marcus-reed.jpeg",
    occasion: "corporate",
  },
  {
    quote:
      "From our first interaction, working with Luke was effortless and professional. He handled our requests and mitigated a lot of the stress from planning our wedding.",
    name: "Amara & Liam",
    descriptor: "Wedding Clients",
    initials: "AL",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    occasion: "wedding",
  },
];

export const weddingTestimonials = testimonials.filter(
  (testimonial) => testimonial.occasion === "wedding"
);
