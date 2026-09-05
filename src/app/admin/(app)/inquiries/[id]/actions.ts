"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/components/admin/controls";
import { requireAdmin } from "@/lib/admin/auth";
import { diffRecords, recordAudit } from "@/lib/admin/audit";
import { getAdminDb } from "@/lib/admin/db";
import { logAdminEvent } from "@/lib/admin/events";
import { getWebsiteLead } from "@/lib/admin/queries";
import { normalizePhoneE164, toWaMeDigits } from "@/lib/inquiries/phone";
import { getWebsiteLeadAlertRow } from "@/lib/inquiries/supabase";
import { deliverWebsiteLeadAlert } from "@/lib/inquiries/website-leads";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function integer(formData: FormData, key: string): number | null {
  const value = text(formData, key);
  if (value === null) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function updateWebsiteLeadAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const id = text(formData, "id");
  if (!id) return { ok: false, message: "Missing lead id." };

  const before = await getWebsiteLead(id);
  if (!before) return { ok: false, message: "Lead not found." };

  const phone = text(formData, "phone");
  const whatsapp = text(formData, "whatsapp");
  if (phone && !normalizePhoneE164(phone)) return { ok: false, message: "Phone must be a full number with country code, e.g. +27 82 123 4567." };
  if (whatsapp && !normalizePhoneE164(whatsapp)) return { ok: false, message: "WhatsApp must be a full number with country code." };

  const firstName = text(formData, "first_name");
  if (!firstName) return { ok: false, message: "First name is required." };
  const email = text(formData, "email");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, message: "Enter a valid email." };

  const reachable = whatsapp ?? phone;
  const eventDateIso = text(formData, "event_date_iso");
  if (eventDateIso && !/^\d{4}-\d{2}-\d{2}$/.test(eventDateIso)) return { ok: false, message: "Event date must be YYYY-MM-DD." };

  const after = {
    first_name: firstName,
    last_name: text(formData, "last_name"),
    email,
    phone,
    whatsapp,
    whatsapp_digits: toWaMeDigits(reachable ?? ""),
    contact_preference: text(formData, "contact_preference"),
    event_type: text(formData, "event_type"),
    event_date_text: text(formData, "event_date_text"),
    event_date_iso: eventDateIso,
    location: text(formData, "location"),
    guest_count: integer(formData, "guest_count"),
    performance_minutes: integer(formData, "performance_minutes"),
    booker_role: text(formData, "booker_role"),
    message: text(formData, "message"),
    notes: text(formData, "notes"),
    updated_at: new Date().toISOString(),
  };

  const db = getAdminDb();
  const { error } = await db.from("inquiry_website_leads").update(after).eq("id", id);
  if (error) return { ok: false, message: `Save failed: ${error.message}` };

  // Keep the person link in step with the identifiers.
  const phoneE164 = normalizePhoneE164(reachable ?? "");
  const { data: personId } = await db.rpc("upsert_inquiry_person", {
    p_phone_e164: phoneE164,
    p_display_name: [firstName, after.last_name].filter(Boolean).join(" "),
    p_email: email,
  });
  if (typeof personId === "string" && personId !== before.person_id) {
    await db.from("inquiry_website_leads").update({ person_id: personId }).eq("id", id);
  }

  const diff = diffRecords(before as unknown as Record<string, unknown>, after);
  await recordAudit({ actor: session.email, table: "inquiry_website_leads", rowId: id, action: "update", ...diff });

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
  return { ok: true, message: "Saved." };
}

export async function setWebsiteLeadStatusAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const id = text(formData, "id");
  const status = text(formData, "status");
  const allowed = ["new", "dismissed", "approved"];
  if (!id || !status || !allowed.includes(status)) return { ok: false, message: "Invalid status." };

  const before = await getWebsiteLead(id);
  if (!before) return { ok: false, message: "Lead not found." };

  const { error } = await getAdminDb()
    .from("inquiry_website_leads")
    .update({ status, decided_by: session.email, decided_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: `Update failed: ${error.message}` };

  await recordAudit({
    actor: session.email,
    table: "inquiry_website_leads",
    rowId: id,
    action: "update",
    before: { status: before.status },
    after: { status },
  });
  revalidatePath(`/admin/inquiries/${id}`);
  return { ok: true, message: `Marked ${status}.` };
}

export async function resendLeadAlertAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const id = text(formData, "id");
  if (!id) return { ok: false, message: "Missing lead id." };

  const row = await getWebsiteLeadAlertRow(id);
  if (!row) return { ok: false, message: "Lead not found." };

  // A resend is explicit: clear the card ids and budget so the claim succeeds.
  const { error } = await getAdminDb()
    .from("inquiry_website_leads")
    .update({ telegram_chat_id: null, telegram_message_id: null, alert_status: "pending", alert_attempts: 0, alert_error: null })
    .eq("id", id);
  if (error) return { ok: false, message: `Could not reset alert: ${error.message}` };

  const outcome = await deliverWebsiteLeadAlert(row, { attemptSource: "request" });
  await recordAudit({ actor: session.email, table: "inquiry_website_leads", rowId: id, action: "action", note: `Resent Telegram alert: ${outcome.status}` });
  await logAdminEvent({
    level: outcome.status === "sent" ? "info" : "warn",
    source: "admin",
    kind: "lead_alert_resent",
    message: `Telegram alert resent from the admin: ${outcome.status}`,
    leadId: id,
  });
  revalidatePath(`/admin/inquiries/${id}`);

  if (outcome.status === "sent") return { ok: true, message: "Alert sent to Telegram." };
  if (outcome.status === "failed") return { ok: false, message: `Telegram failed: ${outcome.error}` };
  return { ok: false, message: "The alert could not be claimed; try again in a moment." };
}

export async function linkLeadToPersonAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const id = text(formData, "id");
  const personId = text(formData, "person_id");
  if (!id) return { ok: false, message: "Missing lead id." };

  const before = await getWebsiteLead(id);
  if (!before) return { ok: false, message: "Lead not found." };

  if (personId) {
    const { data } = await getAdminDb().from("inquiry_people").select("id").eq("id", personId).maybeSingle();
    if (!data) return { ok: false, message: "No contact with that id." };
  }

  const { error } = await getAdminDb().from("inquiry_website_leads").update({ person_id: personId }).eq("id", id);
  if (error) return { ok: false, message: `Update failed: ${error.message}` };
  await recordAudit({
    actor: session.email,
    table: "inquiry_website_leads",
    rowId: id,
    action: "update",
    before: { person_id: before.person_id },
    after: { person_id: personId },
  });
  revalidatePath(`/admin/inquiries/${id}`);
  return { ok: true, message: personId ? "Linked." : "Unlinked." };
}
