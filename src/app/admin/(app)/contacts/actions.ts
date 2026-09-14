"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/components/admin/controls";
import { adminHref, requireAdmin } from "@/lib/admin/auth";
import { diffRecords, recordAudit } from "@/lib/admin/audit";
import { getAdminDb } from "@/lib/admin/db";
import { getPerson } from "@/lib/admin/queries";
import { normalizePhoneE164 } from "@/lib/inquiries/phone";

export const STAGES = ["new", "contacted", "quoted", "booked", "played", "lost"] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function tags(formData: FormData): string[] {
  return (text(formData, "tags") ?? "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20);
}

export async function createPersonAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const name = text(formData, "display_name");
  const email = text(formData, "email");
  const phoneRaw = text(formData, "phone_e164");
  const phone = phoneRaw ? normalizePhoneE164(phoneRaw) : null;

  if (phoneRaw && !phone) return { ok: false, message: "Phone must include the country code, e.g. +27 82 123 4567." };
  if (email && !EMAIL_REGEX.test(email)) return { ok: false, message: "Enter a valid email." };
  if (!phone && !email) return { ok: false, message: "A contact needs at least a phone or an email." };
  const stage = text(formData, "stage") ?? "new";
  if (!(STAGES as readonly string[]).includes(stage)) return { ok: false, message: "Invalid stage." };

  const db = getAdminDb();
  // Reuse the identity RPC so a duplicate phone or email lands on the same person.
  const { data: personId, error } = await db.rpc("upsert_inquiry_person", {
    p_phone_e164: phone,
    p_display_name: name,
    p_email: email,
  });
  if (error || typeof personId !== "string") return { ok: false, message: `Could not create contact: ${error?.message ?? "no id returned"}` };

  const { error: updateError } = await db
    .from("inquiry_people")
    .update({
      display_name: name,
      email: email ?? undefined,
      stage,
      source: text(formData, "source") ?? "manual",
      tags: tags(formData),
      notes: text(formData, "notes"),
      updated_by: session.email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", personId);
  if (updateError) return { ok: false, message: `Contact created but details failed: ${updateError.message}` };

  await recordAudit({ actor: session.email, table: "inquiry_people", rowId: personId, action: "insert", after: { display_name: name, email, phone_e164: phone, stage } });
  revalidatePath("/admin/contacts");
  redirect(await adminHref(`/contacts/${personId}`));
}

export async function updatePersonAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const id = text(formData, "id");
  if (!id) return { ok: false, message: "Missing contact id." };
  const before = await getPerson(id);
  if (!before) return { ok: false, message: "Contact not found." };

  const email = text(formData, "email");
  const phoneRaw = text(formData, "phone_e164");
  const phone = phoneRaw ? normalizePhoneE164(phoneRaw) : null;
  if (phoneRaw && !phone) return { ok: false, message: "Phone must include the country code." };
  if (email && !EMAIL_REGEX.test(email)) return { ok: false, message: "Enter a valid email." };
  if (!phone && !email) return { ok: false, message: "A contact needs at least a phone or an email." };
  const stage = text(formData, "stage") ?? before.stage;
  if (!(STAGES as readonly string[]).includes(stage)) return { ok: false, message: "Invalid stage." };

  const after = {
    display_name: text(formData, "display_name"),
    email,
    phone_e164: phone,
    stage,
    source: text(formData, "source"),
    tags: tags(formData),
    notes: text(formData, "notes"),
    updated_by: session.email,
    updated_at: new Date().toISOString(),
  };

  const { error } = await getAdminDb().from("inquiry_people").update(after).eq("id", id);
  if (error) {
    if (error.code === "23505") return { ok: false, message: "Another contact already has that phone or email. Merge them instead." };
    return { ok: false, message: `Save failed: ${error.message}` };
  }

  const diff = diffRecords(before as unknown as Record<string, unknown>, after);
  await recordAudit({ actor: session.email, table: "inquiry_people", rowId: id, action: "update", ...diff });
  revalidatePath("/admin/contacts");
  revalidatePath(`/admin/contacts/${id}`);
  return { ok: true, message: "Saved." };
}

export async function mergePersonAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const keep = text(formData, "keep");
  const drop = text(formData, "drop");
  if (!keep || !drop) return { ok: false, message: "Both contact ids are required." };
  if (keep === drop) return { ok: false, message: "Those are the same contact." };

  const [keepRow, dropRow] = await Promise.all([getPerson(keep), getPerson(drop)]);
  if (!keepRow || !dropRow) return { ok: false, message: "One of those contacts does not exist." };

  const { error } = await getAdminDb().rpc("merge_inquiry_people", { p_keep: keep, p_drop: drop });
  if (error) return { ok: false, message: `Merge failed: ${error.message}` };

  await recordAudit({
    actor: session.email,
    table: "inquiry_people",
    rowId: keep,
    action: "merge",
    before: dropRow as unknown as Record<string, unknown>,
    note: `Merged ${drop} into ${keep}`,
  });
  revalidatePath("/admin/contacts");
  revalidatePath(`/admin/contacts/${keep}`);
  return { ok: true, message: "Merged. The other contact's enquiries now show here." };
}

export async function archivePersonAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const id = text(formData, "id");
  const restore = formData.get("restore") === "1";
  if (!id) return { ok: false, message: "Missing contact id." };

  const { error } = await getAdminDb()
    .from("inquiry_people")
    .update({ archived_at: restore ? null : new Date().toISOString(), updated_by: session.email })
    .eq("id", id);
  if (error) return { ok: false, message: `Update failed: ${error.message}` };

  await recordAudit({ actor: session.email, table: "inquiry_people", rowId: id, action: "update", after: { archived: !restore } });
  revalidatePath("/admin/contacts");
  revalidatePath(`/admin/contacts/${id}`);
  return { ok: true, message: restore ? "Restored." : "Archived. It stays in the database and can be restored." };
}
