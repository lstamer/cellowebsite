import type { NextConfig } from "next";

// Enforce the resource allowlist after browser checks of Maps, Turnstile and
// Next's static bootstrap. Admin responses use a stricter nonce policy in proxy.
const resourcePolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://maps.googleapis.com https://maps.gstatic.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.googleapis.com https://*.gstatic.com https://*.google.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.googleapis.com https://*.gstatic.com https://challenges.cloudflare.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  "frame-src https://challenges.cloudflare.com",
  "media-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        // Only the approved testimonial avatar needs a remote image fetch.
        pathname: "/photo-1494790108377-be9c29b29330",
        search: "?w=100&h=100&fit=crop",
      },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "64kb" },
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        {
          key: "Content-Security-Policy",
          // Next's development tooling needs eval and local websocket access.
          // Keep resource enforcement on production builds only.
          value: process.env.NODE_ENV === "development"
            ? "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'"
            : resourcePolicy,
        },
      ],
    }];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.stamer.co.za" }],
        destination: "https://stamer.co.za/:path*",
        permanent: true,
      },
      {
        source: "/blog",
        destination: "/",
        permanent: true,
      },
      {
        source: "/blog/:slug*",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
