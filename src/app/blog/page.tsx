import { getAllPosts } from "@/sanity/queries";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PostList } from "@/components/blog/PostList";
import { Navbar } from "@/components/Navbar";

export const revalidate = 60;
export const dynamic = 'force-dynamic'; // Always fetch fresh in dev; revalidate handles prod caching

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <>
      <Navbar forceBackground />
      <main className="bg-background min-h-screen pt-24 pb-16">
      <SectionWrapper>
        <SectionHeader
          label="Planning & Advice"
          heading="Free advice for anyone planning a Cape Town event"
          alignment="left"
        />
        <p className="mt-6 max-w-3xl font-sans text-lg leading-relaxed text-foreground/70">
          Honest, practical guidance whether you end up booking with me or not.
          If you&apos;re in the middle of planning and need answers, start here.
        </p>
        <PostList posts={posts} />
      </SectionWrapper>
    </main>
    </>
  );
}
