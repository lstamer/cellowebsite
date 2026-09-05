import { redirect } from "next/navigation";

import { LoginForm } from "@/app/admin/(auth)/login/LoginForm";
import { adminHref, getAdminSession } from "@/lib/admin/auth";

const REASONS: Record<string, string> = {
  config: "The admin is not configured yet: SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are missing.",
  denied: "That sign-in link was valid, but the address is not allowed into the admin.",
  expired: "That sign-in link has expired or was already used. Request a new one.",
  invalid: "That sign-in link could not be verified. Request a new one.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; next?: string }>;
}) {
  const params = await searchParams;
  const session = await getAdminSession();
  if (session) redirect(await adminHref(params.next && params.next.startsWith("/") ? params.next : "/"));

  const reason = params.reason ? REASONS[params.reason] : null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-dark px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="font-jost text-xs font-semibold uppercase tracking-[0.18em] text-accent">Stamer Admin</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-on-dark">Sign in</h1>
        <p className="mt-2 font-sans text-sm leading-relaxed text-on-dark/70">
          Enter your email and we will send a one-time sign-in link. Only allow-listed addresses can enter.
        </p>
        {reason ? (
          <p role="alert" className="mt-4 rounded-xl border border-error/50 bg-background px-4 py-3 font-sans text-sm text-error">
            {reason}
          </p>
        ) : null}
        <div className="mt-6 rounded-2xl border border-on-dark/10 bg-background p-5 shadow-card">
          <LoginForm next={params.next ?? ""} />
        </div>
      </div>
    </main>
  );
}
