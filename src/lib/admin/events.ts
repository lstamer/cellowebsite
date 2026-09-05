/**
 * The one place every integration failure, uncertain send, recovery action and
 * manual edit is recorded. The admin console is a view over this table.
 *
 * `logAdminEvent` is fire-and-forget by contract: it NEVER throws and never
 * blocks the caller's response. A logging failure is written to stderr, which
 * is the same sink these failures used before the log existed, so nothing can
 * get worse by calling it.
 */
import { getSupabaseAdmin } from "@/lib/inquiries/supabase";

export type AdminEventLevel = "info" | "warning" | "error";

export type AdminEventSource =
  | "supabase"
  | "telegram"
  | "zernio"
  | "ai"
  | "trigger"
  | "health"
  | "admin"
  | "beacon"
  | "email"
  | "auth";

export interface AdminEventInput {
  level: AdminEventLevel;
  source: AdminEventSource;
  /** Machine-readable kind, e.g. `lead_alert_failed`. */
  kind: string;
  message: string;
  context?: Record<string, unknown>;
  entityType?: string;
  entityId?: string | null;
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

export async function logAdminEvent(input: AdminEventInput): Promise<void> {
  try {
    if (!process.env.SUPABASE_URL) return;

    const { error } = await getSupabaseAdmin().from("admin_events").insert({
      level: input.level,
      source: input.source,
      kind: input.kind,
      message: input.message.slice(0, 4_000),
      context: input.context ?? {},
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    });

    if (error) {
      console.error("logAdminEvent insert failed:", error.message, input);
    }
  } catch (error) {
    console.error("logAdminEvent threw:", describeError(error), input);
  }
}
