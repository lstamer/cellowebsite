import type { MetadataRoute } from "next";

const siteUrl = "https://stamer.co.za";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1, changeFrequency: "monthly" as const },
    { path: "/services/weddings", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/services/private-events", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/services/corporate-functions", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.7, changeFrequency: "yearly" as const },
    { path: "/book", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.2, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.2, changeFrequency: "yearly" as const },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    changeFrequency,
    priority,
  }));
}
