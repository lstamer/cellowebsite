/**
 * Admin data access. One secret-key client per process, used only from Server
 * Components, Server Actions and route handlers on the admin host. Nothing in
 * the browser ever holds this key.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseSecret, requireEnv } from "@/lib/inquiries/env";

let client: SupabaseClient | undefined;

export function getAdminDb(): SupabaseClient {
  if (!client) {
    client = createClient(requireEnv("SUPABASE_URL"), getSupabaseSecret(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

/**
 * Errors that mean "the migration has not been applied yet": a missing table
 * or view (Postgres 42P01, PostgREST PGRST205 when it is absent from the
 * schema cache) or a missing column (42703, PGRST204). Pages treat these as
 * empty results and show the migration banner instead of crashing.
 */
const MISSING_SCHEMA_CODES = new Set(["42P01", "PGRST205", "42703", "PGRST204"]);

export function isMissingRelation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code && MISSING_SCHEMA_CODES.has(error.code)) return true;
  return /schema cache|does not exist/i.test(error.message ?? "");
}
