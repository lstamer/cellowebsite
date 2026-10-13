"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface AuthCallbackProps {
  next: string | null;
}

function adminBase(): string {
  // On the admin host the pages are served at the root; elsewhere under /admin.
  return window.location.pathname.startsWith("/admin/") ? "/admin" : "";
}

export function AuthCallback({ next }: AuthCallbackProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"working" | "failed">("working");
  // The token in the URL is single-use. React's development double-invocation
  // of effects would otherwise verify it twice: the second call fails and the
  // page reports an error for a sign-in that actually succeeded.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let cancelled = false;

    async function run() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) {
        setStatus("failed");
        return;
      }

      const supabase = createBrowserClient(url, key);
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const base = adminBase();

      try {
        if (tokenHash) {
          // The SSR-recommended shape: an email template using {{ .TokenHash }}
          // links straight here and the token is verified without a redirect
          // through Supabase, so no allow-list entry is needed.
          const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (window.location.hash.includes("access_token")) {
          // detectSessionInUrl (default true) stores the fragment session; the
          // getSession call waits for that to finish.
          const { data, error } = await supabase.auth.getSession();
          if (error || !data.session) throw error ?? new Error("No session in URL");
        } else {
          throw new Error("No credentials in URL");
        }

        const target = next && next.startsWith("/") ? next : `${base || "/"}`;
        // Full navigation so the proxy sees the fresh cookies.
        window.location.replace(target.startsWith("/admin") || base === "" ? target : `${base}${target === "/" ? "" : target}`);
      } catch {
        if (cancelled) return;
        setStatus("failed");
        router.replace(`${base}/login?error=callback`);
      }
    }

    void run();
    return () => {
      // Only the failure path honours cancellation; a successful verification
      // must always complete its redirect.
      cancelled = true;
    };
  }, [next, router]);

  return (
    <div className="text-center">
      <p className="font-jost text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        Stamer admin
      </p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">
        {status === "working" ? "Signing you in…" : "That link did not work."}
      </p>
    </div>
  );
}
