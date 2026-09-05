/**
 * Typed read queries for the admin. Everything goes through the secret-key
 * client; nothing here is reachable from the browser. Row shapes mirror the
 * database (snake_case) so the pages read like the tables they show.
 */
import { TEMPLATE_DEFINITIONS } from "@/lib/admin/templates";
import { getSupabaseAdmin } from "@/lib/inquiries/supabase";

// ---------------------------------------------------------------------------
// Shared row types
// ---------------------------------------------------------------------------

export type Channel = "website" | "whatsapp";

export interface InquiryRow {
  id: string;
  channel: Channel;
  source: string;
  conversation_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_digits: string | null;
  event_type: string | null;
  event_date_text: string | null;
  event_date_iso: string | null;
  location: string | null;
  status: string;
  alert_status: string | null;
  availability: string | null;
  person_id: string | null;
  stage: string | null;
  summary: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
  needs_attention: boolean;
}

export interface WebsiteLeadRow {
  id: string;
  source: "lead_form" | "contact_form";
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  whatsapp_digits: string | null;
  phone_e164: string | null;
  person_id: string | null;
  contact_preference: string | null;
  event_type: string | null;
  event_date_text: string | null;
  event_date_iso: string | null;
  date_flexible: boolean | null;
  location: string | null;
  guest_count: number | null;
  performance_minutes: number | null;
  booker_role: string | null;
  message: string | null;
  notes: string | null;
  payload: Record<string, unknown>;
  status: string;
  availability: string | null;
  draft_reply: string | null;
  final_reply: string | null;
  model: string | null;
  telegram_chat_id: number | null;
  telegram_message_id: number | null;
  review_telegram_message_id: number | null;
  review_notification_status: string;
  review_notification_error: string | null;
  decided_by: string | null;
  decided_at: string | null;
  expires_at: string;
  last_error: string | null;
  alert_status: string;
  alert_error: string | null;
  alert_attempts: number;
  alert_sent_at: string | null;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonRow {
  id: string;
  phone_e164: string | null;
  display_name: string | null;
  email: string | null;
  stage: string;
  source: string | null;
  tags: string[];
  notes: string | null;
  archived_at: string | null;
  updated_by: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactRow {
  id: string;
  provider: string;
  provider_identity: string;
  phone_e164: string | null;
  whatsapp_username: string | null;
  display_name: string | null;
  person_id: string | null;
  created_at: string;
}

export interface ConversationRow {
  id: string;
  provider_conversation_id: string;
  provider_account_id: string;
  contact_id: string | null;
  state: string;
  last_inbound_at: string | null;
  last_processed_at: string | null;
  service_window_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  direction: "incoming" | "outgoing";
  body: string | null;
  attachments: Array<{ type?: string; url?: string }>;
  occurred_at: string;
  processed_at: string | null;
}

export interface InquiryAnalysisRow {
  id: string;
  status: string;
  source: string;
  primary_intent: string | null;
  intents: string[];
  completeness: number | null;
  latest_analysis: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRow {
  id: string;
  status: string;
  final_reply: string | null;
  telegram_message_id: number | null;
  telegram_notification_status: string;
  telegram_notification_error: string | null;
  decided_by: string | null;
  decided_at: string | null;
  expires_at: string;
  send_attempts: number;
  sent_at: string | null;
  last_error: string | null;
  created_at: string;
  response_run: { proposed_reply: string; analysis: Record<string, unknown>; model: string; created_at: string } | null;
}

export interface ClientProfileRow {
  id: string;
  contact_id: string;
  display_name: string | null;
  role: string | null;
  event_type: string | null;
  event_date_text: string | null;
  venue: string | null;
  location: string | null;
  guest_count: number | null;
  duration_minutes: number | null;
  budget_text: string | null;
  quoted_amount_text: string | null;
  deposit_status: string;
  booking_stage: string;
  preferences: string[];
  notes: string | null;
  updated_at: string;
}

export interface SuggestChangeRow {
  id: string;
  status: string;
  revision: number;
  instructions: string | null;
  source_draft: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminEventRow {
  id: string;
  level: "info" | "warning" | "error";
  source: string;
  kind: string;
  message: string;
  context: Record<string, unknown>;
  entity_type: string | null;
  entity_id: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
}

export interface AttentionRow {
  kind: string;
  entity_type: string;
  entity_id: string;
  title: string;
  detail: string | null;
  at: string;
}

export interface AuditRow {
  id: string;
  actor: string;
  table_name: string;
  row_id: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  note: string | null;
  created_at: string;
}

export interface BrainDocRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  content: string;
  active: boolean;
  sort_order: number;
  version: number;
  updated_by: string | null;
  updated_at: string;
}

export interface BrainDocVersionRow {
  id: string;
  version: number;
  title: string;
  category: string;
  content: string;
  active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ReplyExampleRow {
  id: string;
  kind: string;
  intents: string[];
  customer_message: string;
  situation_summary: string | null;
  rejected_draft: string | null;
  reply: string;
  source: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateOverrideRow {
  slug: string;
  kind: string;
  content: string;
  version: number;
  active: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface TemplateVersionRow {
  id: string;
  version: number;
  content: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface HealthStateRow {
  check: string;
  ok: boolean;
  since: string;
  last_checked_at: string;
  last_latency_ms: number | null;
  last_detail: Record<string, unknown>;
}

export interface HealthSampleRow {
  check: string;
  ok: boolean;
  latency_ms: number | null;
  created_at: string;
}

function fail(action: string, error: { message: string } | null): never {
  throw new Error(`${action}: ${error?.message ?? "unknown error"}`);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardStats {
  byChannel: Array<{ channel: Channel; last_7: number; last_30: number; last_90: number }>;
  byEventType: Array<{ event_type: string; total: number }>;
  bySource: Array<{ source: string; total: number }>;
  stages: Array<{ stage: string; total: number }>;
  medianResponseMinutes: number | null;
  monthly: Array<{ month: string; channel: Channel; total: number }>;
  needsAttention: number;
  pendingApprovals: number;
  openLeads: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await getSupabaseAdmin().rpc("admin_dashboard_stats");
  if (error) fail("Dashboard stats", error);
  return data as DashboardStats;
}

export async function getNeedsAttentionCount(): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from("admin_needs_attention_v")
    .select("kind", { head: true, count: "exact" });
  if (error) fail("Needs-attention count", error);
  return count ?? 0;
}

export async function listNeedsAttention(limit = 50): Promise<AttentionRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("admin_needs_attention_v")
    .select("*")
    .order("at", { ascending: false })
    .limit(limit);
  if (error) fail("Needs-attention list", error);
  return (data ?? []) as AttentionRow[];
}

// ---------------------------------------------------------------------------
// Enquiries
// ---------------------------------------------------------------------------

export interface InquiryFilters {
  channel?: Channel | "";
  status?: string;
  stage?: string;
  eventType?: string;
  q?: string;
  attention?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function listInquiries(filters: InquiryFilters = {}): Promise<{ rows: InquiryRow[]; total: number; page: number; pageSize: number }> {
  const pageSize = Math.min(Math.max(filters.pageSize ?? 50, 10), 200);
  const page = Math.max(filters.page ?? 1, 1);
  const from = (page - 1) * pageSize;

  let query = getSupabaseAdmin()
    .from("admin_inquiries_v")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (filters.channel) query = query.eq("channel", filters.channel);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.stage) query = query.eq("stage", filters.stage);
  if (filters.eventType) query = query.ilike("event_type", `%${filters.eventType}%`);
  if (filters.attention) query = query.eq("needs_attention", true);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);
  if (filters.q) {
    const term = filters.q.replace(/[%,()]/g, " ").trim();
    if (term) {
      query = query.or(
        `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%,location.ilike.%${term}%,summary.ilike.%${term}%`,
      );
    }
  }

  const { data, error, count } = await query;
  if (error) fail("Enquiries list", error);
  return { rows: (data ?? []) as InquiryRow[], total: count ?? 0, page, pageSize };
}

export async function getInquiryRow(id: string): Promise<InquiryRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("admin_inquiries_v")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) fail("Enquiry lookup", error);
  return (data as InquiryRow | null) ?? null;
}

export async function getWebsiteLead(id: string): Promise<WebsiteLeadRow | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_website_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) fail("Website lead", error);
  return (data as WebsiteLeadRow | null) ?? null;
}

export async function listSuggestChangesForLead(leadId: string): Promise<SuggestChangeRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_suggest_change_requests")
    .select("id, status, revision, instructions, source_draft, created_at, updated_at")
    .eq("website_lead_id", leadId)
    .order("created_at", { ascending: true });
  if (error) fail("Suggest-change history", error);
  return (data ?? []) as SuggestChangeRow[];
}

