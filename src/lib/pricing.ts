import type { FaqEntry } from "@/lib/faqs";

export type PricingPackageId = "essential" | "signature" | "concierge";

export interface PricingFeature {
  icon: "clock" | "sound" | "music" | "map" | "message" | "recording" | "sparkles";
  title: string;
  description: string;
}

export interface PricingPackage {
  id: PricingPackageId;
  number: string;
  name: string;
  price: string;
  shortDescription: string;
  positioning: string;
  bestFor: string;
  features: PricingFeature[];
  mostChosen?: boolean;
}

export const pricingPackages: PricingPackage[] = [
  {
    id: "essential",
    number: "01",
    name: "Essential",
    price: "R4,500",
    shortDescription: "Focused live cello for one beautiful moment.",
    positioning:
      "The starter option. It sets the mood for one defined part of your event, then leaves the rest of the day to unfold around it.",
    bestFor:
      "Intimate celebrations, corporate openings, and cocktail hours where one hour of live cello is enough to set the tone.",
    features: [
      {
        icon: "clock",
        title: "One focused hour",
        description: "A single, clearly defined part of the event gets the full attention.",
      },
      {
        icon: "sound",
        title: "Simple sound setup",
        description: "Acoustic cello or basic amplification, depending on the room.",
      },
      {
        icon: "music",
        title: "Ready-to-play repertoire",
        description: "I shape the hour from music already in my repertoire.",
      },
      {
        icon: "map",
        title: "Close to Cape Town",
        description: "Travel within a 30 km radius of Cape Town is included.",
      },
      {
        icon: "message",
        title: "Easy coordination",
        description: "We keep the planning clear over WhatsApp or email.",
      },
    ],
  },
  {
    id: "signature",
    number: "02",
    name: "Signature",
    price: "R8,500",
    shortDescription: "The full celebration atmosphere, split across the moments that matter.",
    positioning:
      "The natural fit when the cello needs to do more than make an entrance. Two sessions let the atmosphere carry from one important moment into the next.",
    bestFor:
      "Ceremony plus cocktails, milestone events, galas, and dinners that need a more personal setlist and stronger sound support.",
    mostChosen: true,
    features: [
      {
        icon: "clock",
        title: "Two moments, one atmosphere",
        description: "Two or more hours of playing, split across up to two sessions.",
      },
      {
        icon: "sound",
        title: "Sound that carries",
        description: "Microphone and amplification are available when the room needs them.",
      },
      {
        icon: "music",
        title: "Two songs made personal",
        description: "Your setlist includes two custom song requests alongside the wider repertoire.",
      },
      {
        icon: "map",
        title: "Western Cape covered",
        description: "The package travels to any venue in the Western Cape.",
      },
      {
        icon: "message",
        title: "A little more planning",
        description: "A 30-minute planning call plus priority WhatsApp coordination.",
      },
      {
        icon: "recording",
        title: "One song to keep",
        description: "After the event, I record one chosen song in the studio.",
      },
    ],
  },
  {
    id: "concierge",
    number: "03",
    name: "Concierge",
    price: "R15,000",
    shortDescription: "A fully tailored music experience for luxury events and complex celebrations.",
    positioning:
      "The high-touch option. I reserve the day, work through the venue and sound plan, and build the music around the shape of the event.",
    bestFor:
      "Destination weddings, luxury celebrations, brand events, and days where the music needs to move with a more complex plan.",
    features: [
      {
        icon: "clock",
        title: "The day is yours",
        description: "Three or more hours of playing, with the day reserved around your event.",
      },
      {
        icon: "sparkles",
        title: "Moves with the event",
        description: "On-the-day venue movement and surprise performances are built in.",
      },
      {
        icon: "sound",
        title: "Sound, fully coordinated",
        description: "I work directly with the PA system and sound engineer.",
      },
      {
        icon: "music",
        title: "Arrangements built for you",
        description: "The setlist and custom song arrangements are shaped around the event.",
      },
      {
        icon: "message",
        title: "In the room beforehand",
        description: "An in-person consultation and venue walkthrough remove the guesswork.",
      },
      {
        icon: "map",
        title: "Across South Africa",
        description: "Travel is available anywhere in the country.",
      },
      {
        icon: "recording",
        title: "The finished recording",
        description: "A studio recording of one signature song plus a post-event audio mix.",
      },
    ],
  },
];

export interface ComparisonRow {
  label: string;
  essential: string;
  signature: string;
  concierge: string;
}

export const pricingComparisonRows: ComparisonRow[] = [
  { label: "Investment", essential: "R4,500", signature: "R8,500", concierge: "R15,000" },
  { label: "Playing time", essential: "1 hour", signature: "2+ hours", concierge: "3+ hours" },
  { label: "Event sessions", essential: "One", signature: "Up to two", concierge: "Flexible" },
  {
    label: "Sound",
    essential: "Acoustic or basic amplification",
    signature: "Microphone and amplification",
    concierge: "Full PA coordination",
  },
  {
    label: "Music",
    essential: "Existing repertoire",
    signature: "Two custom requests",
    concierge: "Custom arrangements",
  },
  {
    label: "Planning",
    essential: "WhatsApp or email",
    signature: "Planning call and priority WhatsApp",
    concierge: "In-person consultation and walkthrough",
  },
  { label: "Travel", essential: "30 km from Cape Town", signature: "Western Cape", concierge: "South Africa" },
  {
    label: "Recording",
    essential: "Not included",
    signature: "One chosen song",
    concierge: "Signature song and event mix",
  },
];

export const pricingFaqs: FaqEntry[] = [
  {
    question: "Which package do most people choose?",
    answer:
      "Signature is the natural fit for most weddings and events with more than one important moment. It gives the day room to breathe without turning the planning into a production.",
  },
  {
    question: "Can I split the playing time?",
    answer:
      "Yes, from Signature upwards. Essential is one focused hour. Signature can cover up to two sessions, which works beautifully for a ceremony followed by cocktails. Concierge is built for a more flexible day with movement between spaces.",
  },
  {
    question: "What happens if my venue has more than 100 guests?",
    answer:
      "Signature is usually the right starting point. Bigger rooms and outdoor spaces need proper amplification, and I can work with the venue PA or sound engineer. If the sound plan or event timeline is especially involved, Concierge gives us more room to handle it properly.",
  },
  {
    question: "Can I request a specific song?",
    answer:
      "Yes. Signature includes two custom song requests, while Concierge includes custom arrangements as part of the wider music plan. Essential is selected from my existing repertoire, so it stays focused and straightforward.",
  },
  {
    question: "Is travel included?",
    answer:
      "Essential includes travel within 30 km of Cape Town. Signature covers venues across the Western Cape. Concierge is available anywhere in South Africa, with the final travel plan confirmed around the venue.",
  },
  {
    question: "What if none of the packages quite fits?",
    answer:
      "Tell me what you are planning. A strange timeline, an unusual venue, or one very specific idea is easier to solve in a real conversation than in another row on a table.",
  },
];
