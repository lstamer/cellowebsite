/**
 * Admin authentication: Supabase Auth magic links, an email allow-list, and
 * cookie sessions handled by @supabase/ssr.
 *
 * Two independent gates protect the admin:
 *   1. src/proxy.ts refuses unauthenticated requests on the admin host.
 *   2. Every page and action calls requireAdmin(), which verifies the JWT and
 *      the allow-list again. The proxy is a convenience; this is the guard.
 */

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireEnv } from "@/lib/inquiries/env";

export interface AdminSession {
  email: string;
  userId: string;
}

export const ADMIN_HOST_DEFAULT = "admin.stamer.co.za";

export function getAdminHost(): string {
  return (process.env.ADMIN_HOST?.trim() || ADMIN_HOST_DEFAULT).toLowerCase();
}

export function getAllowedAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAllowedAdminEmails().has(email.trim().toLowerCase());
}

function getPublishableKey(): string {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    requireEnv("SUPABASE_ANON_KEY")
  );
}

/**
 * A request-scoped auth client backed by the Next cookie store. Writes are
 * only possible from Server Actions and route handlers; Server Components
 * swallow the write and rely on the proxy having refreshed the session.
 */
export async function createAuthClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(requireEnv("SUPABASE_URL"), getPublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component render: cookies are read-only here.
        }
      },
    },
  });
}

/**
 * Where the admin lives for this request: "" on the admin host (the proxy
 * rewrites to /admin internally) or "/admin" when reached by path, e.g. on
 * localhost during development.
 */
export async function getAdminBasePath(): Promise<string> {
  const headerStore = await headers();
  const host = (headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "")
    .split(":")[0]
    .toLowerCase();
  return host === getAdminHost() ? "" : "/admin";
}

/** Absolute origin of this request, for auth redirect URLs. */
export async function getRequestOrigin(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const proto =
    headerStore.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Build an admin-relative href that works on both the subdomain and /admin. */
export async function adminHref(path: string): Promise<string> {
  const base = await getAdminBasePath();
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalised === "/" && base ? "" : normalised}` || "/";
}

/**
 * The verified admin session, or null. Verification uses the JWT signing
 * keys (getClaims) and the allow-list; a valid Supabase user who is not on
 * the list is treated as anonymous.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  const email = typeof data.claims.email === "string" ? data.claims.email : null;
  const userId = typeof data.claims.sub === "string" ? data.claims.sub : null;
  if (!email || !userId || !isAllowedAdminEmail(email)) return null;

  return { email: email.toLowerCase(), userId };
}

/** For pages and actions: redirect to login when there is no admin session. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    redirect(await adminHref("/login"));
  }
  return session;
}
