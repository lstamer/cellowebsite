import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getAuthEnv } from "@/lib/admin/supabase-auth";
import {
  adminCallbackDestination,
  safeAdminNext,
  trustedRequestOrigin,
} from "@/lib/admin/redirects";

function isAdminHost(origin: string): boolean {
  const configuredHost = (process.env.ADMIN_HOST ?? "admin.stamer.co.za").toLowerCase().split(":")[0];
  return new URL(origin).hostname.toLowerCase() === configuredHost;
}

function loginPath(origin: string): string {
  return `${isAdminHost(origin) ? "" : "/admin"}/login`;
}

/**
 * Complete both Supabase callback shapes on the server so the session cookie
 * is written on the same response as the redirect. This avoids a browser
 * navigation racing the async cookie write after email sign-in.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl;
  const origin = trustedRequestOrigin(request.headers.get("host"));
  if (!origin) {
    return NextResponse.json({ error: "Invalid request host" }, { status: 400 });
  }
  const next = safeAdminNext(url.searchParams.get("next"));
  const target = new URL(adminCallbackDestination(origin, next), origin);
  const response = NextResponse.redirect(target);
  const cookieStore = await cookies();
  const { url: supabaseUrl, key: supabaseKey } = getAuthEnv();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  try {
    const tokenHash = url.searchParams.get("token_hash");
    const code = url.searchParams.get("code");

    if (tokenHash) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: url.searchParams.get("type") === "email" ? "email" : "magiclink",
      });
      if (error) throw error;
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else {
      throw new Error("No Supabase callback credentials");
    }

    return response;
  } catch (error) {
    console.error("Admin auth callback failed:", error);
    const failure = new URL(loginPath(origin), origin);
    failure.searchParams.set("error", "callback");
    return NextResponse.redirect(failure);
  }
}
