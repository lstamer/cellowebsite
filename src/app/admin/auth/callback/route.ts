import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import { getAuthEnv } from "@/lib/admin/supabase-auth";

function isAdminHost(request: NextRequest): boolean {
  const configuredHost = (process.env.ADMIN_HOST ?? "admin.stamer.co.za").toLowerCase().split(":")[0];
  const requestHost = (request.headers.get("host") ?? request.nextUrl.hostname).toLowerCase().split(":")[0];
  return requestHost === configuredHost;
}

function safeNext(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

function destinationPath(request: NextRequest, next: string | null): string {
  const onAdminHost = isAdminHost(request);
  const base = onAdminHost ? "" : "/admin";
  if (!next) return base || "/";
  if (onAdminHost) {
    return next.startsWith("/admin/") ? next.slice("/admin".length) : next;
  }
  return next.startsWith("/admin") ? next : `${base}${next === "/" ? "" : next}`;
}

function loginPath(request: NextRequest): string {
  return `${isAdminHost(request) ? "" : "/admin"}/login`;
}

/**
 * Complete both Supabase callback shapes on the server so the session cookie
 * is written on the same response as the redirect. This avoids a browser
 * navigation racing the async cookie write, and works for email, Telegram,
 * and the development-only bypass.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const target = new URL(destinationPath(request, next), request.url);
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
    const failure = new URL(loginPath(request), request.url);
    failure.searchParams.set("error", "callback");
    return NextResponse.redirect(failure);
  }
}
