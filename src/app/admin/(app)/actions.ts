"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { withAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import { describeError, logAdminEvent } from "@/lib/admin/events";
import { adminPath } from "@/lib/admin/paths";
import { loadTemplateOverrides } from "@/lib/admin/template-store";
import { getTemplateDefinition, validateTemplateContent } from "@/lib/admin/templates";
import { deliverLeadAlert } from "@/lib/inquiries/lead-alert";
import { normalizePhoneE164, toWaMeDigits } from "@/lib/inquiries/phone";
import { getSupabaseAdmin, skipWebsiteLeadAlert } from "@/lib/inquiries/supabase";
import { sendTelegramMessage } from "@/lib/inquiries/telegram";
import { triggerWebsiteLeadDraft } from "@/lib/inquiries/triggering";
import { requireEnv } from "@/lib/inquiries/env";

export type ActionResult = { ok: true; message?: string; id?: string } | { ok: false; error: string };

function failure(error: unknown): ActionResult {
  return { ok: false, error: describeError(error) };
}

const STAGES = ["new", "contacted", "quoted", "booked", "played", "lost"] as const;
const uuid = z.string().uuid();

function text(max: number) {
  return z.string().trim().max(max);
}

function optionalText(max: number) {
  return text(max).transform((value) => (value === "" ? null : value));
}

function parseTags(raw: string): string[] {
  return [...new Set(raw.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 20);
}

// ---------------------------------------------------------------------------
// Website leads
// ---------------------------------------------------------------------------

const leadUpdateSchema = z.object({
  id: uuid,
  first_name: text(80).min(1),
  last_name: optionalText(80),
  email: z.string().trim().email().max(200),
  phone: optionalText(40),
  whatsapp: optionalText(40),
  event_type: optionalText(80),
  event_date_text: optionalText(80),
  event_date_iso: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value)),
  location: optionalText(200),
  guest_count: z.coerce.number().int().min(0).max(100000).nullable().or(z.literal("").transform(() => null)),
  performance_minutes: z.coerce.number().int().min(0).max(1440).nullable().or(z.literal("").transform(() => null)),
  booker_role: optionalText(80),
  message: optionalText(4000),
  notes: optionalText(4000),
});

export async function updateWebsiteLead(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const input = leadUpdateSchema.parse(Object.fromEntries(formData));
    const whatsappSource = input.whatsapp ?? input.phone;
    const phoneE164 = normalizePhoneE164(whatsappSource);
    const whatsappDigits = toWaMeDigits(whatsappSource);

    await withAudit(
      { actor: session.email, tableName: "inquiry_website_leads", rowId: input.id, action: "update" },
      async () => {
        const { id, ...fields } = input;
        const { error } = await getSupabaseAdmin()
          .from("inquiry_website_leads")
          .update({ ...fields, phone_e164: phoneE164, whatsapp_digits: whatsappDigits, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw new Error(error.message);
      },
    );

    revalidatePath(adminPath(`/inquiries/${input.id}`));
    revalidatePath(adminPath("/inquiries"));
    return { ok: true, message: "Lead updated." };
  } catch (error) {
    return failure(error);
  }
}

export async function setWebsiteLeadStatus(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { id, status } = z
      .object({ id: uuid, status: z.enum(["new", "dismissed", "approved", "expired"]) })
      .parse(Object.fromEntries(formData));

    await withAudit(
      { actor: session.email, tableName: "inquiry_website_leads", rowId: id, action: "update", note: `status → ${status}` },
      async () => {
        const { error } = await getSupabaseAdmin()
          .from("inquiry_website_leads")
          .update({
            status,
            decided_by: status === "new" ? null : session.email,
            decided_at: status === "new" ? null : new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (error) throw new Error(error.message);
      },
    );

    revalidatePath(adminPath(`/inquiries/${id}`));
    revalidatePath(adminPath("/inquiries"));
    return { ok: true, message: `Marked ${status}.` };
  } catch (error) {
    return failure(error);
  }
}

export async function resendLeadAlert(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { id } = z.object({ id: uuid }).parse(Object.fromEntries(formData));

    // Put the row back to a claimable state, then run the normal delivery.
    const { error } = await getSupabaseAdmin()
      .from("inquiry_website_leads")
      .update({ alert_status: "pending", alert_error: null, updated_at: new Date().toISOString() })
      .eq("id", id)
      .neq("alert_status", "sending");
    if (error) throw new Error(error.message);

    const outcome = await withAudit(
      { actor: session.email, tableName: "inquiry_website_leads", rowId: id, action: "action", note: "resend Telegram alert" },
      () => deliverLeadAlert({ leadId: id, triggeredBy: "admin" }),
    );

    revalidatePath(adminPath(`/inquiries/${id}`));
    if (outcome.status === "sent") return { ok: true, message: "Telegram alert sent." };
    if (outcome.status === "failed") return { ok: false, error: `Telegram rejected it: ${outcome.error}` };
    return { ok: false, error: `Not sent: alert is ${outcome.leadStatus ?? "unavailable"}.` };
  } catch (error) {
    return failure(error);
  }
}

export async function skipLeadAlert(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { id } = z.object({ id: uuid }).parse(Object.fromEntries(formData));
    await withAudit(
      { actor: session.email, tableName: "inquiry_website_leads", rowId: id, action: "action", note: "stop alert retries" },
      () => skipWebsiteLeadAlert({ leadId: id, reason: `Stopped from admin by ${session.email}` }),
    );
    revalidatePath(adminPath(`/inquiries/${id}`));
    return { ok: true, message: "Alert retries stopped." };
  } catch (error) {
    return failure(error);
  }
}

