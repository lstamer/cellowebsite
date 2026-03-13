import Link from "next/link";
import { getAllPosts } from "@/sanity/queries";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { SanityPost } from "@/sanity/types";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PostCard({ post }: { post: SanityPost }) {
  return (
    <Link
      href={`/blog/${post.slug.current}`}
      className="group flex flex-col gap-4 bg-background border border-foreground/10 rounded-card p-8 hover:shadow-card-hover transition-shadow duration-300"
    >
      {post.category && (
        <span className="font-mono text-xs uppercase tracking-widest text-accent">
          {post.category}
        </span>
      )}
      <h2 className="font-display text-2xl font-semibold text-foreground group-hover:text-primary transition-colors duration-200 leading-snug">
        {post.title}
      </h2>
      {post.excerpt && (
        <p className="font-sans text-foreground/60 leading-relaxed line-clamp-3">
          {post.excerpt}
        </p>
      )}
      <div className="mt-auto pt-4 border-t border-foreground/10 flex items-center justify-between">
        <span className="font-mono text-xs text-foreground/40">
          {formatDate(post.publishedAt)}
        </span>
        <span className="font-sans text-sm text-primary font-medium group-hover:underline">
          Read more →
        </span>
      </div>
    </Link>
  );
}

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <main className="bg-background min-h-screen">
      <SectionWrapper>
        <SectionHeader
          label="Writing"
          heading="From the Studio"
          alignment="left"
        />

        {posts.length === 0 ? (
          <div className="mt-16 text-center py-24 border border-dashed border-foreground/20 rounded-card">
            <p className="font-serif italic text-4xl text-foreground/30">
              No posts yet.
            </p>
            <p className="font-sans text-sm text-foreground/40 mt-4">
              Connect Sanity and publish your first post to see it here.
            </p>
          </div>
        ) : (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </SectionWrapper>
    </main>
  );
}
