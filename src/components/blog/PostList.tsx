import Link from "next/link";
import Image from "next/image";
import type { SanityPost } from "@/sanity/types";
import { urlFor } from "@/sanity/lib/image";

import { twMerge } from "tailwind-merge";
import clsx, { type ClassValue } from "clsx";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PostList({ posts }: { posts: SanityPost[] }) {

  // If no posts are fetched from Sanity, display placeholder data so the layout is visible
  const displayPosts = posts.length > 0 ? posts : Array.from({ length: 9 }).map((_, i) => ({
    _id: `mock-${i}`,
    title: `Mock Post Title ${i + 1} with a descriptive headline`,
    slug: { current: `mock-${i}` },
    excerpt: `This is a randomly generated mock excerpt for post ${i + 1}. It is meant to be long enough to test text clamping and layout consistency in the UI presentation.`,
    publishedAt: new Date().toISOString(),
    category: i % 2 === 0 ? "Development" : "Engineering",
    mainImage: null,
    body: []
  })) as any[];

  const featuredPost = displayPosts[0];
  const regularPosts = displayPosts.slice(1);

  return (
    <div className="mt-8 lg:mt-12 flex flex-col gap-16 lg:gap-24">
      {/* Featured Post */}
      {featuredPost && (
        <Link
          href={`/blog/${featuredPost.slug.current}`}
          className="featured-post group flex flex-col lg:flex-row bg-background/50 backdrop-blur-sm border border-foreground/10 rounded-card overflow-hidden hover:border-foreground/20 hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1"
        >
          <div className="flex flex-col flex-1 p-8 lg:p-12 gap-6 order-2 lg:order-1 justify-center">
            {featuredPost.category && (
              <div className="inline-flex">
                <span className="font-mono text-xs uppercase tracking-widest text-accent font-medium bg-surface-dark/5 px-3 py-1 rounded-full border border-foreground/10">
                  {featuredPost.category}
                </span>
              </div>
            )}
            <h2 className="font-display text-4xl lg:text-5xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
              {featuredPost.title}
            </h2>
            {featuredPost.excerpt && (
              <p className="font-sans text-lg text-foreground/60 leading-relaxed line-clamp-3">
                {featuredPost.excerpt}
              </p>
            )}
            <div className="mt-8 pt-6 flex items-center justify-between border-t border-foreground/5">
              <span className="font-mono text-xs text-foreground/40 font-medium">
                {formatDate(featuredPost.publishedAt)}
              </span>
              <span className="font-sans text-sm text-primary font-medium group-hover:text-accent transition-colors duration-300 flex items-center gap-1 group-hover:gap-2">
                Read article <span className="text-lg leading-none transition-all">&rarr;</span>
              </span>
            </div>
          </div>

          <div className="flex-1 lg:flex-[1.2] relative aspect-video lg:aspect-auto border-t lg:border-t-0 lg:border-l border-foreground/10 order-1 lg:order-2 overflow-hidden bg-foreground/5">
            {featuredPost.mainImage?.asset ? (
              <Image
                src={urlFor(featuredPost.mainImage).url()}
                alt={featuredPost.mainImage.alt || featuredPost.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-serif text-3xl italic text-foreground/20 bg-surface-dark/5 min-h-[300px]">
                Stamer
              </div>
            )}
          </div>
        </Link>
      )}

      {/* Regular Posts Grid */}
      {regularPosts.length > 0 && (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6 border-b border-foreground/10 pb-6">
            <h3 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
              Explore Articles
            </h3>
            <div className="flex flex-wrap gap-2 md:ml-auto">
              {/* Optional dummy tags just to replicate the N8N layout feel without full functionality */}
              {["Development", "Design", "Business", "Thoughts"].map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[10px] md:text-xs tracking-wider text-foreground/60 bg-foreground/5 hover:bg-foreground/10 transition-colors px-3 py-1.5 rounded-full border border-foreground/10 cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-8">
            {regularPosts.map((post, i) => {
              const isWide = i % 8 === 6 || i % 8 === 7;
              return (
                <Link
                  key={post._id}
                  href={`/blog/${post.slug.current}`}
                  className={cn(
                    "post-card group flex flex-col bg-background/50 backdrop-blur-sm border border-foreground/10 rounded-card overflow-hidden hover:border-foreground/20 hover:shadow-card-hover transition-all duration-500 hover:-translate-y-1",
                    isWide ? "lg:col-span-3 md:col-span-2" : "lg:col-span-2 md:col-span-1"
                  )}
                >
                  <div
                    className={cn(
                      "relative w-full overflow-hidden bg-foreground/5",
                      isWide ? "aspect-[2/1] md:aspect-[21/9] lg:aspect-[16/7]" : "aspect-[4/3]"
                    )}
                  >
                    {post.mainImage?.asset ? (
                      <Image
                        src={urlFor(post.mainImage).url()}
                        alt={post.mainImage.alt || post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-serif text-2xl italic text-foreground/20 bg-surface-dark/5">
                        Stamer
                      </div>
                    )}
                    {post.category && (
                      <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full border border-foreground/10">
                        <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-accent font-medium">
                          {post.category}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 p-6 md:p-8 gap-4">
                    <h2
                      className={cn(
                        "font-display font-semibold text-foreground group-hover:text-primary transition-colors duration-300 leading-snug",
                        isWide ? "text-2xl lg:text-4xl" : "text-xl lg:text-2xl"
                      )}
                    >
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="font-sans text-foreground/60 leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-foreground/5">
                      <span className="font-mono text-xs text-foreground/40 font-medium">
                        {formatDate(post.publishedAt)}
                      </span>
                      <span className="font-sans text-sm text-primary font-medium group-hover:text-accent transition-colors duration-300 flex items-center gap-1 group-hover:gap-2">
                        Read article <span className="text-lg leading-none transition-all">&rarr;</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