export async function rerunLeadDraft(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { id } = z.object({ id: uuid }).parse(Object.fromEntries(formData));
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("inquiry_website_leads")
      .select("availability, status")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data?.availability) {
      return { ok: false, error: "Answer Available / Unavailable on the Telegram card first; the draft needs it." };
    }

    await withAudit(
      { actor: session.email, tableName: "inquiry_website_leads", rowId: id, action: "action", note: "re-run draft" },
      async () => {
        const { error: resetError } = await supabase
          .from("inquiry_website_leads")
          .update({
            status: "new",
            drafting_started_at: null,
            review_notification_status: "pending",
            review_notification_error: null,
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (resetError) throw new Error(resetError.message);
        await triggerWebsiteLeadDraft(id);
      },
    );

    revalidatePath(adminPath(`/inquiries/${id}`));
    return { ok: true, message: "Draft queued. A new review card will arrive on Telegram." };
  } catch (error) {
    return failure(error);
  }
}

export async function linkLeadToPerson(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { id, personId } = z
      .object({ id: uuid, personId: uuid.or(z.literal("")) })
      .parse(Object.fromEntries(formData));
    await withAudit(
      { actor: session.email, tableName: "inquiry_website_leads", rowId: id, action: "update", note: personId ? "link person" : "unlink person" },
      async () => {
        const { error } = await getSupabaseAdmin()
          .from("inquiry_website_leads")
          .update({ person_id: personId || null, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw new Error(error.message);
      },
    );
    revalidatePath(adminPath(`/inquiries/${id}`));
    return { ok: true, message: personId ? "Linked." : "Unlinked." };
  } catch (error) {
    return failure(error);
  }
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

const personSchema = z.object({
  id: uuid.optional(),
  display_name: optionalText(120),
  email: z.string().trim().email().max(200).or(z.literal("")).transform((value) => (value === "" ? null : value)),
  phone: optionalText(40),
  stage: z.enum(STAGES),
  source: optionalText(60),
  tags: z.string().max(500).default(""),
  notes: optionalText(8000),
});

export async function savePerson(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const input = personSchema.parse(Object.fromEntries(formData));
    const phoneE164 = input.phone ? normalizePhoneE164(input.phone) : null;
    if (input.phone && !phoneE164) return { ok: false, error: "That phone number could not be normalised. Use +27… or 0… format." };
    if (!phoneE164 && !input.email) return { ok: false, error: "A contact needs at least an email or a phone number." };

    const supabase = getSupabaseAdmin();
    const fields = {
      display_name: input.display_name,
      email: input.email,
      phone_e164: phoneE164,
      stage: input.stage,
      source: input.source,
      tags: parseTags(input.tags),
      notes: input.notes,
      updated_by: session.email,
      updated_at: new Date().toISOString(),
    };

    if (input.id) {
      const personId = input.id;
      await withAudit(
        { actor: session.email, tableName: "inquiry_people", rowId: personId, action: "update" },
        async () => {
          const { error } = await supabase.from("inquiry_people").update(fields).eq("id", personId);
          if (error) throw new Error(error.message);
        },
      );
      revalidatePath(adminPath(`/contacts/${personId}`));
      revalidatePath(adminPath("/contacts"));
      return { ok: true, message: "Contact saved.", id: personId };
    }

    const created = await withAudit<{ id: string }>(
      { actor: session.email, tableName: "inquiry_people", action: "insert", resolveRowId: (row) => row.id },
      async () => {
        const { data, error } = await supabase
          .from("inquiry_people")
          .insert({ ...fields, source: fields.source ?? "manual", last_activity_at: new Date().toISOString() })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        return data as { id: string };
      },
    );
    revalidatePath(adminPath("/contacts"));
    return { ok: true, message: "Contact created.", id: created.id };
  } catch (error) {
    return failure(error);
  }
}

export async function setPersonStage(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { id, stage } = z.object({ id: uuid, stage: z.enum(STAGES) }).parse(Object.fromEntries(formData));
    await withAudit(
      { actor: session.email, tableName: "inquiry_people", rowId: id, action: "update", note: `stage → ${stage}` },
      async () => {
        const { error } = await getSupabaseAdmin()
          .from("inquiry_people")
          .update({ stage, updated_by: session.email, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw new Error(error.message);
      },
    );
    revalidatePath(adminPath(`/contacts/${id}`));
    revalidatePath(adminPath("/contacts"));
    revalidatePath(adminPath("/inquiries"));
    return { ok: true, message: `Stage set to ${stage}.` };
  } catch (error) {
    return failure(error);
  }
}

export async function archivePerson(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { id, restore } = z.object({ id: uuid, restore: z.literal("1").optional() }).parse(Object.fromEntries(formData));
    await withAudit(
      { actor: session.email, tableName: "inquiry_people", rowId: id, action: "update", note: restore ? "restore" : "archive" },
      async () => {
        const { error } = await getSupabaseAdmin()
          .from("inquiry_people")
          .update({ archived_at: restore ? null : new Date().toISOString(), updated_by: session.email, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw new Error(error.message);
      },
    );
    revalidatePath(adminPath(`/contacts/${id}`));
    revalidatePath(adminPath("/contacts"));
    return { ok: true, message: restore ? "Contact restored." : "Contact archived." };
  } catch (error) {
    return failure(error);
  }
}

export async function mergePeople(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { keep, drop } = z.object({ keep: uuid, drop: uuid }).parse(Object.fromEntries(formData));
    if (keep === drop) return { ok: false, error: "Pick two different contacts." };

    const result = await withAudit(
      { actor: session.email, tableName: "inquiry_people", rowId: keep, action: "merge", note: `merged ${drop} into ${keep}` },
      async () => {
        const { data, error } = await getSupabaseAdmin().rpc("merge_inquiry_people", {
          p_keep: keep,
          p_drop: drop,
          p_actor: session.email,
        });
        if (error) throw new Error(error.message);
        return data as { movedLeads: number; movedContacts: number };
      },
    );
    revalidatePath(adminPath("/contacts"));
    revalidatePath(adminPath(`/contacts/${keep}`));
    return { ok: true, message: `Merged. Moved ${result.movedLeads} lead(s) and ${result.movedContacts} WhatsApp contact(s).`, id: keep };
  } catch (error) {
    return failure(error);
  }
}

// ---------------------------------------------------------------------------
// Console
// ---------------------------------------------------------------------------

export async function acknowledgeEvent(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { id, all } = z.object({ id: uuid.optional(), all: z.literal("1").optional() }).parse(Object.fromEntries(formData));
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    if (all) {
      const { error } = await supabase
        .from("admin_events")
        .update({ acknowledged_at: now, acknowledged_by: session.email })
        .is("acknowledged_at", null);
      if (error) throw new Error(error.message);
    } else if (id) {
      const { error } = await supabase
        .from("admin_events")
        .update({ acknowledged_at: now, acknowledged_by: session.email })
        .eq("id", id);
      if (error) throw new Error(error.message);
    }
    revalidatePath(adminPath("/console"));
    revalidatePath(adminPath());
    return { ok: true, message: all ? "All events acknowledged." : "Acknowledged." };
  } catch (error) {
    return failure(error);
  }
}

// ---------------------------------------------------------------------------
// Settings: brain docs, examples, templates, integrations
// ---------------------------------------------------------------------------

const brainDocSchema = z.object({
  id: uuid.optional(),
  slug: z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,60}$/),
  title: text(120).min(1),
  category: z.enum(["identity", "services", "pricing", "logistics", "repertoire", "faq", "general"]),
  content: z.string().trim().min(1).max(20000),
  active: z.literal("on").optional(),
  sort_order: z.coerce.number().int().min(0).max(10000).default(100),
});

