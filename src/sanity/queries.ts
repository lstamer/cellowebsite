import { client } from "./client";
import type { SanityPost } from "./types";

export async function getAllPosts(): Promise<SanityPost[]> {
  return client.fetch(
    `*[_type == "post"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      category,
      mainImage { asset, alt }
    }`,
    {},
    { next: { revalidate: 60 } }
  );
}

export async function getPostBySlug(slug: string): Promise<SanityPost | null> {
  return client.fetch(
    `*[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      category,
      mainImage { asset, alt },
      body
    }`,
    { slug },
    { next: { revalidate: 60 } }
  );
}

export async function getAllPostSlugs(): Promise<{ slug: string }[]> {
  return client.fetch(
    `*[_type == "post"] { "slug": slug.current }`,
    {},
    { next: { revalidate: 60 } }
  );
}

export async function getRelatedPosts(
  currentId: string,
  category?: string,
  limit = 3
): Promise<SanityPost[]> {
  // Prefer same category, fall back to most recent
  const query = category
    ? `*[_type == "post" && _id != $currentId && category == $category] | order(publishedAt desc) [0...$limit] {
        _id, title, slug, publishedAt, excerpt, category, mainImage { asset, alt }
      }`
    : `*[_type == "post" && _id != $currentId] | order(publishedAt desc) [0...$limit] {
        _id, title, slug, publishedAt, excerpt, category, mainImage { asset, alt }
      }`;

  const posts = await client.fetch<SanityPost[]>(
    query,
    { currentId, category: category ?? "", limit },
    { next: { revalidate: 60 } }
  );

  // If category filter returned fewer than limit, backfill with recent posts
  if (posts.length < limit && category) {
    const backfill = await client.fetch<SanityPost[]>(
      `*[_type == "post" && _id != $currentId && !(_id in $existingIds)] | order(publishedAt desc) [0...$backfillLimit] {
        _id, title, slug, publishedAt, excerpt, category, mainImage { asset, alt }
      }`,
      {
        currentId,
        existingIds: posts.map((p) => p._id),
        backfillLimit: limit - posts.length,
      },
      { next: { revalidate: 60 } }
    );
    return [...posts, ...backfill];
  }

  return posts;
}
