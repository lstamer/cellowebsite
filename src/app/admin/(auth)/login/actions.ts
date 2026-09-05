"use server";

import { redirect } from "next/navigation";

import type { ActionResult } from "@/components/admin/controls";
import { logAdminEvent } from "@/lib/admin/events";
import {
  adminHref,
  createAuthClient,
  getRequestOrigin,
  isAllowedAdminEmail,
} from "@/lib/admin/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// A small in-memory throttle: five requests per email per ten minutes per
// instance. Supabase applies its own rate limit on top.
const attempts = new Map<string, number[]>();

function throttled(email: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(email) ?? []).filter((at) => now - at < 10 * 60_000);
  attempts.set(email, [...recent, now]);
  return recent.length >= 5;
}

export async function sendMagicLinkAction(
  _state: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "").trim();

  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  // Same response for unknown addresses so the form does not reveal the
  // allow-list; the event log records the attempt for Luke.
  if (!isAllowedAdminEmail(email)) {
    await logAdminEvent({
      level: "warn",
      source: "admin",
      kind: "login_denied",
      message: `Login requested for an address that is not on the admin allow-list.`,
      context: { email },
    });
    return { ok: true, message: "If that address is allowed, a sign-in link is on its way." };
  }

  if (throttled(email)) {
    return { ok: false, message: "Too many sign-in requests. Wait a few minutes and try again." };
  }

  const origin = await getRequestOrigin();
  const callback = `${origin}${await adminHref("/auth/callback")}${next && next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`;

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callback, shouldCreateUser: true },
  });

  if (error) {
    await logAdminEvent({
      level: "error",
      source: "admin",
      kind: "login_link_failed",
      message: `Supabase could not send a sign-in link: ${error.message}`,
      context: { email },
    });
    return { ok: false, message: "The sign-in email could not be sent. Check the console after signing in another way, or try again shortly." };
  }

  return { ok: true, message: "Check your inbox for the sign-in link. It expires in an hour." };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect(await adminHref("/login"));
}
