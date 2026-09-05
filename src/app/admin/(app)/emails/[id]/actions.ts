"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/components/admin/controls";
import { requireAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { getAdminDb } from "@/lib/admin/db";
import { getEmailThread } from "@/lib/admin/queries";

/** Flip a thread between enquiry and not-enquiry, or dismiss it. */
export async function setEmailThreadAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const classification = String(formData.get("classification") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id) return { ok: false, message: "Missing thread id." };

  const before = await getEmailThread(id);
  if (!before) return { ok: false, message: "Thread not found." };

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (classification === "inquiry" || classification === "not_inquiry") update.classification = classification;
  if (["new", "alerted", "replied", "dismissed"].includes(status)) update.status = status;

  const db = getAdminDb();
  if (update.classification === "inquiry" && !before.person_id && before.from_email) {
    const { data } = await db.rpc("upsert_inquiry_person", { p_phone_e164: null, p_display_name: before.from_name, p_email: before.from_email });
    if (typeof data === "string") update.person_id = data;
  }

  const { error } = await db.from("inquiry_email_threads").update(update).eq("id", id);
  if (error) return { ok: false, message: `Update failed: ${error.message}` };
  await recordAudit({
    actor: session.email,
    table: "inquiry_email_threads",
    rowId: id,
    action: "update",
    before: { classification: before.classification, status: before.status },
    after: update,
  });
  revalidatePath(`/admin/emails/${id}`);
  revalidatePath("/admin/inquiries");
  return { ok: true, message: "Saved." };
}
