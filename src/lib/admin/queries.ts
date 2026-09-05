/**
 * Typed reads for the admin pages. Every function tolerates a table that the
 * migration has not created yet (returns empty) so the admin can be deployed
 * before `supabase db push` without a wall of errors.
 */
import { z } from "zod";

import { getAdminDb, isMissingRelation } from "@/lib/admin/db";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const inquiryListRowSchema = z.object({
  channel: z.enum(["website", "whatsapp", "email"]),
  id: z.string().uuid(),
  created_at: z.string(),
  last_activity_at: z.string().nullable(),
  origin: z.string().nullable(),
  contact_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  event_type: z.string().nullable(),
  event_date_iso: z.string().nullable(),
  event_date_text: z.string().nullable(),
  location: z.string().nullable(),
  guest_count: z.number().int().nullable(),
  status: z.string(),
  availability: z.string().nullable(),
  alert_status: z.string().nullable(),
  person_id: z.string().uuid().nullable(),
  conversation_id: z.string().uuid().nullable(),
  primary_intent: z.string().nullable(),
  summary: z.string().nullable(),
  preview: z.string().nullable(),
});
export type InquiryListRow = z.infer<typeof inquiryListRowSchema>;

export const websiteLeadSchema = z.object({
  id: z.string().uuid(),
  source: z.string(),
  first_name: z.string(),
  last_name: z.string().nullable(),
  email: z.string(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  whatsapp_digits: z.string().nullable(),
  contact_preference: z.string().nullable(),
  event_type: z.string().nullable(),
  event_date_text: z.string().nullable(),
  event_date_iso: z.string().nullable(),
  date_flexible: z.boolean().nullable(),
  location: z.string().nullable(),
  guest_count: z.number().int().nullable(),
  performance_minutes: z.number().int().nullable(),
  booker_role: z.string().nullable(),
  message: z.string().nullable(),
  notes: z.string().nullable(),
  payload: z.record(z.string(), z.unknown()),
  status: z.string(),
  availability: z.string().nullable(),
  draft_reply: z.string().nullable(),
  final_reply: z.string().nullable(),
  model: z.string().nullable(),
  telegram_chat_id: z.union([z.number(), z.string()]).nullable(),
  telegram_message_id: z.union([z.number(), z.string()]).nullable(),
  review_notification_status: z.string(),
  review_notification_error: z.string().nullable(),
  decided_by: z.string().nullable(),
  decided_at: z.string().nullable(),
  expires_at: z.string(),
  last_error: z.string().nullable(),
  alert_status: z.string().optional().default("pending"),
  alert_error: z.string().nullable().optional().default(null),
  alert_attempts: z.number().int().optional().default(0),
  alert_sent_at: z.string().nullable().optional().default(null),
  session_id: z.string().nullable().optional().default(null),
  person_id: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type WebsiteLead = z.infer<typeof websiteLeadSchema>;

export const personSchema = z.object({
  id: z.string().uuid(),
  phone_e164: z.string().nullable(),
  display_name: z.string().nullable(),
  email: z.string().nullable(),
  stage: z.string().optional().default("new"),
  source: z.string().nullable().optional().default(null),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().nullable().optional().default(null),
  archived_at: z.string().nullable().optional().default(null),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Person = z.infer<typeof personSchema>;

const rawAdminEventSchema = z
  .object({
    id: z.string().uuid(),
    level: z.enum(["info", "warn", "warning", "error"]),
    source: z.string(),
    kind: z.string(),
    message: z.string(),
    context: z.record(z.string(), z.unknown()).default({}),
    lead_id: z.string().uuid().nullable().optional(),
    conversation_id: z.string().uuid().nullable().optional(),
    entity_type: z.string().nullable().optional(),
    entity_id: z.string().nullable().optional(),
    acknowledged_at: z.string().nullable().optional().default(null),
    acknowledged_by: z.string().nullable().optional().default(null),
    created_at: z.string(),
  })
  .passthrough();

/** Normalised event row; the two admin_events shapes in play both map onto it. */
export const adminEventSchema = rawAdminEventSchema.transform((row) => ({
  id: row.id,
  level: (row.level === "warning" ? "warn" : row.level) as "info" | "warn" | "error",
  source: row.source,
  kind: row.kind,
  message: row.message,
  context: row.context,
  lead_id: row.lead_id ?? (row.entity_type === "website_lead" && row.entity_id ? row.entity_id : null),
  conversation_id: row.conversation_id ?? (row.entity_type === "conversation" && row.entity_id ? row.entity_id : null),
  acknowledged_at: row.acknowledged_at,
  acknowledged_by: row.acknowledged_by,
  created_at: row.created_at,
}));
export type AdminEvent = z.infer<typeof adminEventSchema>;

export const attentionRowSchema = z.object({
  kind: z.string(),
  ref_id: z.string().uuid(),
  created_at: z.string(),
  title: z.string(),
  detail: z.string().nullable(),
});
export type AttentionRow = z.infer<typeof attentionRowSchema>;

export const conversationSchema = z.object({
  id: z.string().uuid(),
  provider: z.string(),
  provider_conversation_id: z.string(),
  provider_account_id: z.string(),
  contact_id: z.string().uuid().nullable(),
  state: z.string(),
  last_inbound_at: z.string().nullable(),
  last_processed_at: z.string().nullable(),
  service_window_expires_at: z.string().nullable(),
  created_at: z.string(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const messageSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  direction: z.enum(["incoming", "outgoing"]),
  body: z.string().nullable(),
  attachments: z.array(z.unknown()),
  occurred_at: z.string(),
  processed_at: z.string().nullable(),
});
export type Message = z.infer<typeof messageSchema>;

export const approvalSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  status: z.string(),
  final_reply: z.string().nullable(),
  telegram_notification_status: z.string(),
  telegram_notification_error: z.string().nullable(),
  decided_by: z.string().nullable(),
  decided_at: z.string().nullable(),
  expires_at: z.string(),
  sent_at: z.string().nullable(),
  last_error: z.string().nullable(),
  created_at: z.string(),
  response_run_id: z.string().uuid(),
});
export type Approval = z.infer<typeof approvalSchema>;

export const responseRunSchema = z.object({
  id: z.string().uuid(),
  batch_key: z.string(),
  model: z.string(),
  analysis: z.record(z.string(), z.unknown()),
  proposed_reply: z.string(),
  policy_decision: z.string(),
  policy_reasons: z.array(z.string()),
  created_at: z.string(),
});
export type ResponseRun = z.infer<typeof responseRunSchema>;

export const inquiryRecordSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  status: z.string(),
  source: z.string(),
  primary_intent: z.string().nullable(),
  intents: z.array(z.string()),
  completeness: z.union([z.number(), z.string()]).nullable(),
  latest_analysis: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type InquiryRecord = z.infer<typeof inquiryRecordSchema>;

export const contactSchema = z.object({
  id: z.string().uuid(),
  phone_e164: z.string().nullable(),
  whatsapp_username: z.string().nullable(),
  display_name: z.string().nullable(),
  person_id: z.string().uuid().nullable(),
});
export type Contact = z.infer<typeof contactSchema>;

export const brainDocSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  category: z.string(),
  content: z.string(),
  active: z.boolean(),
  sort_order: z.number().int(),
  version: z.number().int().optional().default(1),
  updated_by: z.string().nullable().optional().default(null),
  updated_at: z.string(),
});
export type BrainDoc = z.infer<typeof brainDocSchema>;

export const replyExampleSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(["past_chat", "override", "manual"]),
  intents: z.array(z.string()),
  customer_message: z.string(),
  situation_summary: z.string().nullable(),
  rejected_draft: z.string().nullable(),
  reply: z.string(),
  source: z.string(),
  active: z.boolean(),
  created_at: z.string(),
});
export type ReplyExample = z.infer<typeof replyExampleSchema>;

