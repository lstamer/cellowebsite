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
