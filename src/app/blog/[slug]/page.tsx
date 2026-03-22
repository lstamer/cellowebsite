import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPostBySlug, getAllPostSlugs } from "@/sanity/queries";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { urlFor } from "@/sanity/lib/image";
import { PortableText } from "@portabletext/react";
import { PostContentWrapper } from "@/components/blog/PostContentWrapper";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getAllPostSlugs();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="bg-background min-h-screen pt-32 pb-24">
      <SectionWrapper maxWidth="max-w-5xl" className="md:px-8">
        <Link href="/blog" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-foreground/40 hover:text-accent transition-colors mb-12">
          &larr; Back to Journal
        </Link>

        <header className="mb-16">
          {post.category && (
            <div className="mb-6">
              <span className="font-mono text-sm uppercase tracking-widest text-accent font-medium bg-accent/10 py-1 px-3 rounded-full">
                {post.category}
              </span>
            </div>
          )}
          <h1 className="font-serif italic text-5xl md:text-7xl lg:text-8xl text-foreground leading-[1.1] tracking-tight mb-8">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 border-l-2 border-accent pl-4">
            <div className="flex flex-col">
               <span className="font-sans font-medium text-foreground">Stamer</span>
               <span className="font-mono text-xs text-foreground/40">{formattedDate}</span>
            </div>
          </div>
        </header>

        {post.mainImage && (
          <div className="relative w-full aspect-[21/9] md:aspect-[16/9] mb-20 rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={urlFor(post.mainImage).url()}
              alt={post.mainImage.alt || post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="font-sans text-lg md:text-xl leading-relaxed text-foreground/80 grid grid-cols-1 gap-8 max-w-[65ch] mx-auto">
          {post.body ? (
            <PostContentWrapper>
              <PortableText 
                value={post.body} 
                components={{
                  types: {
                    image: ({ value }) => (
                      <div className="relative w-full aspect-[4/3] my-12 rounded-xl overflow-hidden shadow-lg border border-foreground/10 bg-surface-dark/5">
                        <Image
                          src={urlFor(value).url()}
                          alt={value.alt || "Post image"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )
                  },
                  block: {
                    h1: ({children}) => <h1 className="font-display text-4xl font-bold mt-16 mb-8 text-foreground">{children}</h1>,
                    h2: ({children}) => <h2 className="font-display text-3xl font-semibold mt-16 mb-6 text-foreground">{children}</h2>,
                    h3: ({children}) => <h3 className="font-display text-2xl font-semibold mt-12 mb-4 text-foreground">{children}</h3>,
                    h4: ({children}) => <h4 className="font-display text-xl font-medium mt-10 mb-4 text-foreground">{children}</h4>,
                    normal: ({children}) => <p className="mb-6">{children}</p>,
                    blockquote: ({children}) => <blockquote className="border-l-4 border-accent pl-6 py-2 my-10 font-serif italic text-2xl text-foreground/70 bg-foreground/5 rounded-r-lg">{children}</blockquote>,
                  },
                  marks: {
                    link: ({children, value}) => <a href={value.href} className="text-primary underline decoration-accent/30 decoration-2 underline-offset-4 hover:decoration-accent transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>,
                    strong: ({children}) => <strong className="font-bold text-foreground">{children}</strong>,
                    em: ({children}) => <em className="font-serif italic text-[1.1em]">{children}</em>,
                  },
                  list: {
                    bullet: ({children}) => <ul className="list-disc list-outside pl-6 space-y-2 my-8 marker:text-accent">{children}</ul>,
                    number: ({children}) => <ol className="list-decimal list-outside pl-6 space-y-2 my-8 marker:text-foreground/40 font-mono text-sm">{children}</ol>,
                  },
                  listItem: {
                    bullet: ({children}) => <li className="pl-2">{children}</li>,
                    number: ({children}) => <li className="pl-2 font-sans text-lg">{children}</li>,
                  }
                }} 
              />
            </PostContentWrapper>
          ) : (
            <p className="italic text-foreground/40 text-center">No content available for this post.</p>
          )}
        </div>
      </SectionWrapper>
    </main>
  );
}
