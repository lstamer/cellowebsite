export interface SanityPost {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  excerpt: string;
  category?: string;
  mainImage?: {
    asset: { _ref: string };
    alt?: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any[];
}
