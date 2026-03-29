"use client";

import { BlogErrorState } from "@/components/blog/BlogErrorState";

interface BlogPostErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BlogPostErrorPage({
  error,
  reset,
}: BlogPostErrorPageProps) {
  void error;

  return (
    <BlogErrorState
      title="This article could not be fully rendered."
      description="A piece of article content failed while the page was loading. You can retry this post, or return to the journal and keep browsing."
      actionHref="/blog"
      actionLabel="Back to Journal"
      onRetry={reset}
    />
  );
}