export const promptTemplateRowSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  content: z.string(),
  version: z.number().int(),
  active: z.boolean(),
  updated_by: z.string().nullable(),
  updated_at: z.string(),
});
export type PromptTemplateRow = z.infer<typeof promptTemplateRowSchema>;

export const promptVersionSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  version: z.number().int(),
  content: z.string(),
  note: z.string().nullable(),
  saved_by: z.string().nullable(),
  saved_at: z.string(),
});
export type PromptVersion = z.infer<typeof promptVersionSchema>;

export const auditRowSchema = z.object({
  id: z.string().uuid(),
  actor: z.string(),
  table_name: z.string(),
  row_id: z.string(),
  action: z.string(),
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
  note: z.string().nullable(),
  created_at: z.string(),
});
export type AuditRow = z.infer<typeof auditRowSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseRows<T>(schema: z.ZodType<T>, data: unknown, error: { code?: string; message: string } | null): T[] {
  if (error) {
    if (isMissingRelation(error)) return [];
    throw new Error(error.message);
  }
  return z.array(schema).parse(data ?? []);
}

function parseRow<T>(schema: z.ZodType<T>, data: unknown, error: { code?: string; message: string } | null): T | null {
  if (error) {
    if (isMissingRelation(error)) return null;
    throw new Error(error.message);
  }
  return data ? schema.parse(data) : null;
}