export async function listSuggestChangesForApprovals(approvalIds: string[]): Promise<SuggestChangeRow[]> {
  if (approvalIds.length === 0) return [];
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_suggest_change_requests")
    .select("id, status, revision, instructions, source_draft, created_at, updated_at")
    .in("approval_id", approvalIds)
    .order("created_at", { ascending: true });
  if (error) fail("Suggest-change history", error);
  return (data ?? []) as SuggestChangeRow[];
}

export interface SessionStep {
  kind: "view" | "event";
  path?: string | null;
  name?: string;
  referrer?: string | null;
  at: string;
}

export async function getSessionPath(sessionId: string | null): Promise<SessionStep[]> {
  if (!sessionId) return [];
  const { data, error } = await getSupabaseAdmin().rpc("admin_session_path", { p_session_id: sessionId });
  if (error) fail("Session path", error);
  return (data ?? []) as SessionStep[];
}

// ---------------------------------------------------------------------------
// Conversations (WhatsApp)
// ---------------------------------------------------------------------------

export interface ConversationBundle {
  conversation: ConversationRow;
  contact: ContactRow | null;
  person: PersonRow | null;
  inquiry: InquiryAnalysisRow | null;
  profile: ClientProfileRow | null;
  messages: MessageRow[];
  approvals: ApprovalRow[];
  suggestChanges: SuggestChangeRow[];
  availabilityChecks: Array<{ id: string; status: string; event_date_text: string | null; availability: string | null; answered_at: string | null; created_at: string }>;
}

