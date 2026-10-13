/** The single address that may use the admin, in every environment. */
export const ADMIN_EMAIL = "lukestamer5853@gmail.com";

/**
 * Resolve the admin allow-list without ever admitting a second address.
 *
 * Production still requires ADMIN_EMAILS to be present so a missing Vercel
 * secret is visible as a configuration error. Development defaults to Luke's
 * address so a local checkout can work with the existing Supabase env names.
 */
export function getAllowedAdminEmails(): Set<string> {
  const configured = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const candidates = configured.length > 0 || process.env.NODE_ENV === "production"
    ? configured
    : [ADMIN_EMAIL];

  return new Set(candidates.filter((email) => email === ADMIN_EMAIL));
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAllowedAdminEmails().has(email.trim().toLowerCase());
}
