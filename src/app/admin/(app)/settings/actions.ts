"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionResult } from "@/components/admin/controls";
import { adminHref, requireAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { getAdminDb } from "@/lib/admin/db";
import { logAdminEvent } from "@/lib/admin/events";
import { getBrainDoc, getPromptTemplateRow, getReplyExample } from "@/lib/admin/queries";
import {
  PROMPT_TEMPLATE_DEFAULTS,
  isPromptTemplateSlug,
  validatePromptTemplate,
} from "@/lib/inquiries/prompt-templates";
import { requireEnv } from "@/lib/inquiries/env";
import { sendTelegramMessage } from "@/lib/inquiries/telegram";

const BRAIN_CATEGORIES = ["identity", "services", "pricing", "logistics", "repertoire", "faq", "general"];
const INTENTS = [
  "availability",
  "pricing",
  "booking_process",
  "event_details",
  "repertoire",
  "media_request",
  "technical_requirements",
  "referral",
  "other",
];

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ---------------------------------------------------------------------------
// Brain docs
// ---------------------------------------------------------------------------

export async function saveBrainDocAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const existingSlug = text(formData, "slug");
  const title = text(formData, "title");
  const category = text(formData, "category") ?? "general";
  const content = text(formData, "content");
  const sortOrder = Number.parseInt(text(formData, "sort_order") ?? "100", 10);
  const active = formData.get("active") === "on";

  if (!title) return { ok: false, message: "Title is required." };
  if (!content || content.length < 10) return { ok: false, message: "Content is too short." };
  if (!BRAIN_CATEGORIES.includes(category)) return { ok: false, message: "Unknown category." };

  const slug = existingSlug ?? slugify(title);
  if (!slug) return { ok: false, message: "Could not derive a slug from that title." };
  const before = await getBrainDoc(slug);

  const { data: version, error } = await getAdminDb().rpc("save_brain_doc", {
    p_slug: slug,
    p_title: title,
    p_category: category,
    p_content: content,
    p_active: active,
    p_sort_order: Number.isFinite(sortOrder) ? sortOrder : 100,
    p_actor: session.email,
  });
  if (error) return { ok: false, message: `Save failed: ${error.message}` };

  await recordAudit({
    actor: session.email,
    table: "inquiry_brain_docs",
    rowId: slug,
    action: before ? "update" : "insert",
    before: before ? { title: before.title, content: before.content, active: before.active } : null,
    after: { title, content, active, version },
  });
  revalidatePath("/admin/settings/brain");
  revalidatePath(`/admin/settings/brain/${slug}`);
  if (!existingSlug) redirect(await adminHref(`/settings/brain/${slug}`));
  return { ok: true, message: `Saved as version ${version}. Drafts pick it up within a minute.` };
}

export async function restoreBrainDocVersionAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const slug = text(formData, "slug");
  const version = Number.parseInt(text(formData, "version") ?? "", 10);
  if (!slug || !Number.isFinite(version)) return { ok: false, message: "Missing version." };

  const db = getAdminDb();
  const { data: row, error } = await db
    .from("inquiry_brain_doc_versions")
    .select("title, category, content")
    .eq("slug", slug)
    .eq("version", version)
    .maybeSingle();
  if (error || !row) return { ok: false, message: "That version could not be loaded." };
  const current = await getBrainDoc(slug);

  const { data: newVersion, error: saveError } = await db.rpc("save_brain_doc", {
    p_slug: slug,
    p_title: row.title,
    p_category: row.category,
    p_content: row.content,
    p_active: current?.active ?? true,
    p_sort_order: current?.sort_order ?? 100,
    p_actor: session.email,
  });
  if (saveError) return { ok: false, message: `Restore failed: ${saveError.message}` };
  await recordAudit({ actor: session.email, table: "inquiry_brain_docs", rowId: slug, action: "action", note: `Restored version ${version} as version ${newVersion}` });
  revalidatePath(`/admin/settings/brain/${slug}`);
  return { ok: true, message: `Restored version ${version} as version ${newVersion}.` };
}

// ---------------------------------------------------------------------------
// Reply examples
// ---------------------------------------------------------------------------

export async function saveReplyExampleAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const id = text(formData, "id");
  const customerMessage = text(formData, "customer_message");
  const reply = text(formData, "reply");
  const intents = formData
    .getAll("intents")
    .map(String)
    .filter((intent) => INTENTS.includes(intent));
  const kind = text(formData, "kind") ?? "manual";
  const active = formData.get("active") === "on";

  if (!customerMessage) return { ok: false, message: "The customer message is required." };
  if (!reply) return { ok: false, message: "The reply is required." };
  if (!["past_chat", "override", "manual"].includes(kind)) return { ok: false, message: "Unknown kind." };

  const payload = {
    kind,
    intents,
    customer_message: customerMessage,
    situation_summary: text(formData, "situation_summary"),
    rejected_draft: text(formData, "rejected_draft"),
    reply,
    active,
  };

  const db = getAdminDb();
  if (id) {
    const before = await getReplyExample(id);
    if (!before) return { ok: false, message: "Example not found." };
    const { error } = await db.from("inquiry_reply_examples").update(payload).eq("id", id);
    if (error) return { ok: false, message: `Save failed: ${error.message}` };
    await recordAudit({ actor: session.email, table: "inquiry_reply_examples", rowId: id, action: "update", before: { reply: before.reply, active: before.active }, after: { reply, active } });
    revalidatePath(`/admin/settings/examples/${id}`);
    revalidatePath("/admin/settings/examples");
    return { ok: true, message: "Saved." };
  }

  const { data, error } = await db
    .from("inquiry_reply_examples")
    .insert({ ...payload, source: "admin" })
    .select("id")
    .single();
  if (error || !data) return { ok: false, message: `Create failed: ${error?.message ?? "no id"}` };
  await recordAudit({ actor: session.email, table: "inquiry_reply_examples", rowId: data.id, action: "insert", after: payload });
  revalidatePath("/admin/settings/examples");
  redirect(await adminHref(`/settings/examples/${data.id}`));
}

