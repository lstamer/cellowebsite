"use client";

import { BlogErrorState } from "@/components/blog/BlogErrorState";

interface BlogErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BlogErrorPage({ error, reset }: BlogErrorPageProps) {
  void error;

  return (
    <BlogErrorState
      title="The journal needs a quick reset."
      description="Something interrupted the blog index while it was loading. You can retry the page or head back to the homepage without losing the rest of the site."
      actionHref="/"
      actionLabel="Back to Home"
      onRetry={reset}
    />
  );
}
