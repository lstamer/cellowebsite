/**
 * Supabase Auth clients for the admin.
 *
 * These are server-only clients that hold the magic-link session in an HTTP
 * cookie. The server prefers SUPABASE_SECRET_KEY because it is the verified
 * project credential already used by the data layer. No key from this module
 * is sent to the browser, and the browser never queries a table.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export function getAuthEnv(): { url: string; key: string } {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and a valid Supabase auth key are required for admin auth",
    );
  }
  return { url, key };
}

/** Server Components, Server Actions and Route Handlers. */
export async function createServerAuthClient() {
  const { url, key } = getAuthEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies; the proxy refreshes the
          // session on the next request instead.
        }
      },
    },
  });
}

/** The proxy (middleware): reads from the request, writes onto the response. */
export function createProxyAuthClient(request: NextRequest, response: NextResponse) {
  const { url, key } = getAuthEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });
}
