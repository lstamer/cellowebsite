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
          label="Writing & Insights"
          heading="Notes from the Studio"
          alignment="left"
        />
        <PostList posts={posts} />
      </SectionWrapper>
    </main>
    </>
  );
}
