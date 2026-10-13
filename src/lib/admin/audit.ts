/**
 * Every admin mutation goes through `withAudit`: it snapshots the row before,
 * runs the change, snapshots after, and writes one `admin_audit_log` row. The
 * mutation is the source of truth; if the audit insert fails it is reported
 * to `admin_events` rather than rolling the change back, so Luke's edit is
 * never lost to a logging hiccup.
 */
import { logAdminEvent, describeError } from "@/lib/admin/events";
import { getSupabaseAdmin } from "@/lib/inquiries/supabase";

export type AuditAction = "insert" | "update" | "delete" | "merge" | "action";

export interface AuditInput {
  actor: string;
  tableName: string;
  rowId: string;
  action: AuditAction;
  note?: string;
}

async function snapshot(tableName: string, rowId: string): Promise<Record<string, unknown> | null> {
  try {
    const { data } = await getSupabaseAdmin().from(tableName).select("*").eq("id", rowId).maybeSingle();
    return (data as Record<string, unknown> | null) ?? null;
  } catch {
    return null;
  }
}

export async function writeAudit(input: AuditInput & { before: unknown; after: unknown }): Promise<void> {
  try {
    const { error } = await getSupabaseAdmin().from("admin_audit_log").insert({
      actor: input.actor,
      table_name: input.tableName,
      row_id: input.rowId,
      action: input.action,
      before: input.before ?? null,
      after: input.after ?? null,
      note: input.note ?? null,
    });
    if (error) throw new Error(error.message);
  } catch (error) {
    await logAdminEvent({
      level: "warning",
      source: "admin",
      kind: "audit_write_failed",
      message: `Audit row could not be written for ${input.tableName}/${input.rowId}: ${describeError(error)}`,
      context: { action: input.action, actor: input.actor },
    });
  }
}

/**
 * Run `mutate` with before/after snapshots of `tableName/rowId`. For inserts
 * pass the id the mutation returns via `resolveRowId`.
 */
export async function withAudit<T>(
  input: Omit<AuditInput, "rowId"> & { rowId?: string; resolveRowId?: (result: T) => string },
  mutate: () => Promise<T>,
): Promise<T> {
  const before = input.rowId ? await snapshot(input.tableName, input.rowId) : null;
  const result = await mutate();
  const rowId = input.rowId ?? input.resolveRowId?.(result);
  if (!rowId) return result;
  const after = input.action === "delete" ? null : await snapshot(input.tableName, rowId);
  await writeAudit({ ...input, rowId, before, after });
  return result;
}
