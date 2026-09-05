"use server";

import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

import { isAllowedAdminEmail } from "@/lib/admin/auth";
import { describeError, logAdminEvent } from "@/lib/admin/events";
import { createServerAuthClient, getAuthEnv } from "@/lib/admin/supabase-auth";
import { getSupabaseSecret, requireEnv } from "@/lib/inquiries/env";
import { sendTelegramMessage } from "@/lib/inquiries/telegram";

export type LoginResult =
  | { ok: true; channel: "email" | "telegram" }
  | { ok: false; error: string };

// Per-instance throttle: five link requests per address per 15 minutes. Not
// a security boundary (Supabase rate-limits too), just a brake on mistakes.
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

async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

async function callbackUrl(next: string | null): Promise<string> {
  const origin = await requestOrigin();
  const adminHost = (process.env.ADMIN_HOST ?? "").toLowerCase();
  const host = new URL(origin).host.toLowerCase();
  // On the admin host the public path has no /admin prefix.
  const basePath = host === adminHost ? "" : "/admin";
  const url = new URL(`${basePath}/auth/callback`, origin);
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    url.searchParams.set("next", next);
  }
  return url.toString();
}

function normaliseEmail(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null;
}

/** Email the magic link (Supabase Auth, PKCE, cookie verifier on this browser). */
export async function sendMagicLink(formData: FormData): Promise<LoginResult> {
  const email = normaliseEmail(formData.get("email"));
  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : null;

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
        "The email could not be sent. Try the Telegram option below, or check Supabase Auth SMTP settings.",
    };
  }
}

/**
 * Fallback that needs no email delivery: generate the same one-time link with
 * the service role and post it into Luke's private Telegram approval chat.
 */
export async function sendMagicLinkToTelegram(formData: FormData): Promise<LoginResult> {
  const email = normaliseEmail(formData.get("email"));
  const next = typeof formData.get("next") === "string" ? String(formData.get("next")) : null;

  if (!email || !isAllowedAdminEmail(email)) {
    return { ok: true, channel: "telegram" };
  }
  if (throttled(`tg:${email}`)) {
    return { ok: false, error: "Too many link requests. Wait a few minutes and try again." };
  }

  try {
    const { url } = getAuthEnv();
    const admin = createClient(url, getSupabaseSecret(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // generateLink needs an existing user; creating one is idempotent enough
    // (a duplicate is reported as an error we ignore).
    const created = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (created.error && !/already|exists|registered/i.test(created.error.message)) {
      throw created.error;
    }

    const link = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: await callbackUrl(next) },
    });
    if (link.error) throw link.error;

    const actionLink = link.data.properties?.action_link;
    if (!actionLink) throw new Error("Supabase returned no action link");

    await sendTelegramMessage({
      chatId: requireEnv("TELEGRAM_CHAT_ID"),
      text: `🔐 Admin sign-in link for ${email}\n\nOpen this on the device you want to use. It works once and expires soon:\n${actionLink}`,
    });

    await logAdminEvent({
      level: "info",
      source: "auth",
      kind: "login_link_sent",
      message: `Magic link for ${email} sent to Telegram.`,
    });
    return { ok: true, channel: "telegram" };
  } catch (error) {
    const message = describeError(error);
    await logAdminEvent({
      level: "error",
      source: "auth",
      kind: "login_link_failed",
      message: `Could not send a magic link to Telegram: ${message}`,
      context: { email },
    });
    return { ok: false, error: "Could not send the link to Telegram. Check the console for details." };
  }
}
