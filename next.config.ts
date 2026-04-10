import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/blog/left-hand-fundamentals-clean-intonation",
        destination: "/blog/questions-to-ask-before-booking-cellist",
        permanent: true,
      },
      {
        source: "/blog/stage-fright-performing-under-pressure",
        destination: "/blog/what-professional-cellist-brings-to-events",
        permanent: true,
      },
      {
        source: "/blog/bach-cello-suites-where-to-begin",
        destination: "/blog/wedding-ceremony-music-guide-cape-town",
        permanent: true,
      },
      {
        source: "/blog/choosing-a-bow-what-actually-matters",
        destination: "/blog/what-professional-cellist-brings-to-events",
        permanent: true,
      },
      {
        source: "/blog/finding-your-sound-cello-tone-production",
        destination: "/blog/what-professional-cellist-brings-to-events",
        permanent: true,
      },
      {
        source: "/blog/practice-room-habits-that-last",
        destination: "/blog/questions-to-ask-before-booking-cellist",
        permanent: true,
      },
      {
        source: "/blog/on-playing-dvorak-cello-concerto",
        destination: "/blog/what-professional-cellist-brings-to-events",
        permanent: true,
      },
      {
        source: "/blog/playing-for-weddings-what-ive-learned",
        destination: "/blog/wedding-music-lessons-after-200-events",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