export async function saveBrainDoc(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const input = brainDocSchema.parse(Object.fromEntries(formData));
    const result = await withAudit<{ id: string; version: number }>(
      { actor: session.email, tableName: "inquiry_brain_docs", rowId: input.id, action: input.id ? "update" : "insert", resolveRowId: (row) => row.id },
      async () => {
        const { data, error } = await getSupabaseAdmin().rpc("save_brain_doc", {
          p_id: input.id ?? null,
          p_slug: input.slug,
          p_title: input.title,
          p_category: input.category,
          p_content: input.content,
          p_active: input.active === "on",
          p_sort_order: input.sort_order,
          p_actor: session.email,
        });
        if (error) throw new Error(error.message);
        return data as { id: string; version: number };
      },
    );
    revalidatePath(adminPath("/settings/brain"));
    revalidatePath(adminPath(`/settings/brain/${result.id}`));
    return { ok: true, message: `Saved as version ${result.version}.`, id: result.id };
  } catch (error) {
    return failure(error);
  }
}

const exampleSchema = z.object({
  id: uuid.optional(),
  kind: z.enum(["past_chat", "override", "manual"]).default("manual"),
  intents: z.string().max(300).default(""),
  customer_message: z.string().trim().min(1).max(4000),
  situation_summary: optionalText(1000),
  rejected_draft: optionalText(4000),
  reply: z.string().trim().min(1).max(4000),
  active: z.literal("on").optional(),
});

