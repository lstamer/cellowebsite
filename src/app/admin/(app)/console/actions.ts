"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/components/admin/controls";
import { requireAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { getAdminDb } from "@/lib/admin/db";

export async function acknowledgeEventAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { ok: false, message: "Missing event id." };

  const { error } = await getAdminDb()
    .from("admin_events")
    .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: session.email })
    .eq("id", id)
    .is("acknowledged_at", null);
  if (error) return { ok: false, message: `Could not acknowledge: ${error.message}` };
  revalidatePath("/admin/console");
  revalidatePath("/admin");
  return { ok: true, message: "Acknowledged." };
}

export async function acknowledgeAllErrorsAction(): Promise<ActionResult> {
  const session = await requireAdmin();
  const { error, count } = await getAdminDb()
    .from("admin_events")
    .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: session.email }, { count: "exact" })
    .is("acknowledged_at", null)
    .in("level", ["error", "warn"]);
  if (error) return { ok: false, message: `Could not acknowledge: ${error.message}` };
  await recordAudit({ actor: session.email, table: "admin_events", rowId: "*", action: "action", note: `Acknowledged ${count ?? 0} open events` });
  revalidatePath("/admin/console");
  revalidatePath("/admin");
  return { ok: true, message: `Acknowledged ${count ?? 0} events.` };
}

export async function retryOutboxEventAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { ok: false, message: "Missing outbox id." };

  // Requeue: the 3-minute dispatcher picks pending rows up. Attempts reset so
  // a permanently failed event gets its full budget again.
  const { error } = await getAdminDb()
    .from("inquiry_outbox_events")
    .update({ status: "pending", attempts: 0, available_at: new Date().toISOString(), claim_token: null, claimed_at: null, last_error: null })
    .eq("id", id)
    .eq("status", "failed");
  if (error) return { ok: false, message: `Requeue failed: ${error.message}` };
  await recordAudit({ actor: session.email, table: "inquiry_outbox_events", rowId: id, action: "action", note: "Requeued failed outbox event" });
  revalidatePath("/admin/console");
  return { ok: true, message: "Requeued. The dispatcher runs every three minutes." };
}
