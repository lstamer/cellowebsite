/**
 * Central operational event log (admin_events).
 *
 * Every integration failure, uncertain send, health incident and manual
 * correction is recorded here so the admin console can show Luke what needs
 * attention. This helper is deliberately fire-and-forget: it never throws and
 * never blocks the caller beyond a single insert, because the thing being
 * logged is usually already a failure path.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseSecret, requireEnv } from "@/lib/inquiries/env";

export type AdminEventLevel = "info" | "warn" | "error";

export type AdminEventSource =
  | "telegram"
  | "zernio"
  | "supabase"
  | "ai"
  | "trigger"
  | "email"
  | "webhook"
  | "health"
  | "admin"
  | "analytics"
  | "site";

export interface AdminEventInput {
  level: AdminEventLevel;
  source: AdminEventSource;
  /** Short machine-readable kind, e.g. "lead_alert_failed". */
  kind: string;
  message: string;
  context?: Record<string, unknown>;
  leadId?: string | null;
  conversationId?: string | null;
}

let client: SupabaseClient | undefined;

function getClient(): SupabaseClient {
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

export function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

/**
 * Record an event. Resolves once the insert has been attempted; a failure to
 * log is itself only reported to the console, never thrown.
 */
export async function logAdminEvent(input: AdminEventInput): Promise<void> {
  const row = {
    level: input.level,
    source: input.source,
    kind: input.kind.slice(0, 120),
    message: input.message.slice(0, 2000),
    context: input.context ?? {},
    lead_id: input.leadId ?? null,
    conversation_id: input.conversationId ?? null,
  };

  try {
    const { error } = await getClient().from("admin_events").insert(row);
    if (error) {
      console.error("admin_events insert failed:", error.message, row);
    }
  } catch (error) {
    console.error("admin_events insert threw:", describeError(error), row);
  }
}

/** Test seam: drop the cached client so a new env takes effect. */
export function resetAdminEventsClientForTests(): void {
  client = undefined;
}
