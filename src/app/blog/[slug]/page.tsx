import { notFound } from "next/navigation";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { getPostBySlug, getAllPostSlugs } from "@/sanity/queries";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  return (
    <main className="bg-background min-h-screen">
      <SectionWrapper maxWidth="max-w-5xl">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 font-mono text-sm text-foreground/50 hover:text-foreground transition-colors mb-12"
        >
          ← All posts
        </Link>

        {/* Header */}
        <header className="mb-16">
          {post.category && (
            <span className="font-mono text-xs uppercase tracking-widest text-accent block mb-4">
              {post.category}
            </span>
          )}
          <h1 className="font-display text-4xl md:text-6xl font-semibold text-foreground leading-tight mb-6">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="font-serif italic text-2xl text-foreground/60 leading-relaxed mb-6">
              {post.excerpt}
            </p>
          )}
          <time className="font-mono text-xs text-foreground/40">
            {formatDate(post.publishedAt)}
          </time>
          <div className="mt-8 border-t border-foreground/10" />
        </header>

        {/* Body */}
        <div className="prose prose-lg max-w-none [&_h2]:font-display [&_h2]:font-semibold [&_h2]:text-foreground [&_p]:text-foreground/70 [&_p]:leading-relaxed [&_a]:text-primary [&_blockquote]:font-serif [&_blockquote]:italic [&_blockquote]:text-foreground/60 [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-6">
          <PortableText value={post.body} />
        </div>

        {/* Footer nav */}
        <div className="mt-24 pt-8 border-t border-foreground/10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-sans text-sm font-medium text-primary hover:underline"
          >
            ← Back to all posts
          </Link>
        </div>
      </SectionWrapper>
    </main>
  );
}