export async function saveReplyExample(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const input = exampleSchema.parse(Object.fromEntries(formData));
    const supabase = getSupabaseAdmin();
    const fields = {
      kind: input.kind,
      intents: parseTags(input.intents),
      customer_message: input.customer_message,
      situation_summary: input.situation_summary,
      rejected_draft: input.rejected_draft,
      reply: input.reply,
      active: input.active === "on",
      updated_by: session.email,
      updated_at: new Date().toISOString(),
    };
    if (input.id) {
      const exampleId = input.id;
      await withAudit(
        { actor: session.email, tableName: "inquiry_reply_examples", rowId: exampleId, action: "update" },
        async () => {
          const { error } = await supabase.from("inquiry_reply_examples").update(fields).eq("id", exampleId);
          if (error) throw new Error(error.message);
        },
      );
    } else {
      await withAudit<{ id: string }>(
        { actor: session.email, tableName: "inquiry_reply_examples", action: "insert", resolveRowId: (row) => row.id },
        async () => {
          const { data, error } = await supabase
            .from("inquiry_reply_examples")
            .insert({ ...fields, source: "admin" })
            .select("id")
            .single();
          if (error) throw new Error(error.message);
          return data as { id: string };
        },
      );
    }
    revalidatePath(adminPath("/settings/examples"));
    return { ok: true, message: "Example saved." };
  } catch (error) {
    return failure(error);
  }
}

