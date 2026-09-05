import { NextResponse, type NextRequest } from "next/server";

import { createProxyAuthClient } from "@/lib/admin/supabase-auth";

/**
 * Two jobs, both for the admin only. The public site is untouched: for the
 * apex host and any non-/admin path this returns immediately.
 *
 * 1. Host rewrite: requests to admin.stamer.co.za are served from
 *    src/app/admin/** so one Vercel project carries both surfaces.
 * 2. Session gate: /admin/** (except the login and auth callback) requires a
 *    Supabase Auth session whose email is on the ADMIN_EMAILS allow-list.
 *    Pages re-check server-side; this just keeps strangers off the shell.
 */

const ADMIN_PUBLIC_PATHS = ["/admin/login", "/admin/auth"];

function getAdminHost(): string {
  return (process.env.ADMIN_HOST ?? "admin.stamer.co.za").toLowerCase();
}

function isAllowed(email: string | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

function withAdminHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "same-origin");
  return response;
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const host = (request.headers.get("host") ?? "").toLowerCase().split(":")[0];
  const onAdminHost = host === getAdminHost();

  // API routes, static assets and the public site pass straight through.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  let adminPath: string | null = null;
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    adminPath = url.pathname;
  } else if (onAdminHost) {
    adminPath = url.pathname === "/" ? "/admin" : `/admin${url.pathname}`;
  }

  if (!adminPath) {
    return NextResponse.next();
  }

  const rewriteUrl = url.clone();
  rewriteUrl.pathname = adminPath;
  const needsRewrite = rewriteUrl.pathname !== url.pathname;

  const isPublic = ADMIN_PUBLIC_PATHS.some(
    (prefix) => adminPath === prefix || adminPath.startsWith(`${prefix}/`),
  );

  // Build the response first so the auth client can refresh cookies onto it.
  const response = needsRewrite
    ? NextResponse.rewrite(rewriteUrl)
    : NextResponse.next();

  let email: string | undefined;
  try {
    const supabase = createProxyAuthClient(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? undefined;
  } catch {
    email = undefined;
  }

  const signedIn = isAllowed(email);

  if (!isPublic && !signedIn) {
    const loginUrl = url.clone();
    // Keep the public-facing path shape: on the admin host the login lives at
    // /login, elsewhere at /admin/login.
    loginUrl.pathname = onAdminHost && !url.pathname.startsWith("/admin") ? "/login" : "/admin/login";
    loginUrl.search = "";
    const publicNext = onAdminHost && adminPath.startsWith("/admin/")
      ? adminPath.slice("/admin".length)
      : adminPath;
    if (publicNext && publicNext !== "/admin" && publicNext !== "/") {
      loginUrl.searchParams.set("next", publicNext);
    }
    const redirectResponse = NextResponse.redirect(loginUrl);
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return withAdminHeaders(redirectResponse);
  }

  if (isPublic && signedIn && adminPath.startsWith("/admin/login")) {
    const homeUrl = url.clone();
    homeUrl.pathname = onAdminHost && !url.pathname.startsWith("/admin") ? "/" : "/admin";
    homeUrl.search = "";
    return withAdminHeaders(NextResponse.redirect(homeUrl));
  }

  return withAdminHeaders(response);
}

export const config = {
  matcher: [
    // Everything except Next internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|fonts/|images/|.*\\.(?:png|jpg|jpeg|webp|avif|svg|ico|woff2?|mp4|webm|pdf|txt|xml)).*)",
  ],
};
