import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminSession } from "@/lib/admin/auth";
import { adminPath } from "@/lib/admin/paths";

export const metadata: Metadata = {
  title: "Sign in · Stamer admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await getAdminSession();
  if (session) redirect(adminPath());

  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") ? params.next : null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-6 py-12 text-foreground">
      <div className="w-full max-w-sm">
        <p className="font-jost text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Stamer Cello
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Admin sign-in
        </h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-foreground/70">
          A one-time link is sent to your allow-listed address. Open it on this
          device and you are in; nothing to remember.
        </p>

        {params.error ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-error/50 bg-background px-4 py-3 font-sans text-sm text-error"
          >
            {params.error === "callback"
              ? "That link could not be verified. Links work once and expire after an hour; request a new one."
              : "Sign-in failed. Request a new link."}
          </p>
        ) : null}

        <LoginForm next={next} />
      </div>
    </main>
  );
}
