import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Two jobs, both only for the admin:
 *
 * 1. Host routing. Requests to admin.stamer.co.za/<path> are rewritten to
 *    /admin/<path> so the admin lives in this repo as a route group. Requests
 *    to stamer.co.za/admin/* are sent to the admin host in production so the
 *    marketing domain never serves a login page. Localhost keeps /admin as a
 *    plain path for development.
 *
 * 2. Session gate. On admin routes the Supabase session cookie is refreshed
 *    and checked; anonymous requests go to the login page. Pages verify again
 *    with requireAdmin(), so this gate is a convenience, not the guard.
 */

const ADMIN_HOST = (process.env.ADMIN_HOST?.trim() || "admin.stamer.co.za").toLowerCase();
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/auth"];

function isLocalHost(host: string): boolean {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.endsWith(".local");
}

function allowedEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl;
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(":")[0]
    .toLowerCase();
  const onAdminHost = host === ADMIN_HOST;

  // Marketing domain must never serve the admin. Localhost is exempt.
  if (!onAdminHost && url.pathname.startsWith("/admin") && !isLocalHost(host)) {
    const target = new URL(url.pathname.replace(/^\/admin/, "") || "/", `https://${ADMIN_HOST}`);
    target.search = url.search;
    return NextResponse.redirect(target, 308);
  }

  if (!onAdminHost && !url.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Internal path the app router will serve.
  const internalPath = onAdminHost
    ? `/admin${url.pathname === "/" ? "" : url.pathname}`
    : url.pathname;

  const rewritten = new URL(internalPath || "/admin", request.url);
  rewritten.search = url.search;

  let response = onAdminHost
    ? NextResponse.rewrite(rewritten, { request })
    : NextResponse.next({ request });

  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim();

  const isPublic = PUBLIC_ADMIN_PATHS.some((prefix) => internalPath.startsWith(prefix));

  if (!supabaseUrl || !publishableKey) {
    // Misconfigured: fail closed except for the login page, which explains.
    if (isPublic) return response;
    const loginUrl = new URL(onAdminHost ? "/login" : "/admin/login", request.url);
    loginUrl.searchParams.set("reason", "config");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = onAdminHost
          ? NextResponse.rewrite(rewritten, { request })
          : NextResponse.next({ request });
        response.headers.set("X-Robots-Tag", "noindex, nofollow");
        response.headers.set("Cache-Control", "no-store");
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refreshes the session cookie when needed and verifies the JWT locally.
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email.toLowerCase() : null;
  const authenticated = Boolean(email && allowedEmails().has(email));

  if (!authenticated && !isPublic) {
    const loginUrl = new URL(onAdminHost ? "/login" : "/admin/login", request.url);
    const next = onAdminHost ? url.pathname : url.pathname.replace(/^\/admin/, "") || "/";
    if (next && next !== "/") loginUrl.searchParams.set("next", next);
    const redirectResponse = NextResponse.redirect(loginUrl);
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  return response;
}

export const config = {
  // Skip static assets; everything else passes through so the admin host can
  // be recognised on any path.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts/|images/|.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2?)$).*)"],
};
