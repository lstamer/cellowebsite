/**
 * Gallery / content library data.
 *
 * Nine performance videos, three per audience. Video sources are not wired yet
 * (`videoSrc` stays null until the clips are cut); posters use existing site
 * photography so the grid reads like the real thing today.
 */

export type GalleryCategory = "weddings" | "celebrations" | "corporate";

export type GalleryFilter = "all" | GalleryCategory;

export interface GalleryCategoryMeta {
  id: GalleryCategory;
  /** Tab label in the dock */
  label: string;
  /** One-line descriptor shown beside the dock when selected */
  descriptor: string;
  /** Where this audience's service page lives */
  serviceHref: string;
}

export interface GalleryItem {
  slug: string;
  title: string;
  /** Songwriter(s). Shown inline beneath the title. */
  composer: string;
  /** The recording most people know it from */
  knownFrom: string;
  category: GalleryCategory;
  /** Track length, mm:ss */
  duration: string;
  /** Poster still (existing site photography for now) */
  poster: string;
  posterAlt: string;
  /** Intentional focal point for the poster crop */
  posterPosition: "object-center" | "object-left" | "object-right" | "object-top";
  /** Short first-person note for the tile hover and the detail page */
  blurb: string;
  /** Where in the day this one lands best */
  bestFor: string;
  /** Future video source. Null until the clip exists. */
  videoSrc: string | null;
}

export const GALLERY_CATEGORIES: GalleryCategoryMeta[] = [
  {
    id: "weddings",
    label: "Weddings",
    descriptor: "The aisle, the signing, the first dance. Songs people cry to, in the good way.",
    serviceHref: "/services/weddings",
  },
  {
    id: "celebrations",
    label: "Celebrations",
    descriptor: "Birthdays, anniversaries, long dinners. The songs that get a whole table singing.",
    serviceHref: "/services/private-events",
  },
  {
    id: "corporate",
    label: "Corporate",
    descriptor: "Arrivals, awards, the moment your CEO walks on. Familiar songs, played with restraint.",
    serviceHref: "/services/corporate-functions",
  },
];

