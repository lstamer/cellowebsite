import { urlFor } from "@/sanity/lib/image";
import type { SanityImage, SanitySlug } from "@/sanity/types";

export function hasImageAsset(image?: SanityImage | null): image is SanityImage & {
  asset: { _ref: string };
} {
  return typeof image?.asset?._ref === "string" && image.asset._ref.length > 0;
}

export function getSafeImageUrl(
  image?: SanityImage | null,
  dimensions?: { width?: number; height?: number }
): string | undefined {
  if (!hasImageAsset(image)) {
    return undefined;
  }

  try {
    let builder = urlFor(image);

    if (dimensions?.width) {
      builder = builder.width(dimensions.width);
    }

    if (dimensions?.height) {
      builder = builder.height(dimensions.height);
    }

    return builder.url();
  } catch {
    return undefined;
  }
}

export function formatSanityDate(dateStr?: string | null): string {
  if (!dateStr) {
    return "Date coming soon";
  }

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return "Date coming soon";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getSafeSlug(slug?: SanitySlug | null): string | undefined {
  if (typeof slug?.current !== "string") {
    return undefined;
  }

  const trimmedSlug = slug.current.trim();

  return trimmedSlug || undefined;
}
