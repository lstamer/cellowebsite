import { NextResponse } from "next/server";

import { logAdminEvent } from "@/lib/admin/events";
import { adminHref, createAuthClient, getRequestOrigin, isAllowedAdminEmail } from "@/lib/admin/auth";

/**
 * Completes a magic-link sign-in. Supabase sends either a PKCE `code` or a
 * `token_hash`, depending on the email template; both are accepted. A valid
 * session for an address outside the allow-list is signed out again.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next");
  const origin = await getRequestOrigin();
  const loginPath = await adminHref("/login");

  const supabase = await createAuthClient();
  let email: string | null = null;
  let error: { message: string } | null = null;

  // The verified user comes from the exchange itself: cookies written in this
  // request are not readable again until the next one.
  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
    email = result.data.user?.email ?? null;
  } else if (tokenHash && (type === "email" || type === "magiclink")) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    error = result.error;
    email = result.data.user?.email ?? null;
  } else {
    return NextResponse.redirect(`${origin}${loginPath}?reason=invalid`);
  }

  if (error) {
    return NextResponse.redirect(`${origin}${loginPath}?reason=expired`);
  }

  if (!isAllowedAdminEmail(email)) {
    await supabase.auth.signOut();
    await logAdminEvent({
      level: "warn",
      source: "admin",
      kind: "login_denied",
      message: "A valid Supabase session was refused because the address is not on the allow-list.",
      context: { email },
    });
    return NextResponse.redirect(`${origin}${loginPath}?reason=denied`);
  }

  await logAdminEvent({
    level: "info",
    source: "admin",
    kind: "login",
    message: `Admin signed in: ${email}`,
  });

  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return NextResponse.redirect(`${origin}${await adminHref(target)}`);
}
