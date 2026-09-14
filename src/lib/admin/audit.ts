/**
 * Every manual correction made from the admin goes through here so it can be
 * seen, and undone by hand, later. The audit write is best-effort; the
 * mutation it describes has already happened.
 */
import { getAdminDb } from "@/lib/admin/db";
import { describeError } from "@/lib/admin/events";

export type AuditAction = "insert" | "update" | "delete" | "merge" | "action";

export interface AuditEntry {
  actor: string;
  table: string;
  rowId: string;
  action: AuditAction;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  note?: string;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const { error } = await getAdminDb().from("admin_audit_log").insert({
      actor: entry.actor,
      table_name: entry.table,
      row_id: entry.rowId,
      action: entry.action,
      before: entry.before ?? null,
      after: entry.after ?? null,
      note: entry.note ?? null,
    });
    if (error) console.error("admin_audit_log insert failed:", error.message);
  } catch (error) {
    console.error("admin_audit_log insert threw:", describeError(error));
  }
}

/** Only the keys that changed, for a readable audit row. */
export function diffRecords(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};
  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null)) {
      changedBefore[key] = before[key] ?? null;
      changedAfter[key] = after[key] ?? null;
    }
  }
  return { before: changedBefore, after: changedAfter };
}