/** True when the Phase 2 migration has been applied. */
export async function isAdminSchemaReady(): Promise<boolean> {
  const { error } = await getAdminDb().from("admin_events").select("id").limit(1);
  return !isMissingRelation(error);
}

// ---------------------------------------------------------------------------
// Inquiries
// ---------------------------------------------------------------------------

export interface InquiryFilters {
  channel?: "website" | "whatsapp" | "email";
  status?: string;
  q?: string;
  eventType?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

/**
 * The unified enquiry list, composed from the base tables. It deliberately
 * does not read admin_inquiries_v: a view is easy to get out of step with the
 * code across deploys, and the base tables are stable.
 */
async function loadWebsiteLeadRows(): Promise<InquiryListRow[]> {
  const { data, error } = await getAdminDb()
    .from("inquiry_website_leads")
    .select("id, created_at, updated_at, source, first_name, last_name, email, phone, whatsapp, event_type, event_date_iso, event_date_text, location, guest_count, status, availability, alert_status, person_id, message")
    .order("created_at", { ascending: false })
    .limit(2000);
  const rows = parseRows(
    z.object({
      id: z.string().uuid(),
      created_at: z.string(),
      updated_at: z.string(),
      source: z.string(),
      first_name: z.string(),
      last_name: z.string().nullable(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      whatsapp: z.string().nullable(),
      event_type: z.string().nullable(),
      event_date_iso: z.string().nullable(),
      event_date_text: z.string().nullable(),
      location: z.string().nullable(),
      guest_count: z.number().int().nullable(),
      status: z.string(),
      availability: z.string().nullable(),
      alert_status: z.string().nullable().optional().default(null),
      person_id: z.string().uuid().nullable(),
      message: z.string().nullable(),
    }).passthrough(),
    data,
    error,
  );
  return rows.map((row) => ({
    channel: "website" as const,
    id: row.id,
    created_at: row.created_at,
    last_activity_at: row.updated_at,
    origin: row.source,
    contact_name: [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || null,
    email: row.email,
    phone: row.whatsapp ?? row.phone,
    event_type: row.event_type,
    event_date_iso: row.event_date_iso,
    event_date_text: row.event_date_text,
    location: row.location,
    guest_count: row.guest_count,
    status: row.status,
    availability: row.availability,
    alert_status: row.alert_status,
    person_id: row.person_id,
    conversation_id: null,
    primary_intent: null,
    summary: null,
    preview: row.message ?? "",
  }));
}

async function loadWhatsappRows(): Promise<InquiryListRow[]> {
  const db = getAdminDb();
  const { data, error } = await db
    .from("inquiries")
    .select("id, created_at, updated_at, source, status, primary_intent, latest_analysis, conversation_id, inquiry_conversations!inner(id, last_inbound_at, contact_id, inquiry_contacts(display_name, phone_e164, person_id, inquiry_people(display_name, email, phone_e164)))")
    .order("created_at", { ascending: false })
    .limit(2000);
  const contactShape = z
    .object({
      display_name: z.string().nullable(),
      phone_e164: z.string().nullable(),
      person_id: z.string().uuid().nullable(),
      inquiry_people: z
        .object({ display_name: z.string().nullable(), email: z.string().nullable(), phone_e164: z.string().nullable() })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional();
  const rows = parseRows(
    z.object({
      id: z.string().uuid(),
      created_at: z.string(),
      updated_at: z.string(),
      source: z.string(),
      status: z.string(),
      primary_intent: z.string().nullable(),
      latest_analysis: z.record(z.string(), z.unknown()).nullable(),
      conversation_id: z.string().uuid(),
      inquiry_conversations: z.object({
        id: z.string().uuid(),
        last_inbound_at: z.string().nullable(),
        contact_id: z.string().uuid().nullable(),
        inquiry_contacts: contactShape,
      }),
    }),
    data,
    error,
  );
  return rows.map((row) => {
    const analysis = row.latest_analysis ?? {};
    const event = (analysis.event ?? {}) as Record<string, unknown>;
    const contact = row.inquiry_conversations.inquiry_contacts ?? null;
    const person = contact?.inquiry_people ?? null;
    const text = (value: unknown) => (typeof value === "string" && value.trim() ? value : null);
    const dateIso = text(event.event_date_iso);
    return {
      channel: "whatsapp" as const,
      id: row.id,
      created_at: row.created_at,
      last_activity_at: row.inquiry_conversations.last_inbound_at ?? row.updated_at,
      origin: row.source,
      contact_name: text(event.contact_name) ?? contact?.display_name ?? person?.display_name ?? null,
      email: person?.email ?? null,
      phone: contact?.phone_e164 ?? person?.phone_e164 ?? null,
      event_type: text(event.event_type),
      event_date_iso: dateIso && /^\d{4}-\d{2}-\d{2}$/.test(dateIso) ? dateIso : null,
      event_date_text: text(event.event_date_text),
      location: text(event.venue) ?? text(event.location),
      guest_count: typeof event.guest_count === "number" ? event.guest_count : null,
      status: row.status,
      availability: null,
      alert_status: null,
      person_id: contact?.person_id ?? null,
      conversation_id: row.conversation_id,
      primary_intent: row.primary_intent,
      summary: text(analysis.summary),
      preview: text(analysis.summary) ?? "",
    };
  });
}

async function loadEmailRows(): Promise<InquiryListRow[]> {
  const { data, error } = await getAdminDb()
    .from("inquiry_email_threads")
    .select("id, created_at, updated_at, last_message_at, subject, from_email, from_name, event_type, event_date_text, location, status, telegram_message_id, alert_error, person_id, summary")
    .eq("classification", "inquiry")
    .order("created_at", { ascending: false })
    .limit(2000);
  const rows = parseRows(
    z.object({
      id: z.string().uuid(),
      created_at: z.string(),
      updated_at: z.string(),
      last_message_at: z.string().nullable(),
      subject: z.string().nullable(),
      from_email: z.string().nullable(),
      from_name: z.string().nullable(),
      event_type: z.string().nullable(),
      event_date_text: z.string().nullable(),
      location: z.string().nullable(),
      status: z.string(),
      telegram_message_id: z.union([z.number(), z.string()]).nullable(),
      alert_error: z.string().nullable(),
      person_id: z.string().uuid().nullable(),
      summary: z.string().nullable(),
    }),
    data,
    error,
  );
  return rows.map((row) => ({
    channel: "email" as const,
    id: row.id,
    created_at: row.created_at,
    last_activity_at: row.last_message_at ?? row.updated_at,
    origin: "gmail",
    contact_name: row.from_name ?? row.from_email,
    email: row.from_email,
    phone: null,
    event_type: row.event_type,
    event_date_iso: null,
    event_date_text: row.event_date_text,
    location: row.location,
    guest_count: null,
    status: row.status,
    availability: null,
    alert_status: row.telegram_message_id ? "sent" : row.alert_error ? "failed" : null,
    person_id: row.person_id,
    conversation_id: null,
    primary_intent: null,
    summary: row.summary,
    preview: row.subject ?? "",
  }));
}

async function loadAllInquiries(channel?: InquiryFilters["channel"]): Promise<InquiryListRow[]> {
  const loaders: Array<() => Promise<InquiryListRow[]>> = [];
  if (!channel || channel === "website") loaders.push(loadWebsiteLeadRows);
  if (!channel || channel === "whatsapp") loaders.push(loadWhatsappRows);
  if (!channel || channel === "email") loaders.push(loadEmailRows);
  const groups = await Promise.all(loaders.map((load) => load()));
  return groups.flat().sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export async function listInquiries(filters: InquiryFilters = {}): Promise<InquiryListRow[]> {
  let rows = await loadAllInquiries(filters.channel);
  if (filters.status) rows = rows.filter((row) => row.status === filters.status);
  if (filters.eventType) {
    const needle = filters.eventType.toLowerCase();
    rows = rows.filter((row) => row.event_type?.toLowerCase().includes(needle));
  }
  if (filters.from) rows = rows.filter((row) => row.created_at >= filters.from!);
  if (filters.to) rows = rows.filter((row) => row.created_at <= filters.to!);
  if (filters.q) {
    const needle = filters.q.toLowerCase();
    rows = rows.filter((row) =>
      [row.contact_name, row.email, row.phone, row.location, row.preview, row.event_type]
        .some((value) => value?.toLowerCase().includes(needle)),
    );
  }
  const offset = filters.offset ?? 0;
  return rows.slice(offset, offset + (filters.limit ?? 50));
}

export async function countInquiriesSince(sinceIso: string, channel?: InquiryFilters["channel"]): Promise<number> {
  const rows = await loadAllInquiries(channel);
  return rows.filter((row) => row.created_at >= sinceIso).length;
}

export async function getWebsiteLead(id: string): Promise<WebsiteLead | null> {
  const { data, error } = await getAdminDb()
    .from("inquiry_website_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return parseRow(websiteLeadSchema, data, error);
}

export async function listWebsiteLeadsForPerson(personId: string): Promise<WebsiteLead[]> {
  const { data, error } = await getAdminDb()
    .from("inquiry_website_leads")
    .select("*")
    .eq("person_id", personId)
    .order("created_at", { ascending: false });
  return parseRows(websiteLeadSchema, data, error);
}

export async function getInquiryRecord(id: string): Promise<InquiryRecord | null> {
  const { data, error } = await getAdminDb().from("inquiries").select("*").eq("id", id).maybeSingle();
  return parseRow(inquiryRecordSchema, data, error);
}

export async function getInquiryByConversation(conversationId: string): Promise<InquiryRecord | null> {
  const { data, error } = await getAdminDb()
    .from("inquiries")
    .select("*")
    .eq("conversation_id", conversationId)
    .maybeSingle();
  return parseRow(inquiryRecordSchema, data, error);
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await getAdminDb()
    .from("inquiry_conversations")
    .select("id, provider, provider_conversation_id, provider_account_id, contact_id, state, last_inbound_at, last_processed_at, service_window_expires_at, created_at")
    .eq("id", id)
    .maybeSingle();
  return parseRow(conversationSchema, data, error);
}

export async function listConversationsForContact(contactId: string): Promise<Conversation[]> {
  const { data, error } = await getAdminDb()
    .from("inquiry_conversations")
    .select("id, provider, provider_conversation_id, provider_account_id, contact_id, state, last_inbound_at, last_processed_at, service_window_expires_at, created_at")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });
  return parseRows(conversationSchema, data, error);
}

export async function listMessages(conversationId: string, limit = 200): Promise<Message[]> {
  const { data, error } = await getAdminDb()
    .from("inquiry_messages")
    .select("id, conversation_id, direction, body, attachments, occurred_at, processed_at")
    .eq("conversation_id", conversationId)
    .order("occurred_at", { ascending: true })
    .limit(limit);
  return parseRows(messageSchema, data, error);
}

export async function listApprovals(conversationId: string): Promise<Approval[]> {
  const { data, error } = await getAdminDb()
    .from("inquiry_approval_requests")
    .select("id, conversation_id, status, final_reply, telegram_notification_status, telegram_notification_error, decided_by, decided_at, expires_at, sent_at, last_error, created_at, response_run_id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });
  return parseRows(approvalSchema, data, error);
}

export async function listResponseRuns(conversationId: string): Promise<ResponseRun[]> {
  const { data, error } = await getAdminDb()
    .from("inquiry_response_runs")
    .select("id, batch_key, model, analysis, proposed_reply, policy_decision, policy_reasons, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });
  return parseRows(responseRunSchema, data, error);
}

export async function getContact(id: string): Promise<Contact | null> {
  const { data, error } = await getAdminDb()
    .from("inquiry_contacts")
    .select("id, phone_e164, whatsapp_username, display_name, person_id")
    .eq("id", id)
    .maybeSingle();
  return parseRow(contactSchema, data, error);
}

export async function listContactsForPerson(personId: string): Promise<Contact[]> {
  const { data, error } = await getAdminDb()
    .from("inquiry_contacts")
    .select("id, phone_e164, whatsapp_username, display_name, person_id")
    .eq("person_id", personId);
  return parseRows(contactSchema, data, error);
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

export const emailThreadSchema = z.object({
  id: z.string().uuid(),
  gmail_thread_id: z.string(),
  subject: z.string().nullable(),
  from_email: z.string().nullable(),
  from_name: z.string().nullable(),
  person_id: z.string().uuid().nullable(),
  classification: z.enum(["inquiry", "not_inquiry", "unknown"]),
  summary: z.string().nullable(),
  event_type: z.string().nullable(),
  event_date_text: z.string().nullable(),
  location: z.string().nullable(),
  status: z.string(),
  telegram_message_id: z.union([z.number(), z.string()]).nullable(),
  alert_error: z.string().nullable(),
  first_message_at: z.string().nullable(),
  last_message_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type EmailThread = z.infer<typeof emailThreadSchema>;

export const emailMessageSchema = z.object({
  id: z.string().uuid(),
  direction: z.enum(["incoming", "outgoing"]),
  from_email: z.string().nullable(),
  from_name: z.string().nullable(),
  to_email: z.string().nullable(),
  subject: z.string().nullable(),
  body_text: z.string().nullable(),
  received_at: z.string(),
});
export type EmailMessage = z.infer<typeof emailMessageSchema>;

export async function getEmailThread(id: string): Promise<EmailThread | null> {
  const { data, error } = await getAdminDb().from("inquiry_email_threads").select("*").eq("id", id).maybeSingle();
  return parseRow(emailThreadSchema, data, error);
}

export async function listEmailMessages(threadId: string): Promise<EmailMessage[]> {
  const { data, error } = await getAdminDb()
    .from("inquiry_email_messages")
    .select("id, direction, from_email, from_name, to_email, subject, body_text, received_at")
    .eq("thread_id", threadId)
    .order("received_at", { ascending: true });
  return parseRows(emailMessageSchema, data, error);
}

export async function listEmailThreadsForPerson(personId: string): Promise<EmailThread[]> {
  const { data, error } = await getAdminDb()
    .from("inquiry_email_threads")
    .select("*")
    .eq("person_id", personId)
    .order("last_message_at", { ascending: false });
  return parseRows(emailThreadSchema, data, error);
}

export async function getEmailSyncState(): Promise<{ last_synced_at: string | null; last_error: string | null } | null> {
  const { data, error } = await getAdminDb().from("email_sync_state").select("last_synced_at, last_error").eq("id", 1).maybeSingle();
  return parseRow(z.object({ last_synced_at: z.string().nullable(), last_error: z.string().nullable() }), data, error);
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export interface PeopleFilters {
  q?: string;
  stage?: string;
  includeArchived?: boolean;
  limit?: number;
}

export async function listPeople(filters: PeopleFilters = {}): Promise<Person[]> {
  let query = getAdminDb()
    .from("inquiry_people")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(filters.limit ?? 100);
  if (!filters.includeArchived) query = query.is("archived_at", null);
  if (filters.stage) query = query.eq("stage", filters.stage);
  if (filters.q) {
    const term = `%${filters.q.replace(/[%_]/g, "")}%`;
    query = query.or(`display_name.ilike.${term},email.ilike.${term},phone_e164.ilike.${term}`);
  }
  const { data, error } = await query;
  return parseRows(personSchema, data, error);
}

export async function getPerson(id: string): Promise<Person | null> {
  const { data, error } = await getAdminDb().from("inquiry_people").select("*").eq("id", id).maybeSingle();
  return parseRow(personSchema, data, error);
}

export async function countPeopleByStage(): Promise<Record<string, number>> {
  const { data, error } = await getAdminDb()
    .from("inquiry_people")
    .select("stage")
    .is("archived_at", null);
  const rows = parseRows(z.object({ stage: z.string().optional().default("new") }), data, error);
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.stage] = (counts[row.stage] ?? 0) + 1;
  return counts;
}

// ---------------------------------------------------------------------------
// Console
// ---------------------------------------------------------------------------

export interface EventFilters {
  level?: "info" | "warn" | "error";
  source?: string;
  open?: boolean;
  limit?: number;
}

export async function listAdminEvents(filters: EventFilters = {}): Promise<AdminEvent[]> {
  let query = getAdminDb()
    .from("admin_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 100);
  if (filters.level) query = query.in("level", filters.level === "warn" ? ["warn", "warning"] : [filters.level]);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.open) query = query.is("acknowledged_at", null);
  const { data, error } = await query;
  return parseRows(adminEventSchema, data, error);
}

export async function listEventsForLead(leadId: string): Promise<AdminEvent[]> {
  const events = await listAdminEvents({ limit: 500 });
  return events.filter((event) => event.lead_id === leadId).slice(0, 50);
}

export async function listEventsForConversation(conversationId: string): Promise<AdminEvent[]> {
  const events = await listAdminEvents({ limit: 500 });
  return events.filter((event) => event.conversation_id === conversationId).slice(0, 50);
}

export async function countOpenErrors(): Promise<number> {
  const { count, error } = await getAdminDb()
    .from("admin_events")
    .select("id", { count: "exact", head: true })
    .eq("level", "error")
    .is("acknowledged_at", null);
  if (error) {
    if (isMissingRelation(error)) return 0;
    throw new Error(error.message);
  }
  return count ?? 0;
}

export async function listNeedsAttention(limit = 50): Promise<AttentionRow[]> {
  const db = getAdminDb();
  const twelveHoursAgo = new Date(Date.now() - 12 * 3_600_000).toISOString();
  const [failedAlerts, pendingApprovals, uncertainSends, failedOutbox, staleDrafts, openErrors] = await Promise.all([
    db.from("inquiry_website_leads").select("id, created_at, first_name, alert_attempts, alert_error").eq("alert_status", "failed").limit(limit),
    db.from("inquiry_approval_requests").select("id, created_at, final_reply").eq("status", "pending").lt("created_at", twelveHoursAgo).limit(limit),
    db.from("inquiry_approval_requests").select("id, updated_at, last_error").eq("status", "send_uncertain").limit(limit),
    db.from("inquiry_outbox_events").select("id, created_at, event_type, last_error").eq("status", "failed").limit(limit),
    db.from("inquiry_website_leads").select("id, updated_at, first_name, final_reply, draft_reply").eq("status", "draft_ready").lt("updated_at", twelveHoursAgo).limit(limit),
    listAdminEvents({ level: "error", open: true, limit }),
  ]);

  const rows: AttentionRow[] = [];
  const take = <T,>(result: { data: unknown; error: { code?: string; message: string } | null }, schema: z.ZodType<T>): T[] =>
    parseRows(schema, result.data, result.error);

  for (const lead of take(failedAlerts, z.object({ id: z.string().uuid(), created_at: z.string(), first_name: z.string(), alert_attempts: z.number().nullable().optional(), alert_error: z.string().nullable().optional() }))) {
    rows.push({ kind: "lead_alert_failed", ref_id: lead.id, created_at: lead.created_at, title: `Telegram alert failed for ${lead.first_name} (${lead.alert_attempts ?? 0} attempts)`, detail: lead.alert_error ?? null });
  }
  for (const approval of take(pendingApprovals, z.object({ id: z.string().uuid(), created_at: z.string(), final_reply: z.string().nullable() }))) {
    rows.push({ kind: "approval_pending", ref_id: approval.id, created_at: approval.created_at, title: "WhatsApp reply waiting for approval", detail: approval.final_reply?.slice(0, 200) ?? null });
  }
  for (const approval of take(uncertainSends, z.object({ id: z.string().uuid(), updated_at: z.string(), last_error: z.string().nullable() }))) {
    rows.push({ kind: "send_uncertain", ref_id: approval.id, created_at: approval.updated_at, title: "WhatsApp send outcome uncertain", detail: approval.last_error });
  }
  for (const event of take(failedOutbox, z.object({ id: z.string().uuid(), created_at: z.string(), event_type: z.string(), last_error: z.string().nullable() }))) {
    rows.push({ kind: "outbox_failed", ref_id: event.id, created_at: event.created_at, title: `Outbox event failed: ${event.event_type}`, detail: event.last_error });
  }
  for (const lead of take(staleDrafts, z.object({ id: z.string().uuid(), updated_at: z.string(), first_name: z.string(), final_reply: z.string().nullable(), draft_reply: z.string().nullable() }))) {
    rows.push({ kind: "lead_draft_ready", ref_id: lead.id, created_at: lead.updated_at, title: `Draft ready for ${lead.first_name}, waiting for approval`, detail: (lead.final_reply ?? lead.draft_reply ?? "").slice(0, 200) || null });
  }
  for (const event of openErrors) {
    rows.push({ kind: "event_error", ref_id: event.id, created_at: event.created_at, title: event.message, detail: event.kind });
  }

  return rows.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function listBrainDocs(): Promise<BrainDoc[]> {
  const { data, error } = await getAdminDb()
    .from("inquiry_brain_docs")
    .select("id, slug, title, category, content, active, sort_order, version, updated_by, updated_at")
    .order("sort_order", { ascending: true });
  return parseRows(brainDocSchema, data, error);
}

export async function getBrainDoc(slug: string): Promise<BrainDoc | null> {
  const { data, error } = await getAdminDb()
    .from("inquiry_brain_docs")
    .select("id, slug, title, category, content, active, sort_order, version, updated_by, updated_at")
    .eq("slug", slug)
    .maybeSingle();
  return parseRow(brainDocSchema, data, error);
}

export async function listBrainDocVersions(slug: string): Promise<
  Array<{ version: number; title: string; content: string; saved_by: string | null; saved_at: string }>
> {
  const { data, error } = await getAdminDb()
    .from("inquiry_brain_doc_versions")
    .select("version, title, content, saved_by, saved_at")
    .eq("slug", slug)
    .order("version", { ascending: false })
    .limit(20);
  return parseRows(
    z.object({
      version: z.number().int(),
      title: z.string(),
      content: z.string(),
      saved_by: z.string().nullable(),
      saved_at: z.string(),
    }),
    data,
    error,
  );
}

export async function listReplyExamples(options: { includeInactive?: boolean; limit?: number } = {}): Promise<ReplyExample[]> {
  let query = getAdminDb()
    .from("inquiry_reply_examples")
    .select("id, kind, intents, customer_message, situation_summary, rejected_draft, reply, source, active, created_at")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 200);
  if (!options.includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  return parseRows(replyExampleSchema, data, error);
}

export async function getReplyExample(id: string): Promise<ReplyExample | null> {
  const { data, error } = await getAdminDb()
    .from("inquiry_reply_examples")
    .select("id, kind, intents, customer_message, situation_summary, rejected_draft, reply, source, active, created_at")
    .eq("id", id)
    .maybeSingle();
  return parseRow(replyExampleSchema, data, error);
}

export async function listPromptTemplateRows(): Promise<PromptTemplateRow[]> {
  const { data, error } = await getAdminDb().from("inquiry_prompt_templates").select("*");
  return parseRows(promptTemplateRowSchema, data, error);
}

export async function getPromptTemplateRow(slug: string): Promise<PromptTemplateRow | null> {
  const { data, error } = await getAdminDb()
    .from("inquiry_prompt_templates")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return parseRow(promptTemplateRowSchema, data, error);
}

export async function listPromptVersions(slug: string): Promise<PromptVersion[]> {
  const { data, error } = await getAdminDb()
    .from("inquiry_prompt_template_versions")
    .select("*")
    .eq("slug", slug)
    .order("version", { ascending: false })
    .limit(30);
  return parseRows(promptVersionSchema, data, error);
}

export async function listAuditForRow(table: string, rowId: string): Promise<AuditRow[]> {
  const { data, error } = await getAdminDb()
    .from("admin_audit_log")
    .select("*")
    .eq("table_name", table)
    .eq("row_id", rowId)
    .order("created_at", { ascending: false })
    .limit(30);
  return parseRows(auditRowSchema, data, error);
}

export async function listRecentAudit(limit = 50): Promise<AuditRow[]> {
  const { data, error } = await getAdminDb()
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return parseRows(auditRowSchema, data, error);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardStats {
  inquiries7d: number;
  inquiries30d: number;
  website30d: number;
  whatsapp30d: number;
  openErrors: number;
  byEventType: Array<{ label: string; count: number }>;
  byStage: Record<string, number>;
  medianAlertSeconds: number | null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = Date.now();
  const d7 = new Date(now - 7 * 86_400_000).toISOString();
  const d30 = new Date(now - 30 * 86_400_000).toISOString();

  const [inquiries7d, inquiries30d, website30d, whatsapp30d, openErrors, byStage, recent] =
    await Promise.all([
      countInquiriesSince(d7),
      countInquiriesSince(d30),
      countInquiriesSince(d30, "website"),
      countInquiriesSince(d30, "whatsapp"),
      countOpenErrors(),
      countPeopleByStage(),
      listInquiries({ from: d30, limit: 500 }),
    ]);

  const typeCounts = new Map<string, number>();
  for (const row of recent) {
    const label = row.event_type?.trim() || "Unspecified";
    typeCounts.set(label, (typeCounts.get(label) ?? 0) + 1);
  }
  const byEventType = [...typeCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const { data: alertRows } = await getAdminDb()
    .from("inquiry_website_leads")
    .select("created_at, alert_sent_at")
    .gte("created_at", d30)
    .not("alert_sent_at", "is", null)
    .limit(500);
  const seconds = (alertRows ?? [])
    .map((row) => {
      const created = Date.parse(String(row.created_at));
      const sent = Date.parse(String(row.alert_sent_at));
      return Number.isFinite(created) && Number.isFinite(sent) ? (sent - created) / 1000 : null;
    })
    .filter((value): value is number => value !== null && value >= 0)
    .sort((a, b) => a - b);
  const medianAlertSeconds = seconds.length ? seconds[Math.floor(seconds.length / 2)] : null;

  return { inquiries7d, inquiries30d, website30d, whatsapp30d, openErrors, byEventType, byStage, medianAlertSeconds };
}
