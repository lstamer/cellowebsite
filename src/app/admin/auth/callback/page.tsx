import type { Metadata } from "next";

import { AuthCallback } from "@/components/admin/AuthCallback";

export const metadata: Metadata = {
  title: "Signing in · Stamer admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Where the magic link lands. Both link shapes are handled in the browser:
 * `?code=` (PKCE, the emailed link) is exchanged with the verifier cookie this
 * browser set when it asked for the link; `#access_token=` (the admin-generated
 * link delivered via Telegram) is picked up from the URL fragment. Either way
 * the session ends up in cookies the proxy and server can read.
 */
export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") && !params.next.startsWith("//") ? params.next : null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-6 text-foreground">
      <AuthCallback next={next} />
    </main>
  );
}
