"use server";

import { headers } from "next/headers";

import { getAllowedAdminEmails, isAllowedAdminEmail } from "@/lib/admin/auth";
import { describeError, logAdminEvent } from "@/lib/admin/events";
import { createServerAuthClient } from "@/lib/admin/supabase-auth";
import { consumeRateLimit, type RateLimitResult } from "@/lib/request-rate-limit";
import { safeAdminNext, trustedRequestOrigin } from "@/lib/admin/redirects";

export type LoginResult =
  | { ok: true; channel: "email" }
  | { ok: false; error: string };

// Per-instance per-address throttle remains as an extra brake after the
// distributed IP/global login limit has accepted the attempt.
const recent = new Map<string, number[]>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function throttled(key: string): boolean {
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  if (hits.length >= MAX_PER_WINDOW) return true;
  hits.push(now);
  recent.set(key, hits);
  return false;
}

async function callbackUrl(next: string | null): Promise<string> {
  const headerList = await headers();
  const origin = trustedRequestOrigin(headerList.get("host"));
  if (!origin) throw new Error("Admin auth received an untrusted Host header");

  const adminHost = (process.env.ADMIN_HOST ?? "admin.stamer.co.za").toLowerCase().split(":")[0];
  const host = new URL(origin).hostname.toLowerCase();
  // On the admin host the public path has no /admin prefix.
  const basePath = host === adminHost ? "" : "/admin";
  const url = new URL(`${basePath}/auth/callback`, origin);
  const safeNext = safeAdminNext(next);
  if (safeNext) url.searchParams.set("next", safeNext);
  return url.toString();
}

function normaliseEmail(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null;
}

/** Email the magic link (Supabase Auth, PKCE, cookie verifier on this browser). */
export async function sendMagicLink(formData: FormData): Promise<LoginResult> {
  const rawEmail = formData.get("email");
  const next = safeAdminNext(typeof formData.get("next") === "string" ? String(formData.get("next")) : null);
  const email = normaliseEmail(rawEmail);

  let limitResult: RateLimitResult;
  try {
    const headerList = await headers();
    const origin = trustedRequestOrigin(headerList.get("host"));
    if (!origin) {
      return { ok: false, error: "Sign-in is temporarily unavailable. Please try again shortly." };
    }

    // Server Actions expose headers rather than a Request. Rebuild the trusted
    // request URL and copy only Vercel's platform-provided client-IP header.
    const rateLimitHeaders = new Headers();
    const forwardedFor = headerList.get("x-vercel-forwarded-for");
    if (forwardedFor) rateLimitHeaders.set("x-vercel-forwarded-for", forwardedFor);
    const request = new Request(new URL("/admin/login", origin), {
      method: "POST",
      headers: rateLimitHeaders,
    });
    limitResult = await consumeRateLimit("admin_login", request);
  } catch {
    return { ok: false, error: "Sign-in is temporarily unavailable. Please try again shortly." };
  }

  if (!limitResult.allowed) {
    return { ok: false, error: "Too many sign-in attempts. Please wait and try again." };
  }

  if (getAllowedAdminEmails().size === 0) {
    await logAdminEvent({
      level: "error",
      source: "auth",
      kind: "login_misconfigured",
      message: "Magic link requested while ADMIN_EMAILS is empty.",
    });
    return {
      ok: false,
      error: "Admin sign-in is not configured. Set ADMIN_EMAILS before requesting a link.",
    };
  }

  // Same response for unknown addresses: no enumeration.
  if (!email || !isAllowedAdminEmail(email)) {
    await logAdminEvent({
      level: "warning",
      source: "auth",
      kind: "login_rejected",
      message: `Magic link requested for an address that is not on the allow-list.`,
      context: { email: email ?? "(invalid)" },
    });
    return { ok: true, channel: "email" };
  }

  if (throttled(email)) {
    return { ok: false, error: "Too many link requests. Wait a few minutes and try again." };
  }

  try {
    const supabase = await createServerAuthClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: await callbackUrl(next),
        shouldCreateUser: true,
      },
    });
    if (error) throw error;

    await logAdminEvent({
      level: "info",
      source: "auth",
      kind: "login_link_sent",
      message: `Magic link emailed to ${email}.`,
    });
    return { ok: true, channel: "email" };
  } catch (error) {
    const message = describeError(error);
    await logAdminEvent({
      level: "error",
      source: "auth",
      kind: "login_link_failed",
      message: `Could not email a magic link: ${message}`,
      context: { email },
    });
    return {
      ok: false,
      error:
        "The email could not be sent. Check Supabase Auth SMTP settings.",
    };
  }
}