export async function toggleReplyExample(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { id, active } = z.object({ id: uuid, active: z.enum(["1", "0"]) }).parse(Object.fromEntries(formData));
    await withAudit(
      { actor: session.email, tableName: "inquiry_reply_examples", rowId: id, action: "update", note: active === "1" ? "activate" : "deactivate" },
      async () => {
        const { error } = await getSupabaseAdmin()
          .from("inquiry_reply_examples")
          .update({ active: active === "1", updated_by: session.email, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw new Error(error.message);
      },
    );
    revalidatePath(adminPath("/settings/examples"));
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

const templateSaveSchema = z.object({
  slug: z.string().trim().min(1),
  content: z.string().max(20000),
  note: optionalText(200),
});

export async function saveTemplate(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const input = templateSaveSchema.parse(Object.fromEntries(formData));
    const definition = getTemplateDefinition(input.slug);
    if (!definition) return { ok: false, error: "Unknown template." };
    const valid = validateTemplateContent(definition, input.content);
    if (!valid.ok) return { ok: false, error: valid.reason };

    const result = await withAudit<{ version: number }>(
      { actor: session.email, tableName: "inquiry_prompt_templates", rowId: input.slug, action: "update", note: input.note ?? undefined },
      async () => {
        const { data, error } = await getSupabaseAdmin().rpc("save_prompt_template", {
          p_slug: input.slug,
          p_kind: definition.kind,
          p_content: input.content,
          p_actor: session.email,
          p_note: input.note,
        });
        if (error) throw new Error(error.message);
        return data as { version: number };
      },
    );
    await loadTemplateOverrides({ force: true });
    revalidatePath(adminPath("/settings/prompts"));
    revalidatePath(adminPath("/settings/telegram"));
    revalidatePath(adminPath(`/settings/templates/${input.slug}`));
    return { ok: true, message: `Saved as version ${result.version}. Live now.` };
  } catch (error) {
    return failure(error);
  }
}

export async function resetTemplate(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { slug } = z.object({ slug: z.string().trim().min(1) }).parse(Object.fromEntries(formData));
    await withAudit(
      { actor: session.email, tableName: "inquiry_prompt_templates", rowId: slug, action: "update", note: "reset to code default" },
      async () => {
        const { error } = await getSupabaseAdmin()
          .from("inquiry_prompt_templates")
          .update({ active: false, updated_by: session.email, updated_at: new Date().toISOString() })
          .eq("slug", slug);
        if (error) throw new Error(error.message);
      },
    );
    await loadTemplateOverrides({ force: true });
    revalidatePath(adminPath("/settings/prompts"));
    revalidatePath(adminPath("/settings/telegram"));
    revalidatePath(adminPath(`/settings/templates/${slug}`));
    return { ok: true, message: "Back to the built-in default." };
  } catch (error) {
    return failure(error);
  }
}

export async function sendTelegramTest(): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    await sendTelegramMessage({
      chatId: requireEnv("TELEGRAM_CHAT_ID"),
      text: `🔔 Test message from the admin (${session.email}). If you can read this, Telegram alerts are working.`,
    });
    await logAdminEvent({ level: "info", source: "telegram", kind: "test_message_sent", message: `Test message sent by ${session.email}.` });
    return { ok: true, message: "Sent. Check the Telegram chat." };
  } catch (error) {
    await logAdminEvent({ level: "error", source: "telegram", kind: "test_message_failed", message: describeError(error) });
    return failure(error);
  }
}
