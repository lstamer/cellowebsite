export interface SanitySlug {
  current?: string | null;
}

export interface SanityImageAsset {
  _ref?: string | null;
}

export interface SanityImage {
  _type?: "image";
  _key?: string;
  asset?: SanityImageAsset | null;
  alt?: string | null;
}

export interface PortableTextChild {
  _type?: string;
  text?: string | null;
}

export interface PortableTextBlock {
  _type?: string;
  children?: PortableTextChild[] | null;
}

export type SanityBodyNode = PortableTextBlock | SanityImage | Record<string, unknown>;

export interface SanityPost {
  _id: string;
  title: string;
  slug: SanitySlug;
  publishedAt: string;
  excerpt?: string;
  category?: string;
  mainImage?: SanityImage | null;
  body: SanityBodyNode[];
}
