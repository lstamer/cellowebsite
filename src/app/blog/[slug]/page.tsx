import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getPostBySlug, getAllPostSlugs, getRelatedPosts } from "@/sanity/queries";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import type { SanityBodyNode, SanityImage } from "@/sanity/types";
import { formatSanityDate, getSafeImageUrl, getSafeSlug } from "@/sanity/safe";
import { PortableText } from "@portabletext/react";
import { PostContentWrapper } from "@/components/blog/PostContentWrapper";
import { ArticleHeader } from "@/components/blog/ArticleHeader";
import { Navbar } from "@/components/Navbar";

export const revalidate = 60;

interface PortableTextLinkValue {
  href?: string | null;
}

function estimateReadingTime(body: SanityBodyNode[] | null | undefined): number {
  if (!Array.isArray(body) || body.length === 0) return 1;

  const text = body
    .filter((block) => block?._type === "block")
    .map((block) =>
      (Array.isArray(block.children) ? block.children : [])
        .map((child) => child.text || "")
        .join(" ")
    )
    .filter(Boolean)
    .join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 250));
}

function getSafeHref(href?: string | null): string | undefined {
  if (!href) {
    return undefined;
  }

  const trimmedHref = href.trim();

  if (!trimmedHref) {
    return undefined;
  }

  if (
    trimmedHref.startsWith("/") ||
    trimmedHref.startsWith("#") ||
    trimmedHref.startsWith("mailto:") ||
    trimmedHref.startsWith("tel:")
  ) {
    return trimmedHref;
  }

  try {
    const parsedUrl = new URL(trimmedHref);

    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return trimmedHref;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export async function generateStaticParams() {
  const posts = await getAllPostSlugs();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const ogImage = getSafeImageUrl(post.mainImage, { width: 1200, height: 630 });

  return {
    title: `${post.title} — Stamer Cello`,
    description: post.excerpt || `Read "${post.title}" on the Stamer Cello journal.`,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: "article",
      publishedTime: post.publishedAt,
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = formatSanityDate(post.publishedAt);
  const readingTime = estimateReadingTime(post.body);
  const relatedPosts = await getRelatedPosts(post._id, post.category, 3);
  const safeBody = Array.isArray(post.body) ? post.body : [];

  const imageUrl = getSafeImageUrl(post.mainImage);

  return (
    <>
      <Navbar forceBackground />
      <main className="bg-background min-h-screen pt-32 pb-24">
        <SectionWrapper maxWidth="max-w-5xl" className="md:px-8">
          <ArticleHeader
            title={post.title}
            category={post.category}
            formattedDate={formattedDate}
            readingTime={readingTime}
            imageUrl={imageUrl}
            imageAlt={post.mainImage?.alt}
          />

          {/* Article Body */}
          <div className="font-sans text-lg md:text-xl leading-relaxed text-foreground/80 grid grid-cols-1 gap-8 max-w-[65ch] mx-auto">
            {safeBody.length > 0 ? (
              <PostContentWrapper>
                <PortableText
                  value={safeBody}
                  components={{
                    types: {
                      image: ({ value }: { value: SanityImage }) => {
                        const inlineImageUrl = getSafeImageUrl(value);

                        if (!inlineImageUrl) {
                          return (
                            <div className="my-12 rounded-xl border border-foreground/10 bg-foreground/5 px-6 py-8 text-center">
                              <p className="font-mono text-xs uppercase tracking-widest text-foreground/40">
                                Image unavailable
                              </p>
                              {value?.alt && (
                                <p className="mt-3 font-sans text-sm text-foreground/60">
                                  {value.alt}
                                </p>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div className="relative w-full aspect-[4/3] my-12 rounded-xl overflow-hidden shadow-lg border border-foreground/10 bg-surface-dark/5">
                            <Image
                              src={inlineImageUrl}
                              alt={value.alt || "Post image"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        );
                      },
                    },
                    block: {
                      h1: ({ children }) => (
                        <h1 className="font-display text-4xl font-bold mt-16 mb-8 text-foreground">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="font-display text-3xl font-semibold mt-16 mb-6 text-foreground">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="font-display text-2xl font-semibold mt-12 mb-4 text-foreground">
                          {children}
                        </h3>
                      ),
                      h4: ({ children }) => (
                        <h4 className="font-display text-xl font-medium mt-10 mb-4 text-foreground">
                          {children}
                        </h4>
                      ),
                      normal: ({ children }) => (
                        <p className="mb-6">{children}</p>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-accent pl-6 py-2 my-10 font-serif italic text-2xl text-foreground/70 bg-foreground/5 rounded-r-lg">
                          {children}
                        </blockquote>
                      ),
                    },
                    marks: {
                      link: ({
                        children,
                        value,
                      }: {
                        children: React.ReactNode;
                        value?: PortableTextLinkValue;
                      }) => {
                        const href = getSafeHref(value?.href);

                        if (!href) {
                          return <span className="text-foreground">{children}</span>;
                        }

                        const opensInNewTab =
                          href.startsWith("http://") ||
                          href.startsWith("https://") ||
                          href.startsWith("mailto:");

                        return (
                          <a
                            href={href}
                            className="text-primary underline decoration-accent/30 decoration-2 underline-offset-4 hover:decoration-accent transition-colors"
                            target={opensInNewTab ? "_blank" : undefined}
                            rel={opensInNewTab ? "noopener noreferrer" : undefined}
                          >
                            {children}
                          </a>
                        );
                      },
                      strong: ({ children }) => (
                        <strong className="font-bold text-foreground">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="font-serif italic text-[1.1em]">
                          {children}
                        </em>
                      ),
                    },
                    list: {
                      bullet: ({ children }) => (
                        <ul className="list-disc list-outside pl-6 space-y-2 my-8 marker:text-accent">
                          {children}
                        </ul>
                      ),
                      number: ({ children }) => (
                        <ol className="list-decimal list-outside pl-6 space-y-2 my-8 marker:text-foreground/40 font-mono text-sm">
                          {children}
                        </ol>
                      ),
                    },
                    listItem: {
                      bullet: ({ children }) => (
                        <li className="pl-2">{children}</li>
                      ),
                      number: ({ children }) => (
                        <li className="pl-2 font-sans text-lg">{children}</li>
                      ),
                    },
                    unknownType: () => null,
                  }}
                />
              </PostContentWrapper>
            ) : (
              <p className="italic text-foreground/40 text-center">
                No content available for this post.
              </p>
            )}
          </div>
        </SectionWrapper>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <SectionWrapper className="mt-24 border-t border-foreground/10 pt-16">
            <div className="mb-10">
              <span className="font-mono text-xs uppercase tracking-widest text-foreground/40 font-medium">
                Continue Reading
              </span>
              <h2 className="font-display text-3xl font-semibold text-foreground mt-3">
                More from the Journal
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((related) => {
                const relatedSlug = getSafeSlug(related.slug);
                const relatedImageUrl = getSafeImageUrl(related.mainImage);

                if (!relatedSlug) {
                  return null;
                }

                return (
                  <Link
                    key={related._id}
                    href={`/blog/${relatedSlug}`}
                    className="group flex flex-col bg-background/50 backdrop-blur-sm border border-foreground/10 rounded-card overflow-hidden hover:border-foreground/20 hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1"
                  >
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-foreground/5">
                      {relatedImageUrl ? (
                        <Image
                          src={relatedImageUrl}
                          alt={related.mainImage?.alt || related.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-serif text-2xl italic text-foreground/20 bg-surface-dark/5">
                          Stamer
                        </div>
                      )}
                      {related.category && (
                        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full border border-foreground/10">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-accent font-medium">
                            {related.category}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-6 gap-3">
                      <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300 leading-snug line-clamp-2">
                        {related.title}
                      </h3>
                      {related.excerpt && (
                        <p className="font-sans text-sm text-foreground/60 leading-relaxed line-clamp-2">
                          {related.excerpt}
                        </p>
                      )}
                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-foreground/5">
                        <span className="font-mono text-xs text-foreground/40 font-medium">
                          {formatSanityDate(related.publishedAt)}
                        </span>
                        <span className="font-sans text-sm text-primary font-medium group-hover:text-accent transition-colors duration-300">
                          Read &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </SectionWrapper>
        )}
      </main>
    </>
  );
}