export const ALL_FILTER_DESCRIPTOR =
  "Everything in one place. Weddings, celebrations, and the corporate stuff.";

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    slug: "a-thousand-years",
    title: "A Thousand Years",
    composer: "Christina Perri, David Hodges",
    knownFrom: "Christina Perri",
    category: "weddings",
    duration: "4:12",
    poster: "/images/wedding-vineyard-editorial.png",
    posterAlt: "Luke playing cello at a vineyard wedding ceremony",
    posterPosition: "object-center",
    blurb:
      "The walk down the aisle song. I've played it more times than I can count and it still gets me. Slow, steady, and it lands right as the doors open.",
    bestFor: "The processional",
    videoSrc: null,
  },
  {
    slug: "endless-love",
    title: "Endless Love",
    composer: "Lionel Richie",
    knownFrom: "Diana Ross & Lionel Richie",
    category: "weddings",
    duration: "3:58",
    poster: "/images/wedding.jpg",
    posterAlt: "Cello performance during a wedding ceremony",
    posterPosition: "object-center",
    blurb:
      "A duet with one cello. The melody passes between the low and high strings, so it feels like two voices even though it's just me and the bow.",
    bestFor: "Signing the register",
    videoSrc: null,
  },
  {
    slug: "story-of-my-life",
    title: "Story of My Life",
    composer: "Jamie Scott, John Ryan, Julian Bunetta",
    knownFrom: "One Direction",
    category: "weddings",
    duration: "3:41",
    poster: "/images/about/luke-garden-cello.png",
    posterAlt: "Luke with his cello in a garden setting",
    posterPosition: "object-top",
    blurb:
      "Honestly, this one surprises people. Strip the production away and it's a folk song with a huge chorus. Perfect for the walk back up the aisle.",
    bestFor: "The recessional",
    videoSrc: null,
  },
  {
    slug: "sway",
    title: "Sway",
    composer: "Pablo Beltrán Ruiz, Luis Demetrio",
    knownFrom: "Dean Martin",
    category: "celebrations",
    duration: "2:54",
    poster: "/images/celebrations-hero.jpg",
    posterAlt: "Guests at a candlelit celebration dinner",
    posterPosition: "object-center",
    blurb:
      "Mambo on a cello. The rhythm does the heavy lifting, so this is the one that gets shoulders moving before anyone has decided to dance.",
    bestFor: "Cocktails and arrivals",
    videoSrc: null,
  },
  {
    slug: "cant-take-my-eyes-off-you",
    title: "Can't Take My Eyes Off You",
    composer: "Bob Crewe, Bob Gaudio",
    knownFrom: "Frankie Valli",
    category: "celebrations",
    duration: "3:22",
    poster: "/images/private-event-celebration-candlelit.png",
    posterAlt: "Candlelit private event with live cello",
    posterPosition: "object-center",
    blurb:
      "Quiet verse, then the brass hook everyone knows. I play the verse straight and let the room shout the chorus. They always do.",
    bestFor: "The toast",
    videoSrc: null,
  },
  {
    slug: "we-are-the-champions",
    title: "We Are the Champions",
    composer: "Freddie Mercury",
    knownFrom: "Queen",
    category: "celebrations",
    duration: "3:05",
    poster: "/images/private-events-editorial.png",
    posterAlt: "Luke performing at a private celebration",
    posterPosition: "object-center",
    blurb:
      "A milestone birthday needs an anthem. Freddie wrote this for a stadium, and it turns out a cello can fill a dining room the same way.",
    bestFor: "Cake, speeches, the big reveal",
    videoSrc: null,
  },
  {
    slug: "angels",
    title: "Angels",
    composer: "Robbie Williams, Guy Chambers",
    knownFrom: "Robbie Williams",
    category: "corporate",
    duration: "4:26",
    poster: "/images/corporate-functions-hero.png",
    posterAlt: "Live cello at a corporate function",
    posterPosition: "object-center",
    blurb:
      "The end-of-year song. Everyone knows it, nobody expects it on a cello, and it gives a room full of colleagues permission to feel something.",
    bestFor: "Year-end functions",
    videoSrc: null,
  },
  {
    slug: "my-gift-is-my-song",
    title: "My Gift Is My Song",
    composer: "Elton John, Bernie Taupin",
    knownFrom: "Elton John, Your Song",
    category: "corporate",
    duration: "3:49",
    poster: "/images/corporate-events-editorial.png",
    posterAlt: "Cello performance at an editorial-style corporate event",
    posterPosition: "object-center",
    blurb:
      "Your Song, really. Warm, unhurried, and it sits perfectly under conversation. This is what I play while guests find their seats.",
    bestFor: "Arrivals and dinner",
    videoSrc: null,
  },
  {
    slug: "fly-me-to-the-moon",
    title: "Fly Me to the Moon",
    composer: "Bart Howard",
    knownFrom: "Frank Sinatra",
    category: "corporate",
    duration: "2:47",
    poster: "/images/corporate-functions-importance.jpg",
    posterAlt: "Guests at a corporate gala with live cello",
    posterPosition: "object-center",
    blurb:
      "Sinatra with a bow. Light swing, no fuss, and it makes a hotel ballroom feel like a jazz club for three minutes. Award nights love it.",
    bestFor: "Awards and walk-ups",
    videoSrc: null,
  },
];

/** First credited writer only, for tight tile metadata. */
export function primaryArtist(item: GalleryItem): string {
  return item.composer.split(",")[0].trim();
}

export function getGalleryItem(slug: string): GalleryItem | undefined {
  return GALLERY_ITEMS.find((item) => item.slug === slug);
}

export function getGalleryCategory(id: GalleryCategory): GalleryCategoryMeta {
  const meta = GALLERY_CATEGORIES.find((category) => category.id === id);
  if (!meta) throw new Error(`Unknown gallery category: ${id}`);
  return meta;
}

export function getRelatedItems(item: GalleryItem): GalleryItem[] {
  return GALLERY_ITEMS.filter(
    (candidate) => candidate.category === item.category && candidate.slug !== item.slug
  );
}

export function filterGalleryItems(filter: GalleryFilter): GalleryItem[] {
  if (filter === "all") return GALLERY_ITEMS;
  return GALLERY_ITEMS.filter((item) => item.category === filter);
}