export async function toggleReplyExampleAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const id = text(formData, "id");
  const active = formData.get("active") === "1";
  if (!id) return { ok: false, message: "Missing id." };
  const { error } = await getAdminDb().from("inquiry_reply_examples").update({ active }).eq("id", id);
  if (error) return { ok: false, message: `Update failed: ${error.message}` };
  await recordAudit({ actor: session.email, table: "inquiry_reply_examples", rowId: id, action: "update", after: { active } });
  revalidatePath("/admin/settings/examples");
  return { ok: true, message: active ? "Activated." : "Deactivated." };
}

// ---------------------------------------------------------------------------
// Prompt templates
// ---------------------------------------------------------------------------

export async function savePromptTemplateAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const slug = text(formData, "slug");
  const content = text(formData, "content");
  const note = text(formData, "note");
  const active = formData.get("active") === "on";

  if (!slug || !isPromptTemplateSlug(slug)) return { ok: false, message: "Unknown prompt." };
  if (!content) return { ok: false, message: "The prompt cannot be empty." };
  const invalid = validatePromptTemplate(slug, content);
  if (invalid) return { ok: false, message: invalid };

  const definition = PROMPT_TEMPLATE_DEFAULTS[slug];
  const before = await getPromptTemplateRow(slug);
  const { data: version, error } = await getAdminDb().rpc("save_prompt_template", {
    p_slug: slug,
    p_title: definition.title,
    p_description: definition.description,
    p_content: content,
    p_active: active,
    p_actor: session.email,
    p_note: note,
  });
  if (error) return { ok: false, message: `Save failed: ${error.message}` };

  await recordAudit({
    actor: session.email,
    table: "inquiry_prompt_templates",
    rowId: slug,
    action: before ? "update" : "insert",
    before: before ? { content: before.content, active: before.active } : { content: definition.content, active: false },
    after: { content, active, version },
    note: note ?? undefined,
  });
  await logAdminEvent({
    level: "info",
    source: "admin",
    kind: "prompt_template_saved",
    message: `Prompt "${definition.title}" saved as version ${version}${active ? " (active)" : " (inactive, default in use)"}.`,
    context: { slug, version },
  });
  revalidatePath(`/admin/settings/prompts/${slug}`);
  revalidatePath("/admin/settings/prompts");
  return { ok: true, message: `Saved as version ${version}. Drafting tasks pick it up within a minute.` };
}

export async function restorePromptVersionAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const slug = text(formData, "slug");
  const version = Number.parseInt(text(formData, "version") ?? "", 10);
  if (!slug || !isPromptTemplateSlug(slug) || !Number.isFinite(version)) return { ok: false, message: "Missing version." };

  const db = getAdminDb();
  const { data: row, error } = await db
    .from("inquiry_prompt_template_versions")
    .select("content")
    .eq("slug", slug)
    .eq("version", version)
    .maybeSingle();
  if (error || !row) return { ok: false, message: "That version could not be loaded." };
  const invalid = validatePromptTemplate(slug, row.content);
  if (invalid) return { ok: false, message: `That version is no longer valid: ${invalid}` };

  const definition = PROMPT_TEMPLATE_DEFAULTS[slug];
  const { data: newVersion, error: saveError } = await db.rpc("save_prompt_template", {
    p_slug: slug,
    p_title: definition.title,
    p_description: definition.description,
    p_content: row.content,
    p_active: true,
    p_actor: session.email,
    p_note: `Restored version ${version}`,
  });
  if (saveError) return { ok: false, message: `Restore failed: ${saveError.message}` };
  await recordAudit({ actor: session.email, table: "inquiry_prompt_templates", rowId: slug, action: "action", note: `Restored version ${version} as version ${newVersion}` });
  revalidatePath(`/admin/settings/prompts/${slug}`);
  return { ok: true, message: `Restored version ${version} as version ${newVersion}.` };
}

export async function resetPromptToDefaultAction(_state: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireAdmin();
  const slug = text(formData, "slug");
  if (!slug || !isPromptTemplateSlug(slug)) return { ok: false, message: "Unknown prompt." };
  const { error } = await getAdminDb().from("inquiry_prompt_templates").update({ active: false, updated_by: session.email }).eq("slug", slug);
  if (error) return { ok: false, message: `Reset failed: ${error.message}` };
  await recordAudit({ actor: session.email, table: "inquiry_prompt_templates", rowId: slug, action: "update", after: { active: false } });
  revalidatePath(`/admin/settings/prompts/${slug}`);
  revalidatePath("/admin/settings/prompts");
  return { ok: true, message: "The code default is back in use. Your saved versions are kept." };
}

// ---------------------------------------------------------------------------
// Integrations
// ---------------------------------------------------------------------------

export async function sendTelegramTestAction(): Promise<ActionResult> {
  const session = await requireAdmin();
  try {
    await sendTelegramMessage({ chatId: requireEnv("TELEGRAM_CHAT_ID"), text: `🔧 Test message from admin.stamer.co.za, sent by ${session.email}.` });
    await logAdminEvent({ level: "info", source: "admin", kind: "telegram_test", message: "Telegram test message sent from the admin." });
    return { ok: true, message: "Sent. Check Telegram." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await logAdminEvent({ level: "error", source: "telegram", kind: "telegram_test_failed", message: `Telegram test failed: ${message}` });
    return { ok: false, message: `Telegram failed: ${message}` };
  }
}