export async function getConversationBundle(conversationId: string): Promise<ConversationBundle | null> {
  const supabase = getSupabaseAdmin();
  const { data: conversation, error } = await supabase
    .from("inquiry_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) fail("Conversation", error);
  if (!conversation) return null;

  const [contactRes, inquiryRes, messagesRes, approvalsRes, checksRes] = await Promise.all([
    conversation.contact_id
      ? supabase.from("inquiry_contacts").select("*").eq("id", conversation.contact_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("inquiries").select("*").eq("conversation_id", conversationId).maybeSingle(),
    supabase
      .from("inquiry_messages")
      .select("id, direction, body, attachments, occurred_at, processed_at")
      .eq("conversation_id", conversationId)
      .order("occurred_at", { ascending: true })
      .limit(500),
    supabase
      .from("inquiry_approval_requests")
      .select(
        "id, status, final_reply, telegram_message_id, telegram_notification_status, telegram_notification_error, decided_by, decided_at, expires_at, send_attempts, sent_at, last_error, created_at, response_run:inquiry_response_runs(proposed_reply, analysis, model, created_at)",
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("inquiry_availability_checks")
      .select("id, status, event_date_text, availability, answered_at, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  ]);

  if (contactRes.error) fail("Contact", contactRes.error);
  if (inquiryRes.error) fail("Inquiry", inquiryRes.error);
  if (messagesRes.error) fail("Messages", messagesRes.error);
  if (approvalsRes.error) fail("Approvals", approvalsRes.error);
  if (checksRes.error) fail("Availability checks", checksRes.error);

  const contact = (contactRes.data as ContactRow | null) ?? null;
  const [personRes, profileRes] = await Promise.all([
    contact?.person_id
      ? supabase.from("inquiry_people").select("*").eq("id", contact.person_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    contact
      ? supabase.from("inquiry_client_profiles").select("*").eq("contact_id", contact.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (personRes.error) fail("Person", personRes.error);
  if (profileRes.error) fail("Client profile", profileRes.error);

  const approvals = ((approvalsRes.data ?? []) as Array<Omit<ApprovalRow, "response_run"> & { response_run: ApprovalRow["response_run"] | ApprovalRow["response_run"][] }>).map(
    (row) => ({
      ...row,
      response_run: Array.isArray(row.response_run) ? (row.response_run[0] ?? null) : row.response_run,
    }),
  ) as ApprovalRow[];

  const suggestChanges = await listSuggestChangesForApprovals(approvals.map((approval) => approval.id));

  return {
    conversation: conversation as ConversationRow,
    contact,
    person: (personRes.data as PersonRow | null) ?? null,
    inquiry: (inquiryRes.data as InquiryAnalysisRow | null) ?? null,
    profile: (profileRes.data as ClientProfileRow | null) ?? null,
    messages: (messagesRes.data ?? []) as MessageRow[],
    approvals,
    suggestChanges,
    availabilityChecks: (checksRes.data ?? []) as ConversationBundle["availabilityChecks"],
  };
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export interface PersonFilters {
  q?: string;
  stage?: string;
  archived?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PersonListRow extends PersonRow {
  lead_count: number;
  conversation_count: number;
}

export async function listPeople(filters: PersonFilters = {}): Promise<{ rows: PersonListRow[]; total: number; page: number; pageSize: number }> {
  const pageSize = Math.min(Math.max(filters.pageSize ?? 50, 10), 200);
  const page = Math.max(filters.page ?? 1, 1);
  const from = (page - 1) * pageSize;
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("inquiry_people")
    .select("*", { count: "exact" })
    .order("last_activity_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (filters.archived) query = query.not("archived_at", "is", null);
  else query = query.is("archived_at", null);
  if (filters.stage) query = query.eq("stage", filters.stage);
  if (filters.q) {
    const term = filters.q.replace(/[%,()]/g, " ").trim();
    if (term) query = query.or(`display_name.ilike.%${term}%,email.ilike.%${term}%,phone_e164.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) fail("People list", error);
  const people = (data ?? []) as PersonRow[];
  if (people.length === 0) return { rows: [], total: count ?? 0, page, pageSize };

  const ids = people.map((person) => person.id);
  const [leadsRes, contactsRes] = await Promise.all([
    supabase.from("inquiry_website_leads").select("person_id").in("person_id", ids),
    supabase.from("inquiry_contacts").select("person_id").in("person_id", ids),
  ]);
  if (leadsRes.error) fail("Lead counts", leadsRes.error);
  if (contactsRes.error) fail("Contact counts", contactsRes.error);

  const leadCounts = new Map<string, number>();
  for (const row of (leadsRes.data ?? []) as Array<{ person_id: string }>) {
    leadCounts.set(row.person_id, (leadCounts.get(row.person_id) ?? 0) + 1);
  }
  const contactCounts = new Map<string, number>();
  for (const row of (contactsRes.data ?? []) as Array<{ person_id: string }>) {
    contactCounts.set(row.person_id, (contactCounts.get(row.person_id) ?? 0) + 1);
  }

  return {
    rows: people.map((person) => ({
      ...person,
      lead_count: leadCounts.get(person.id) ?? 0,
      conversation_count: contactCounts.get(person.id) ?? 0,
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export interface PersonBundle {
  person: PersonRow;
  leads: WebsiteLeadRow[];
  contacts: Array<ContactRow & { conversations: ConversationRow[]; profile: ClientProfileRow | null }>;
  audit: AuditRow[];
}

export async function getPersonBundle(id: string): Promise<PersonBundle | null> {
  const supabase = getSupabaseAdmin();
  const { data: person, error } = await supabase.from("inquiry_people").select("*").eq("id", id).maybeSingle();
  if (error) fail("Person", error);
  if (!person) return null;

  const [leadsRes, contactsRes, auditRes] = await Promise.all([
    supabase.from("inquiry_website_leads").select("*").eq("person_id", id).order("created_at", { ascending: false }),
    supabase.from("inquiry_contacts").select("*").eq("person_id", id).order("created_at", { ascending: false }),
    supabase
      .from("admin_audit_log")
      .select("*")
      .eq("table_name", "inquiry_people")
      .eq("row_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (leadsRes.error) fail("Person leads", leadsRes.error);
  if (contactsRes.error) fail("Person contacts", contactsRes.error);
  if (auditRes.error) fail("Person audit", auditRes.error);

  const contacts = (contactsRes.data ?? []) as ContactRow[];
  const contactIds = contacts.map((contact) => contact.id);
  const [conversationsRes, profilesRes] = contactIds.length
    ? await Promise.all([
        supabase.from("inquiry_conversations").select("*").in("contact_id", contactIds).order("updated_at", { ascending: false }),
        supabase.from("inquiry_client_profiles").select("*").in("contact_id", contactIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (conversationsRes.error) fail("Person conversations", conversationsRes.error);
  if (profilesRes.error) fail("Person profiles", profilesRes.error);

  const conversations = (conversationsRes.data ?? []) as ConversationRow[];
  const profiles = (profilesRes.data ?? []) as ClientProfileRow[];

  return {
    person: person as PersonRow,
    leads: (leadsRes.data ?? []) as WebsiteLeadRow[],
    contacts: contacts.map((contact) => ({
      ...contact,
      conversations: conversations.filter((conversation) => conversation.contact_id === contact.id),
      profile: profiles.find((profile) => profile.contact_id === contact.id) ?? null,
    })),
    audit: (auditRes.data ?? []) as AuditRow[],
  };
}

export async function searchPeople(term: string, limit = 8): Promise<PersonRow[]> {
  const clean = term.replace(/[%,()]/g, " ").trim();
  if (!clean) return [];
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_people")
    .select("*")
    .is("archived_at", null)
    .or(`display_name.ilike.%${clean}%,email.ilike.%${clean}%,phone_e164.ilike.%${clean}%`)
    .limit(limit);
  if (error) fail("People search", error);
  return (data ?? []) as PersonRow[];
}

// ---------------------------------------------------------------------------
// Console
// ---------------------------------------------------------------------------

export interface EventFilters {
  level?: string;
  source?: string;
  open?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listAdminEvents(filters: EventFilters = {}): Promise<{ rows: AdminEventRow[]; total: number; page: number; pageSize: number }> {
  const pageSize = Math.min(Math.max(filters.pageSize ?? 50, 10), 200);
  const page = Math.max(filters.page ?? 1, 1);
  const from = (page - 1) * pageSize;

  let query = getSupabaseAdmin()
    .from("admin_events")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (filters.level) query = query.eq("level", filters.level);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.open) query = query.is("acknowledged_at", null);

  const { data, error, count } = await query;
  if (error) fail("Events", error);
  return { rows: (data ?? []) as AdminEventRow[], total: count ?? 0, page, pageSize };
}

export async function listEventsForEntity(entityType: string, entityId: string): Promise<AdminEventRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("admin_events")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) fail("Entity events", error);
  return (data ?? []) as AdminEventRow[];
}

export async function listAuditForRow(tableName: string, rowId: string): Promise<AuditRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("admin_audit_log")
    .select("*")
    .eq("table_name", tableName)
    .eq("row_id", rowId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) fail("Audit", error);
  return (data ?? []) as AuditRow[];
}

export async function listRecentAudit(limit = 50): Promise<AuditRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail("Recent audit", error);
  return (data ?? []) as AuditRow[];
}

// ---------------------------------------------------------------------------
// Analytics + health
// ---------------------------------------------------------------------------

export interface AnalyticsSummary {
  days: number;
  totals: { views: number; sessions: number; leads: number };
  daily: Array<{ day: string; views: number; sessions: number }>;
  pages: Array<{ path: string; views: number; sessions: number }>;
  referrers: Array<{ host: string; sessions: number }>;
  sources: Array<{ source: string; sessions: number }>;
  devices: Array<{ device: string; sessions: number }>;
  countries: Array<{ country: string; sessions: number }>;
  funnel: { book_views: number; step_2: number; submitted: number; whatsapp_clicks: number };
}

export async function getAnalytics(days: number): Promise<AnalyticsSummary> {
  const { data, error } = await getSupabaseAdmin().rpc("admin_analytics", { p_days: days });
  if (error) fail("Analytics", error);
  return data as AnalyticsSummary;
}

export async function listRecentLeadSessions(limit = 20): Promise<Array<{ id: string; first_name: string; session_id: string; created_at: string; source: string }>> {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_website_leads")
    .select("id, first_name, session_id, created_at, source")
    .not("session_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail("Lead sessions", error);
  return (data ?? []) as Array<{ id: string; first_name: string; session_id: string; created_at: string; source: string }>;
}

export async function getHealthState(): Promise<HealthStateRow[]> {
  const { data, error } = await getSupabaseAdmin().from("health_state").select("*").order("check");
  if (error) fail("Health state", error);
  return (data ?? []) as HealthStateRow[];
}

export async function getHealthSamples(hours = 24): Promise<HealthSampleRow[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await getSupabaseAdmin()
    .from("health_checks")
    .select("check, ok, latency_ms, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(5000);
  if (error) fail("Health samples", error);
  return (data ?? []) as HealthSampleRow[];
}

export async function listHealthIncidents(limit = 30): Promise<AdminEventRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("admin_events")
    .select("*")
    .eq("source", "health")
    .in("kind", ["health_failing", "health_recovered"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail("Health incidents", error);
  return (data ?? []) as AdminEventRow[];
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function listBrainDocs(): Promise<BrainDocRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_brain_docs")
    .select("id, slug, title, category, content, active, sort_order, version, updated_by, updated_at")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) fail("Brain docs", error);
  return (data ?? []) as BrainDocRow[];
}

export async function getBrainDoc(id: string): Promise<{ doc: BrainDocRow; versions: BrainDocVersionRow[] } | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("inquiry_brain_docs")
    .select("id, slug, title, category, content, active, sort_order, version, updated_by, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) fail("Brain doc", error);
  if (!data) return null;
  const versions = await supabase
    .from("inquiry_brain_doc_versions")
    .select("id, version, title, category, content, active, created_by, created_at")
    .eq("doc_id", id)
    .order("version", { ascending: false })
    .limit(30);
  if (versions.error) fail("Brain doc versions", versions.error);
  return { doc: data as BrainDocRow, versions: (versions.data ?? []) as BrainDocVersionRow[] };
}

export async function listReplyExamples(): Promise<ReplyExampleRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_reply_examples")
    .select("id, kind, intents, customer_message, situation_summary, rejected_draft, reply, source, active, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) fail("Reply examples", error);
  return (data ?? []) as ReplyExampleRow[];
}

export async function listTemplateOverrides(): Promise<Map<string, TemplateOverrideRow>> {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_prompt_templates")
    .select("slug, kind, content, version, active, updated_by, updated_at");
  if (error) fail("Template overrides", error);
  const map = new Map<string, TemplateOverrideRow>();
  for (const row of (data ?? []) as TemplateOverrideRow[]) map.set(row.slug, row);
  return map;
}

export async function getTemplateVersions(slug: string): Promise<TemplateVersionRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_prompt_template_versions")
    .select("id, version, content, note, created_by, created_at")
    .eq("slug", slug)
    .order("version", { ascending: false })
    .limit(30);
  if (error) fail("Template versions", error);
  return (data ?? []) as TemplateVersionRow[];
}

export function templateDefinitions() {
  return TEMPLATE_DEFINITIONS;
}

export interface IntegrationStatus {
  name: string;
  configured: boolean;
  envVars: string[];
  note: string;
}

/** Which integrations have their env present. Values are never returned. */
export function getIntegrationStatuses(): IntegrationStatus[] {
  const has = (...names: string[]) => names.every((name) => Boolean(process.env[name]?.trim()));
  return [
    { name: "Supabase", configured: has("SUPABASE_URL") && (has("SUPABASE_SECRET_KEY") || has("SUPABASE_SERVICE_ROLE_KEY")), envVars: ["SUPABASE_URL", "SUPABASE_SECRET_KEY"], note: "Operational database for every enquiry, contact, and this admin." },
    { name: "Supabase Auth (admin login)", configured: has("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "ADMIN_EMAILS"), envVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "ADMIN_EMAILS"], note: "Magic-link sign-in for the allow-listed address." },
    { name: "Telegram", configured: has("TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "TELEGRAM_APPROVER_USER_IDS", "TELEGRAM_WEBHOOK_SECRET"), envVars: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "TELEGRAM_APPROVER_USER_IDS", "TELEGRAM_WEBHOOK_SECRET"], note: "Lead alerts, review cards, approvals and health messages." },
    { name: "Zernio (WhatsApp)", configured: has("ZERNIO_API_KEY", "ZERNIO_WEBHOOK_SECRET"), envVars: ["ZERNIO_API_KEY", "ZERNIO_WEBHOOK_SECRET"], note: "Inbound WhatsApp webhook and approved outbound sends." },
    { name: "AI Gateway", configured: has("AI_GATEWAY_API_KEY", "AI_MODEL"), envVars: ["AI_GATEWAY_API_KEY", "AI_MODEL"], note: `Drafting model: ${process.env.AI_MODEL ?? "not set"}.` },
    { name: "Trigger.dev", configured: has("TRIGGER_SECRET_KEY", "TRIGGER_PROJECT_REF"), envVars: ["TRIGGER_SECRET_KEY", "TRIGGER_PROJECT_REF"], note: "Background tasks: drafting, outbox, alert retries, health probe." },
    { name: "Health probe", configured: has("HEALTH_PROBE_SECRET"), envVars: ["HEALTH_PROBE_SECRET"], note: "Lets the scheduled probe call /api/health." },
    { name: "Google Maps", configured: has("NEXT_PUBLIC_GOOGLEMAPS_JS_API_KEY"), envVars: ["NEXT_PUBLIC_GOOGLEMAPS_JS_API_KEY"], note: "Venue autocomplete on /book (optional)." },
    { name: "LangSmith tracing", configured: process.env.LANGSMITH_TRACING === "true" && has("LANGSMITH_API_KEY"), envVars: ["LANGSMITH_TRACING", "LANGSMITH_API_KEY"], note: "Optional traces of every AI draft." },
    { name: "Email (Gmail)", configured: has("GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN"), envVars: ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN"], note: "Phase 5: polling luke@stamer.co.za (Google Workspace) for enquiries. Not wired yet." },
  ];
}

export interface RecentSession {
  session_id: string;
  started_at: string;
  referrer_host: string | null;
  country: string | null;
  device: string | null;
  paths: string[];
  lead_id: string | null;
}

/**
 * The last week's sessions, newest first, each with the ordered list of
 * pages it viewed and the lead it produced (if any). Assembled in TypeScript
 * from `site_visits`: a few thousand rows at most for this site.
 */
export async function listRecentSessions(limit = 40): Promise<RecentSession[]> {
  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("site_visits")
    .select("session_id, path, referrer_host, country, device, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(5000);
  if (error) fail("Recent sessions", error);

  const sessions = new Map<string, RecentSession>();
  for (const row of (data ?? []) as Array<{ session_id: string; path: string; referrer_host: string | null; country: string | null; device: string | null; created_at: string }>) {
    const existing = sessions.get(row.session_id);
    if (existing) {
      if (existing.paths[existing.paths.length - 1] !== row.path) existing.paths.push(row.path);
      existing.referrer_host = existing.referrer_host ?? row.referrer_host;
      existing.country = existing.country ?? row.country;
      existing.device = existing.device ?? row.device;
    } else {
      sessions.set(row.session_id, {
        session_id: row.session_id,
        started_at: row.created_at,
        referrer_host: row.referrer_host,
        country: row.country,
        device: row.device,
        paths: [row.path],
        lead_id: null,
      });
    }
  }

  const recent = [...sessions.values()].sort((a, b) => (a.started_at < b.started_at ? 1 : -1)).slice(0, limit);
  if (recent.length === 0) return [];

  const { data: leads, error: leadsError } = await supabase
    .from("inquiry_website_leads")
    .select("id, session_id")
    .in("session_id", recent.map((session) => session.session_id));
  if (leadsError) fail("Session leads", leadsError);
  const leadBySession = new Map<string, string>();
  for (const lead of (leads ?? []) as Array<{ id: string; session_id: string }>) {
    leadBySession.set(lead.session_id, lead.id);
  }
  for (const session of recent) {
    session.lead_id = leadBySession.get(session.session_id) ?? null;
  }
  return recent;
}
