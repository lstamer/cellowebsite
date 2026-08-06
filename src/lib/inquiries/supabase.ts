import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { getSupabaseSecret, requireEnv } from "@/lib/inquiries/env";
import { normalizePhoneE164 } from "@/lib/inquiries/phone";
import {
  brainDocRowSchema,
  mediaAssetRowSchema,
  replyExampleRowSchema,
  websiteLeadDetailsSchema,
  type BrainDocRow,
  type InquiryAnalysis,
  type InquiryExtraction,
  type InquiryMessageRow,
  type MediaAssetRow,
  type OutboxRow,
  type ReplyExampleRow,
  type ZernioMessageReceived,
} from "@/lib/inquiries/schema";

let adminClient: SupabaseClient | undefined;

function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(requireEnv("SUPABASE_URL"), getSupabaseSecret(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return adminClient;
}

const ingestResultSchema = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().uuid(),
  outboxId: z.string().uuid().nullable(),
  duplicate: z.boolean(),
});

export type IngestResult = z.infer<typeof ingestResultSchema>;

export async function ingestZernioMessage(
  event: ZernioMessageReceived,
): Promise<IngestResult> {
  const sender = event.message.sender;
  const identity = sender.businessScopedUserId || sender.id;
  const accountId = event.account.accountId || event.account.id;
  const { data, error } = await getSupabaseAdmin().rpc(
    "ingest_zernio_message",
    {
      p_provider_event_id: event.id,
      p_provider_message_id: event.message.platformMessageId,
      p_provider_conversation_id: event.conversation.id,
      p_provider_account_id: accountId,
      p_provider_identity: identity,
      // Normalised, not passed through: this value is the identity key that
      // links this WhatsApp contact to the person who filled in the website
      // form, and the two only meet if both sides store the same canonical
      // string. Zernio usually sends E.164 already, in which case this is a
      // no-op; when it does not, the column finally honours its own name.
      p_phone_e164: normalizePhoneE164(sender.phoneNumber),
      p_whatsapp_username: sender.whatsappUsername ?? sender.username ?? null,
      p_display_name:
        sender.name ?? event.conversation.participantName ?? null,
      p_body: event.message.text,
      p_attachments: event.message.attachments,
      p_sender_snapshot: sender,
      p_occurred_at: event.message.sentAt || event.timestamp,
      p_raw_payload: event,
    },
  );

  if (error) {
    throw new Error(`Supabase ingest failed: ${error.message}`);
  }

  return ingestResultSchema.parse(data);
}

const messageRowSchema = z.object({
  id: z.string().uuid(),
  body: z.string().nullable(),
  attachments: z.array(
    z.object({
      type: z.string().optional(),
      url: z.string().optional(),
    }).passthrough(),
  ),
  occurred_at: z.string(),
  sender_snapshot: z.record(z.string(), z.unknown()),
});

export async function getUnprocessedInquiryMessages(
  conversationId: string,
): Promise<InquiryMessageRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_messages")
    .select("id, body, attachments, occurred_at, sender_snapshot")
    .eq("conversation_id", conversationId)
    .eq("direction", "incoming")
    .is("processed_at", null)
    .order("occurred_at", { ascending: true })
    .limit(50);

  if (error) {
    throw new Error(`Failed to load inquiry messages: ${error.message}`);
  }

  return z.array(messageRowSchema).parse(data);
}

export async function getInquiryMessagesByIds(
  messageIds: string[],
): Promise<InquiryMessageRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_messages")
    .select("id, body, attachments, occurred_at, sender_snapshot")
    .in("id", messageIds)
    .order("occurred_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load approval messages: ${error.message}`);
  }

  return z.array(messageRowSchema).parse(data);
}

export async function hasUnprocessedInquiryMessages(
  conversationId: string,
): Promise<boolean> {
  const { count, error } = await getSupabaseAdmin()
    .from("inquiry_messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("direction", "incoming")
    .is("processed_at", null);

  if (error) {
    throw new Error(`Failed to count inquiry messages: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

const recordAnalysisResultSchema = z.object({
  inquiryId: z.string().uuid(),
  responseRunId: z.string().uuid(),
  approvalId: z.string().uuid(),
  reviewOutboxId: z.string().uuid(),
  duplicate: z.boolean(),
  telegramMessageId: z.union([z.string(), z.number()]).nullable(),
});

export type RecordAnalysisResult = z.infer<
  typeof recordAnalysisResultSchema
>;

export async function recordInquiryAnalysis(input: {
  conversationId: string;
  batchKey: string;
  messageIds: string[];
  model: string;
  analysis: InquiryAnalysis;
  policyDecision: "human_review";
  policyReasons: string[];
}): Promise<RecordAnalysisResult> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "record_inquiry_analysis",
    {
      p_conversation_id: input.conversationId,
      p_batch_key: input.batchKey,
      p_message_ids: input.messageIds,
      p_model: input.model,
      p_analysis: input.analysis,
      p_proposed_reply: input.analysis.draft_reply,
      p_policy_decision: input.policyDecision,
      p_policy_reasons: input.policyReasons,
    },
  );

  if (error) {
    throw new Error(`Failed to record inquiry analysis: ${error.message}`);
  }

  return recordAnalysisResultSchema.parse(data);
}

const claimedReviewSchema = z.discriminatedUnion("claimed", [
  z.object({
    claimed: z.literal(true),
    approvalId: z.string().uuid(),
    analysis: z.record(z.string(), z.unknown()),
    messageIds: z.array(z.string().uuid()),
    proposedReply: z.string(),
  }),
  z.object({
    claimed: z.literal(false),
    status: z.string().nullable(),
  }),
]);

export type ClaimedReviewNotification = z.infer<typeof claimedReviewSchema>;

export async function claimInquiryReviewNotification(
  approvalId: string,
): Promise<ClaimedReviewNotification> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "claim_inquiry_review_notification",
    { p_approval_id: approvalId },
  );

  if (error) {
    throw new Error(`Failed to claim Telegram review: ${error.message}`);
  }

  return claimedReviewSchema.parse(data);
}

export async function completeInquiryReviewNotification(input: {
  approvalId: string;
  chatId: string;
  messageId: number;
}): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "complete_inquiry_review_notification",
    {
      p_approval_id: input.approvalId,
      p_telegram_chat_id: input.chatId,
      p_telegram_message_id: input.messageId,
    },
  );

  if (error) {
    throw new Error(`Failed to complete Telegram review: ${error.message}`);
  }
}

export async function failInquiryReviewNotification(input: {
  approvalId: string;
  errorMessage: string;
  uncertain: boolean;
}): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "fail_inquiry_review_notification",
    {
      p_approval_id: input.approvalId,
      p_error: input.errorMessage,
      p_uncertain: input.uncertain,
    },
  );

  if (error) {
    throw new Error(`Failed to record Telegram review failure: ${error.message}`);
  }
}

const decisionResultSchema = z.object({
  duplicate: z.boolean(),
  applied: z.boolean(),
  status: z.string().nullable(),
  outboxId: z.string().uuid().nullable(),
});

export type ApprovalDecisionResult = z.infer<typeof decisionResultSchema>;

export async function decideInquiryApproval(input: {
  approvalId: string;
  decision: "approve" | "reject";
  approverId: string;
  telegramUpdateId: number;
}): Promise<ApprovalDecisionResult> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "decide_inquiry_approval",
    {
      p_approval_id: input.approvalId,
      p_decision: input.decision,
      p_approver_id: input.approverId,
      p_telegram_update_id: input.telegramUpdateId,
    },
  );

  if (error) {
    throw new Error(`Failed to decide inquiry approval: ${error.message}`);
  }

  return decisionResultSchema.parse(data);
}

const claimedSendSchema = z.discriminatedUnion("claimed", [
  z.object({
    claimed: z.literal(true),
    approvalId: z.string().uuid(),
    reply: z.string(),
    proposedMediaSlugs: z.array(z.string()).default([]),
    providerConversationId: z.string(),
    providerAccountId: z.string(),
    telegramChatId: z.union([z.string(), z.number()]).nullable(),
    telegramMessageId: z.number().int().nullable(),
  }),
  z.object({
    claimed: z.literal(false),
    status: z.string().nullable(),
    telegramChatId: z.union([z.string(), z.number()]).nullable().optional(),
    telegramMessageId: z.number().int().nullable().optional(),
  }),
]);

export type ClaimedApprovalSend = z.infer<typeof claimedSendSchema>;

export async function claimInquiryApprovalSend(
  approvalId: string,
): Promise<ClaimedApprovalSend> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "claim_inquiry_approval_send",
    { p_approval_id: approvalId },
  );

  if (error) {
    throw new Error(`Failed to claim approved response: ${error.message}`);
  }

  return claimedSendSchema.parse(data);
}

export async function completeInquiryApprovalSend(
  approvalId: string,
  providerMessageId: string,
): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "complete_inquiry_approval_send",
    {
      p_approval_id: approvalId,
      p_provider_message_id: providerMessageId,
    },
  );

  if (error) {
    throw new Error(`Failed to complete approved response: ${error.message}`);
  }
}

export async function failInquiryApprovalSend(input: {
  approvalId: string;
  errorMessage: string;
  uncertain: boolean;
}): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "fail_inquiry_approval_send",
    {
      p_approval_id: input.approvalId,
      p_error: input.errorMessage,
      p_uncertain: input.uncertain,
    },
  );

  if (error) {
    throw new Error(`Failed to record send failure: ${error.message}`);
  }
}

const outboxRowSchema = z.object({
  id: z.string().uuid(),
  eventType: z.enum([
    "inquiry.message_received",
    "inquiry.review_requested",
    "inquiry.response_approved",
    "inquiry.availability_requested",
    "inquiry.availability_answered",
    "website_lead.availability_decided",
  ]),
  aggregateId: z.string().uuid(),
  payload: z.record(z.string(), z.unknown()),
  claimToken: z.string().uuid(),
});

export async function claimInquiryOutboxEvent(
  outboxId: string,
): Promise<OutboxRow | null> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "claim_inquiry_outbox_event",
    { p_outbox_id: outboxId },
  );

  if (error) {
    throw new Error(`Failed to claim inquiry outbox event: ${error.message}`);
  }

  return data === null ? null : outboxRowSchema.parse(data);
}

export async function claimPendingInquiryOutboxEvents(): Promise<OutboxRow[]> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "claim_pending_inquiry_outbox_events",
    { p_limit: 100 },
  );

  if (error) {
    throw new Error(`Failed to claim pending inquiry outbox: ${error.message}`);
  }

  return z.array(outboxRowSchema).parse(data);
}

export async function completeInquiryOutboxEvent(
  outboxId: string,
  claimToken: string,
): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "complete_inquiry_outbox_event",
    { p_outbox_id: outboxId, p_claim_token: claimToken },
  );

  if (error) {
    throw new Error(`Failed to complete inquiry outbox event: ${error.message}`);
  }
}

export async function releaseInquiryOutboxEvent(
  outboxId: string,
  claimToken: string,
  errorMessage: string,
): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "release_inquiry_outbox_event",
    {
      p_outbox_id: outboxId,
      p_claim_token: claimToken,
      p_error: errorMessage,
    },
  );

  if (error) {
    throw new Error(`Failed to release inquiry outbox event: ${error.message}`);
  }
}

export async function getInquiryConversationProviderIds(
  conversationId: string,
): Promise<{ providerConversationId: string; providerAccountId: string }> {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_conversations")
    .select("provider_conversation_id, provider_account_id")
    .eq("id", conversationId)
    .single();

  if (error) {
    throw new Error(`Failed to load conversation provider ids: ${error.message}`);
  }

  const parsed = z
    .object({
      provider_conversation_id: z.string(),
      provider_account_id: z.string(),
    })
    .parse(data);

  return {
    providerConversationId: parsed.provider_conversation_id,
    providerAccountId: parsed.provider_account_id,
  };
}

const clientProfileSchema = z
  .object({
    display_name: z.string().nullable(),
    role: z.string().nullable(),
    event_type: z.string().nullable(),
    event_date_text: z.string().nullable(),
    event_date_iso: z.string().nullable(),
    venue: z.string().nullable(),
    location: z.string().nullable(),
    guest_count: z.number().int().nullable(),
    duration_minutes: z.number().int().nullable(),
    budget_text: z.string().nullable(),
    quoted_amount_text: z.string().nullable(),
    deposit_status: z.string(),
    deposit_evidence: z.string().nullable(),
    booking_stage: z.string(),
    preferences: z.array(z.string()),
    notes: z.string().nullable(),
    updated_at: z.string(),
  })
  .loose();

export type ClientProfile = z.infer<typeof clientProfileSchema>;

export async function getInquiryClientProfile(
  conversationId: string,
): Promise<ClientProfile | null> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "get_inquiry_client_profile",
    { p_conversation_id: conversationId },
  );

  if (error) {
    throw new Error(`Failed to load client profile: ${error.message}`);
  }

  return data === null ? null : clientProfileSchema.parse(data);
}

export async function mergeInquiryClientProfile(
  conversationId: string,
  analysis: InquiryAnalysis,
): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "merge_inquiry_client_profile",
    { p_conversation_id: conversationId, p_analysis: analysis },
  );

  if (error) {
    throw new Error(`Failed to merge client profile: ${error.message}`);
  }
}

export async function getActiveBrainDocs(): Promise<BrainDocRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_brain_docs")
    .select("slug, title, category, content")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load brain docs: ${error.message}`);
  }

  return z.array(brainDocRowSchema).parse(data);
}

export async function getMatchingReplyExamples(
  intents: string[],
  limit = 6,
): Promise<ReplyExampleRow[]> {
  if (intents.length === 0) return [];

  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_reply_examples")
    .select("kind, customer_message, situation_summary, rejected_draft, reply")
    .eq("active", true)
    .overlaps("intents", intents)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load reply examples: ${error.message}`);
  }

  return z.array(replyExampleRowSchema).parse(data);
}

export async function getActiveMediaAssets(): Promise<MediaAssetRow[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_media_assets")
    .select("slug, title, description, media_type, url, mime_type")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load media assets: ${error.message}`);
  }

  return z.array(mediaAssetRowSchema).parse(data);
}

export async function getMediaAssetsBySlugs(
  slugs: string[],
): Promise<MediaAssetRow[]> {
  if (slugs.length === 0) return [];

  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_media_assets")
    .select("slug, title, description, media_type, url, mime_type")
    .eq("active", true)
    .in("slug", slugs);

  if (error) {
    throw new Error(`Failed to load media assets by slug: ${error.message}`);
  }

  return z.array(mediaAssetRowSchema).parse(data);
}

const overrideResultSchema = z.object({
  duplicate: z.boolean(),
  applied: z.boolean(),
  status: z.string().nullable(),
  approvalId: z.string().uuid().nullable(),
  outboxId: z.string().uuid().nullable(),
  // Reply-to overrides can now target a website-lead review card too. The
  // default keeps results from the pre-migration RPC parsing as approvals.
  targetKind: z.enum(["approval", "website_lead"]).default("approval"),
  leadId: z.string().uuid().nullish(),
  reply: z.string().nullish(),
  whatsappDigits: z.string().nullish(),
  firstName: z.string().nullish(),
});

export type InquiryOverrideResult = z.infer<typeof overrideResultSchema>;

export async function recordInquiryOverride(input: {
  telegramChatId: number;
  replyToMessageId: number;
  overrideText: string;
  approverId: string;
  telegramUpdateId: number;
}): Promise<InquiryOverrideResult> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "record_inquiry_override",
    {
      p_telegram_chat_id: input.telegramChatId,
      p_reply_to_message_id: input.replyToMessageId,
      p_override_text: input.overrideText,
      p_approver_id: input.approverId,
      p_telegram_update_id: input.telegramUpdateId,
    },
  );

  if (error) {
    throw new Error(`Failed to record inquiry override: ${error.message}`);
  }

  return overrideResultSchema.parse(data);
}

const telegramCardRefSchema = z.object({
  telegramChatId: z.string().nullable(),
  telegramMessageId: z.number().int().nullable(),
});

const staleWorkSchema = z.object({
  staleSends: z.array(
    telegramCardRefSchema.extend({
      approvalId: z.string().uuid(),
    }),
  ),
  staleReviews: z.number().int(),
  staleOutbox: z.number().int(),
  // Added by the website-lead / availability-gate migration; defaults keep the
  // parser working against a database that predates it.
  staleLeadWork: z.number().int().default(0),
  expiredAvailabilityCards: z
    .array(telegramCardRefSchema.extend({ checkId: z.string().uuid() }))
    .default([]),
  expiredLeadCards: z
    .array(telegramCardRefSchema.extend({ leadId: z.string().uuid() }))
    .default([]),
  expiredOverridePrompts: z
    .array(
      z.object({
        confirmId: z.string().uuid(),
        telegramChatId: z.string().nullable(),
        promptMessageId: z.number().int().nullable(),
      }),
    )
    .default([]),
  // Added by the suggest-changes migration; the default keeps the parser
  // working against a database that predates it.
  expiredSuggestChangePrompts: z
    .array(
      z.object({
        requestId: z.string().uuid(),
        telegramChatId: z.string().nullable(),
        promptMessageId: z.number().int().nullable(),
      }),
    )
    .default([]),
  // Redrafts whose text is committed but whose review card never reached
  // Telegram (202608070006). Everything needed to post the card that failed,
  // read fresh at sweep time so the card prints exactly what the target holds.
  // The default keeps the parser working against a database that predates it.
  cardlessRedrafts: z
    .array(
      z.object({
        requestId: z.string().uuid(),
        telegramChatId: z.string(),
        // Spelled out rather than reusing `suggestChangeTargetKindSchema`,
        // which is declared further down this file: a top-level const cannot
        // reference one that has not been initialised yet.
        targetKind: z.enum(["approval", "website_lead"]),
        targetId: z.string().uuid(),
        revision: z.number().int(),
        targetName: z.string(),
        instructions: z.string(),
        draft: z.string(),
        mediaSlugs: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  // Cards whose Approve button a redraft stripped before writing, for a redraft
  // that then never wrote (202608070007). The mirror of `cardlessRedrafts`:
  // there the text landed and the card did not, here the button went and the
  // text never followed, so the card still prints exactly what its target
  // holds and only the button to accept it is missing. The default keeps the
  // parser working against a database that predates it.
  retiredApproveCards: z
    .array(
      z.object({
        requestId: z.string().uuid(),
        telegramChatId: z.string(),
        messageId: z.number().int(),
        // Spelled out rather than reusing `suggestChangeTargetKindSchema` for
        // the same reason as `cardlessRedrafts` above: that const is declared
        // further down this file.
        targetKind: z.enum(["approval", "website_lead"]),
        targetId: z.string().uuid(),
      }),
    )
    .default([]),
});

export async function reconcileStaleInquiryWork(): Promise<
  z.infer<typeof staleWorkSchema>
> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "reconcile_stale_inquiry_work",
  );

  if (error) {
    throw new Error(`Failed to reconcile stale inquiry work: ${error.message}`);
  }

  return staleWorkSchema.parse(data);
}

// ---------------------------------------------------------------------------
// Website leads
// ---------------------------------------------------------------------------

const createWebsiteLeadResultSchema = z.object({
  leadId: z.string().uuid(),
});

export async function createWebsiteLead(input: {
  source: "lead_form" | "contact_form";
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  whatsappDigits: string | null;
  // Canonical E.164 for the same number as `whatsappDigits`. Null when the
  // lead gave no usable number; the RPC then stores no person link.
  phoneE164: string | null;
  contactPreference: string | null;
  eventType: string | null;
  eventDateText: string | null;
  eventDateIso: string | null;
  dateFlexible: boolean | null;
  location: string | null;
  guestCount: number | null;
  performanceMinutes: number | null;
  bookerRole: string | null;
  message: string | null;
  notes: string | null;
  payload: Record<string, unknown>;
}): Promise<{ leadId: string }> {
  const { data, error } = await getSupabaseAdmin().rpc("create_website_lead", {
    p_source: input.source,
    p_first_name: input.firstName,
    p_last_name: input.lastName,
    p_email: input.email,
    p_phone: input.phone,
    p_whatsapp: input.whatsapp,
    p_whatsapp_digits: input.whatsappDigits,
    p_phone_e164: input.phoneE164,
    p_contact_preference: input.contactPreference,
    p_event_type: input.eventType,
    p_event_date_text: input.eventDateText,
    p_event_date_iso: input.eventDateIso,
    p_date_flexible: input.dateFlexible,
    p_location: input.location,
    p_guest_count: input.guestCount,
    p_performance_minutes: input.performanceMinutes,
    p_booker_role: input.bookerRole,
    p_message: input.message,
    p_notes: input.notes,
    p_payload: input.payload,
  });

  if (error) {
    throw new Error(`Failed to create website lead: ${error.message}`);
  }

  return createWebsiteLeadResultSchema.parse(data);
}

export async function completeWebsiteLeadAlert(input: {
  leadId: string;
  chatId: string;
  messageId: number;
}): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc("complete_website_lead_alert", {
    p_lead_id: input.leadId,
    p_telegram_chat_id: input.chatId,
    p_telegram_message_id: input.messageId,
  });

  if (error) {
    throw new Error(`Failed to store website lead alert card: ${error.message}`);
  }
}

const leadAvailabilityDecisionSchema = z.object({
  duplicate: z.boolean(),
  applied: z.boolean(),
  status: z.string().nullable(),
  outboxId: z.string().uuid().nullable(),
  availability: z.enum(["available", "unavailable"]).nullish(),
  firstName: z.string().nullish(),
  whatsappDigits: z.string().nullish(),
  telegramChatId: z.string().nullish(),
  telegramMessageId: z.number().int().nullish(),
});

export type LeadAvailabilityDecision = z.infer<
  typeof leadAvailabilityDecisionSchema
>;

export async function decideWebsiteLeadAvailability(input: {
  leadId: string;
  availability: "available" | "unavailable";
  approverId: string;
  telegramUpdateId: number;
}): Promise<LeadAvailabilityDecision> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "decide_website_lead_availability",
    {
      p_lead_id: input.leadId,
      p_availability: input.availability,
      p_approver_id: input.approverId,
      p_telegram_update_id: input.telegramUpdateId,
    },
  );

  if (error) {
    throw new Error(`Failed to decide lead availability: ${error.message}`);
  }

  return leadAvailabilityDecisionSchema.parse(data);
}

const claimedLeadDraftSchema = z.discriminatedUnion("claimed", [
  websiteLeadDetailsSchema.extend({
    claimed: z.literal(true),
    email: z.string(),
    contactPreference: z.string().nullable(),
    eventDateIso: z.string().nullable(),
  }),
  z.object({
    claimed: z.literal(false),
    status: z.string().nullable(),
  }),
]);

export type ClaimedWebsiteLeadDraft = z.infer<typeof claimedLeadDraftSchema>;

export async function claimWebsiteLeadDraft(
  leadId: string,
): Promise<ClaimedWebsiteLeadDraft> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "claim_website_lead_draft",
    { p_lead_id: leadId },
  );

  if (error) {
    throw new Error(`Failed to claim website lead draft: ${error.message}`);
  }

  return claimedLeadDraftSchema.parse(data);
}

export async function releaseWebsiteLeadDraft(leadId: string): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc("release_website_lead_draft", {
    p_lead_id: leadId,
  });

  if (error) {
    throw new Error(`Failed to release website lead draft: ${error.message}`);
  }
}

export async function recordWebsiteLeadDraft(input: {
  leadId: string;
  model: string;
  draft: string;
}): Promise<{ recorded: boolean; status: string | null }> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "record_website_lead_draft",
    {
      p_lead_id: input.leadId,
      p_model: input.model,
      p_draft: input.draft,
    },
  );

  if (error) {
    throw new Error(`Failed to record website lead draft: ${error.message}`);
  }

  return z
    .object({ recorded: z.boolean(), status: z.string().nullable() })
    .parse(data);
}

const claimedLeadReviewSchema = z.discriminatedUnion("claimed", [
  websiteLeadDetailsSchema.extend({
    claimed: z.literal(true),
    draftReply: z.string(),
  }),
  z.object({
    claimed: z.literal(false),
    status: z.string().nullable(),
  }),
]);

export type ClaimedWebsiteLeadReview = z.infer<typeof claimedLeadReviewSchema>;

export async function claimWebsiteLeadReviewNotification(
  leadId: string,
): Promise<ClaimedWebsiteLeadReview> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "claim_website_lead_review_notification",
    { p_lead_id: leadId },
  );

  if (error) {
    throw new Error(`Failed to claim website lead review: ${error.message}`);
  }

  return claimedLeadReviewSchema.parse(data);
}

export async function completeWebsiteLeadReviewNotification(input: {
  leadId: string;
  chatId: string;
  messageId: number;
}): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "complete_website_lead_review_notification",
    {
      p_lead_id: input.leadId,
      p_telegram_chat_id: input.chatId,
      p_telegram_message_id: input.messageId,
    },
  );

  if (error) {
    throw new Error(`Failed to complete website lead review: ${error.message}`);
  }
}

export async function failWebsiteLeadReviewNotification(input: {
  leadId: string;
  errorMessage: string;
  uncertain: boolean;
}): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "fail_website_lead_review_notification",
    {
      p_lead_id: input.leadId,
      p_error: input.errorMessage,
      p_uncertain: input.uncertain,
    },
  );

  if (error) {
    throw new Error(
      `Failed to record website lead review failure: ${error.message}`,
    );
  }
}

const leadDraftDecisionSchema = z.object({
  duplicate: z.boolean(),
  applied: z.boolean(),
  status: z.string().nullable(),
  reply: z.string().nullish(),
  whatsappDigits: z.string().nullish(),
  firstName: z.string().nullish(),
  reviewTelegramChatId: z.string().nullish(),
  reviewTelegramMessageId: z.number().int().nullish(),
});

export type LeadDraftDecision = z.infer<typeof leadDraftDecisionSchema>;

export async function decideWebsiteLeadDraft(input: {
  leadId: string;
  decision: "approve" | "dismiss";
  approverId: string;
  telegramUpdateId: number;
}): Promise<LeadDraftDecision> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "decide_website_lead_draft",
    {
      p_lead_id: input.leadId,
      p_decision: input.decision,
      p_approver_id: input.approverId,
      p_telegram_update_id: input.telegramUpdateId,
    },
  );

  if (error) {
    throw new Error(`Failed to decide website lead draft: ${error.message}`);
  }

  return leadDraftDecisionSchema.parse(data);
}

// ---------------------------------------------------------------------------
// Inbound availability gate
// ---------------------------------------------------------------------------

const availabilityCheckResultSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("fact"),
    checkId: z.string().uuid(),
    availability: z.enum(["available", "unavailable"]),
    eventDateText: z.string().nullable(),
  }),
  z.object({
    mode: z.literal("pending"),
    duplicate: z.boolean(),
    checkId: z.string().uuid(),
    outboxId: z.string().uuid().nullable(),
    supersededCards: z.array(telegramCardRefSchema.extend({ checkId: z.string().uuid() })),
  }),
]);

export type AvailabilityCheckResult = z.infer<
  typeof availabilityCheckResultSchema
>;

export async function ensureInquiryAvailabilityCheck(input: {
  conversationId: string;
  batchKey: string;
  messageIds: string[];
  extraction: InquiryExtraction;
  model: string;
  eventDateText: string | null;
  eventDateIso: string | null;
  eventContext: string | null;
}): Promise<AvailabilityCheckResult> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "ensure_inquiry_availability_check",
    {
      p_conversation_id: input.conversationId,
      p_batch_key: input.batchKey,
      p_message_ids: input.messageIds,
      p_extraction: input.extraction,
      p_model: input.model,
      p_event_date_text: input.eventDateText,
      p_event_date_iso: input.eventDateIso,
      p_event_context: input.eventContext,
    },
  );

  if (error) {
    throw new Error(`Failed to ensure availability check: ${error.message}`);
  }

  return availabilityCheckResultSchema.parse(data);
}

// Deterministic resume lookup: the batch key is a pure function of the
// message set, so an answered check for it IS this burst's question — no
// re-extracted intents or dates need to match for Luke's answer to apply.
export async function getAnsweredAvailabilityFact(
  conversationId: string,
  batchKey: string,
): Promise<{
  availability: "available" | "unavailable";
  dateText: string | null;
} | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("inquiry_availability_checks")
    .select("availability, event_date_text")
    .eq("conversation_id", conversationId)
    .eq("batch_key", batchKey)
    .eq("status", "answered")
    .order("answered_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Failed to load answered availability: ${error.message}`);
  }

  const rows = z
    .array(
      z.object({
        availability: z.enum(["available", "unavailable"]),
        event_date_text: z.string().nullable(),
      }),
    )
    .parse(data ?? []);

  if (rows.length === 0) return null;

  return {
    availability: rows[0].availability,
    dateText: rows[0].event_date_text,
  };
}

const claimedAvailabilityQuestionSchema = z.discriminatedUnion("claimed", [
  z.object({
    claimed: z.literal(true),
    checkId: z.string().uuid(),
    conversationId: z.string().uuid(),
    eventDateText: z.string().nullable(),
    eventContext: z.string().nullable(),
    extraction: z.record(z.string(), z.unknown()),
    contactName: z.string().nullable(),
    serviceWindowExpiresAt: z.string().nullable(),
  }),
  z.object({
    claimed: z.literal(false),
    status: z.string().nullable(),
  }),
]);

export type ClaimedAvailabilityQuestion = z.infer<
  typeof claimedAvailabilityQuestionSchema
>;

export async function claimInquiryAvailabilityQuestion(
  checkId: string,
): Promise<ClaimedAvailabilityQuestion> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "claim_inquiry_availability_question",
    { p_check_id: checkId },
  );

  if (error) {
    throw new Error(`Failed to claim availability question: ${error.message}`);
  }

  return claimedAvailabilityQuestionSchema.parse(data);
}

export async function completeInquiryAvailabilityQuestion(input: {
  checkId: string;
  chatId: string;
  messageId: number;
}): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "complete_inquiry_availability_question",
    {
      p_check_id: input.checkId,
      p_telegram_chat_id: input.chatId,
      p_telegram_message_id: input.messageId,
    },
  );

  if (error) {
    throw new Error(
      `Failed to complete availability question: ${error.message}`,
    );
  }
}

export async function failInquiryAvailabilityQuestion(input: {
  checkId: string;
  errorMessage: string;
  uncertain: boolean;
}): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "fail_inquiry_availability_question",
    {
      p_check_id: input.checkId,
      p_error: input.errorMessage,
      p_uncertain: input.uncertain,
    },
  );

  if (error) {
    throw new Error(
      `Failed to record availability question failure: ${error.message}`,
    );
  }
}

const availabilityAnswerSchema = z.object({
  duplicate: z.boolean(),
  applied: z.boolean(),
  status: z.string().nullable(),
  outboxId: z.string().uuid().nullable(),
  availability: z.enum(["available", "unavailable"]).nullish(),
  conversationId: z.string().uuid().nullish(),
  eventDateText: z.string().nullish(),
  telegramChatId: z.string().nullish(),
  telegramMessageId: z.number().int().nullish(),
});

export type AvailabilityAnswerResult = z.infer<typeof availabilityAnswerSchema>;

export async function answerInquiryAvailability(input: {
  checkId: string;
  availability: "available" | "unavailable";
  approverId: string;
  telegramUpdateId: number;
}): Promise<AvailabilityAnswerResult> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "answer_inquiry_availability",
    {
      p_check_id: input.checkId,
      p_availability: input.availability,
      p_approver_id: input.approverId,
      p_telegram_update_id: input.telegramUpdateId,
    },
  );

  if (error) {
    throw new Error(`Failed to answer availability check: ${error.message}`);
  }

  return availabilityAnswerSchema.parse(data);
}

export async function supersedePendingAvailabilityChecks(
  conversationId: string,
  exceptCheckId?: string,
): Promise<
  Array<{
    checkId: string;
    telegramChatId: string | null;
    telegramMessageId: number | null;
  }>
> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "supersede_pending_availability_checks",
    {
      p_conversation_id: conversationId,
      p_except_check_id: exceptCheckId ?? null,
    },
  );

  if (error) {
    throw new Error(
      `Failed to supersede availability checks: ${error.message}`,
    );
  }

  return z
    .array(telegramCardRefSchema.extend({ checkId: z.string().uuid() }))
    .parse(data);
}

// ---------------------------------------------------------------------------
// Bare-message override staging + confirm
// ---------------------------------------------------------------------------

const stagedOverrideSchema = z.discriminatedUnion("staged", [
  z.object({
    staged: z.literal(true),
    duplicate: z.boolean(),
    confirmId: z.string().uuid(),
    targetKind: z.enum(["approval", "website_lead"]),
    targetName: z.string(),
    targetCardMessageId: z.number().int(),
    supersededPrompts: z.array(
      z.object({
        confirmId: z.string().uuid(),
        promptMessageId: z.number().int().nullable(),
      }),
    ),
  }),
  z.object({
    staged: z.literal(false),
    duplicate: z.boolean().default(false),
    status: z.string().nullable(),
  }),
]);

export type StagedOverride = z.infer<typeof stagedOverrideSchema>;

export async function stageInquiryOverride(input: {
  telegramChatId: number;
  overrideText: string;
  approverId: string;
  telegramUpdateId: number;
  sourceMessageId: number;
}): Promise<StagedOverride> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "stage_inquiry_override",
    {
      p_telegram_chat_id: input.telegramChatId,
      p_override_text: input.overrideText,
      p_approver_id: input.approverId,
      p_telegram_update_id: input.telegramUpdateId,
      p_source_message_id: input.sourceMessageId,
    },
  );

  if (error) {
    throw new Error(`Failed to stage inquiry override: ${error.message}`);
  }

  return stagedOverrideSchema.parse(data);
}

export async function attachOverrideConfirmationPrompt(input: {
  confirmId: string;
  promptMessageId: number;
}): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "attach_override_confirmation_prompt",
    {
      p_confirm_id: input.confirmId,
      p_prompt_message_id: input.promptMessageId,
    },
  );

  if (error) {
    throw new Error(`Failed to attach override prompt: ${error.message}`);
  }
}

const confirmedOverrideSchema = z.object({
  duplicate: z.boolean(),
  applied: z.boolean(),
  status: z.string().nullable(),
  targetKind: z.enum(["approval", "website_lead"]).nullish(),
  approvalId: z.string().uuid().nullish(),
  outboxId: z.string().uuid().nullish(),
  leadId: z.string().uuid().nullish(),
  overrideText: z.string().nullish(),
  reply: z.string().nullish(),
  whatsappDigits: z.string().nullish(),
  firstName: z.string().nullish(),
  targetCardChatId: z.string().nullish(),
  targetCardMessageId: z.number().int().nullish(),
});

export type ConfirmedOverride = z.infer<typeof confirmedOverrideSchema>;

export async function confirmInquiryOverride(input: {
  confirmId: string;
  approverId: string;
  telegramUpdateId: number;
}): Promise<ConfirmedOverride> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "confirm_inquiry_override",
    {
      p_confirm_id: input.confirmId,
      p_approver_id: input.approverId,
      p_telegram_update_id: input.telegramUpdateId,
    },
  );

  if (error) {
    throw new Error(`Failed to confirm inquiry override: ${error.message}`);
  }

  return confirmedOverrideSchema.parse(data);
}

export async function cancelInquiryOverride(input: {
  confirmId: string;
  approverId: string;
  telegramUpdateId: number;
}): Promise<{ duplicate: boolean; applied: boolean; status: string | null }> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "cancel_inquiry_override",
    {
      p_confirm_id: input.confirmId,
      p_approver_id: input.approverId,
      p_telegram_update_id: input.telegramUpdateId,
    },
  );

  if (error) {
    throw new Error(`Failed to cancel inquiry override: ${error.message}`);
  }

  return z
    .object({
      duplicate: z.boolean(),
      applied: z.boolean(),
      status: z.string().nullable(),
    })
    .parse(data);
}

// ---------------------------------------------------------------------------
// Suggest changes: the redraft loop
//
// Mirrors supabase/migrations/202608070002_suggest_change_requests.sql. The
// draft itself always lives in the target table, so nothing here caches it:
// `sourceDraft` is a snapshot for the prompt card, not the source of truth.
// ---------------------------------------------------------------------------

const suggestChangeTargetKindSchema = z.enum(["approval", "website_lead"]);

export type SuggestChangeTargetKind = z.infer<
  typeof suggestChangeTargetKindSchema
>;

const instructionHistorySchema = z.array(
  z.object({
    revision: z.number().int(),
    instructions: z.string(),
    recordedAt: z.string(),
  }),
);

export type SuggestChangeInstructionHistory = z.infer<
  typeof instructionHistorySchema
>;

const openedSuggestChangeSchema = z.discriminatedUnion("opened", [
  z.object({
    opened: z.literal(true),
    duplicate: z.boolean(),
    requestId: z.string().uuid(),
    targetKind: suggestChangeTargetKindSchema,
    targetName: z.string(),
    currentDraft: z.string(),
    revision: z.number().int(),
    // Opening cancels any other open request in the chat so the next voicenote
    // is unambiguous; these are the prompts that need repainting.
    supersededPrompts: z.array(
      z.object({
        requestId: z.string().uuid(),
        promptMessageId: z.number().int().nullable(),
      }),
    ),
  }),
  z.object({
    opened: z.literal(false),
    duplicate: z.boolean().default(false),
    reason: z.string().nullable(),
  }),
]);

export type OpenedSuggestChangeRequest = z.infer<
  typeof openedSuggestChangeSchema
>;

export async function openSuggestChangeRequest(input: {
  targetKind: SuggestChangeTargetKind;
  targetId: string;
  telegramChatId: number;
  requestedBy: string;
  telegramUpdateId: number;
}): Promise<OpenedSuggestChangeRequest> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "open_suggest_change_request",
    {
      p_target_kind: input.targetKind,
      p_target_id: input.targetId,
      p_telegram_chat_id: input.telegramChatId,
      p_requested_by: input.requestedBy,
      p_telegram_update_id: input.telegramUpdateId,
    },
  );

  if (error) {
    throw new Error(`Failed to open suggest-change request: ${error.message}`);
  }

  return openedSuggestChangeSchema.parse(data);
}

export async function attachSuggestChangePrompt(input: {
  requestId: string;
  promptMessageId: number;
}): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc(
    "attach_suggest_change_prompt",
    {
      p_request_id: input.requestId,
      p_prompt_message_id: input.promptMessageId,
    },
  );

  if (error) {
    throw new Error(`Failed to attach suggest-change prompt: ${error.message}`);
  }
}

const recordedSuggestChangeSchema = z.discriminatedUnion("bound", [
  z.object({
    bound: z.literal(true),
    duplicate: z.boolean(),
    requestId: z.string().uuid(),
    targetKind: suggestChangeTargetKindSchema,
    targetId: z.string().uuid(),
    revision: z.number().int(),
    sourceDraft: z.string().nullable(),
    instructionHistory: instructionHistorySchema,
  }),
  z.object({
    bound: z.literal(false),
    duplicate: z.boolean().default(false),
    // "no_open_request" means the message was not redraft instructions at all,
    // and the caller must fall through to the bare-message override path
    // rather than swallow it.
    reason: z.string().nullable(),
  }),
]);

export type RecordedSuggestChangeInstructions = z.infer<
  typeof recordedSuggestChangeSchema
>;

// The request-less bind: whatever is newest and waiting in the chat gets the
// instructions. Correct only for a bare message that carries nothing tying it
// to a request; anything that knows its request id must use
// `bindSuggestChangeInstructions` instead, or a voicenote recorded for one
// customer can be applied to another.
export async function recordSuggestChangeInstructions(input: {
  telegramChatId: number;
  instructions: string;
  requestedBy: string;
  telegramUpdateId: number;
}): Promise<RecordedSuggestChangeInstructions> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "record_suggest_change_instructions",
    {
      p_telegram_chat_id: input.telegramChatId,
      p_instructions: input.instructions,
      p_requested_by: input.requestedBy,
      p_telegram_update_id: input.telegramUpdateId,
    },
  );

  if (error) {
    throw new Error(
      `Failed to record suggest-change instructions: ${error.message}`,
    );
  }

  return recordedSuggestChangeSchema.parse(data);
}

/**
 * Bind instructions to the request they were recorded against, or to nothing.
 *
 * The chat's newest open request is NOT a safe fallback. Luke taps ✏️ on
 * customer A, talks, then taps ✏️ on customer B while the transcript is still
 * being made; binding to "newest" would rewrite B's draft with A's words.
 * `reason` comes back as 'request_superseded' (or 'request_not_found') in that
 * case, and the caller must stop rather than redraft.
 */
export async function bindSuggestChangeInstructions(input: {
  requestId: string;
  telegramChatId: number;
  instructions: string;
  requestedBy: string;
  telegramUpdateId: number;
}): Promise<RecordedSuggestChangeInstructions> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "bind_suggest_change_instructions",
    {
      p_telegram_chat_id: input.telegramChatId,
      p_instructions: input.instructions,
      p_requested_by: input.requestedBy,
      p_telegram_update_id: input.telegramUpdateId,
      p_request_id: input.requestId,
    },
  );

  if (error) {
    throw new Error(
      `Failed to bind suggest-change instructions: ${error.message}`,
    );
  }

  return recordedSuggestChangeSchema.parse(data);
}

const completedSuggestChangeSchema = z.discriminatedUnion("completed", [
  z.object({
    completed: z.literal(true),
    reason: z.null(),
    requestId: z.string().uuid(),
    targetKind: suggestChangeTargetKindSchema,
    targetId: z.string().uuid(),
    revision: z.number().int(),
  }),
  z.object({
    completed: z.literal(false),
    reason: z.string().nullable(),
  }),
]);

export type CompletedSuggestChangeRequest = z.infer<
  typeof completedSuggestChangeSchema
>;

/**
 * Write the redraft into the target table.
 *
 * Called BEFORE the new card is posted, which is why no card id is passed: the
 * card's Approve button must never offer text the target does not already
 * contain. `attachSuggestChangeCard` stitches the id on afterwards, exactly as
 * `attachSuggestChangePrompt` does for the prompt. The SQL keeps its
 * `p_card_message_id` argument (a null is passed) so the shipped signature is
 * unchanged.
 */
export async function completeSuggestChangeRequest(input: {
  requestId: string;
  newDraft: string;
}): Promise<CompletedSuggestChangeRequest> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "complete_suggest_change_request",
    {
      p_request_id: input.requestId,
      p_new_draft: input.newDraft,
      p_card_message_id: null,
    },
  );

  if (error) {
    throw new Error(
      `Failed to complete suggest-change request: ${error.message}`,
    );
  }

  return completedSuggestChangeSchema.parse(data);
}

const attachedSuggestChangeCardSchema = z.object({
  attached: z.boolean(),
  // Whether the target's own card pointer moved to this card. False when the
  // approval or lead stopped being actionable while the card was in flight.
  repointed: z.boolean(),
});

/**
 * Record the redraft card and point the target at it.
 *
 * Every reply-to-card gesture resolves through the target's stored card id, so
 * leaving it on the card the redraft replaced makes a typed correction
 * swipe-replied to the newest card match nothing and vanish without a word.
 */
export async function attachSuggestChangeCard(input: {
  requestId: string;
  cardMessageId: number;
}): Promise<z.infer<typeof attachedSuggestChangeCardSchema>> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "attach_suggest_change_card",
    {
      p_request_id: input.requestId,
      p_card_message_id: input.cardMessageId,
    },
  );

  if (error) {
    throw new Error(`Failed to attach suggest-change card: ${error.message}`);
  }

  return attachedSuggestChangeCardSchema.parse(data);
}

const retiredSuggestChangeCardSchema = z.object({
  recorded: z.boolean(),
  reason: z.string().nullable().default(null),
});

/**
 * Remember which card is losing its Approve button, before it loses it.
 *
 * Approve sends what the TARGET holds, so a redraft has to strip the old card's
 * Approve before it writes. If the write then dies, that button is gone and
 * nothing in the chat can accept a draft that is still perfectly good. These
 * coordinates are the only unambiguous record of which message to repair:
 * `attach_suggest_change_card` moves the target's own pointer to the newest
 * card, so by recovery time the pointer may name a different message entirely.
 *
 * Called BEFORE the Telegram edit. A record that lands for a button that is
 * still there costs one no-op edit later; a button stripped with nothing
 * recorded is the unrecoverable state.
 *
 * `recorded` false means the request left 'drafting' and the caller must NOT
 * strip the button: the write is going to be refused anyway.
 */
export async function recordRetiredSuggestChangeCard(input: {
  requestId: string;
  chatId: number;
  messageId: number;
}): Promise<z.infer<typeof retiredSuggestChangeCardSchema>> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "record_retired_suggest_change_card",
    {
      p_request_id: input.requestId,
      p_chat_id: input.chatId,
      p_message_id: input.messageId,
    },
  );

  if (error) {
    throw new Error(
      `Failed to record the retired suggest-change card: ${error.message}`,
    );
  }

  return retiredSuggestChangeCardSchema.parse(data);
}

/**
 * Stop offering a card to the restore sweep.
 *
 * Two callers, one meaning. After a SUCCESSFUL redraft, because the revision is
 * written and its own new card carries the live Approve, so the old card is
 * meant to stay retired for good. After a SUCCESSFUL restore, so the cron stops
 * re-editing a keyboard that is already right.
 */
export async function clearRetiredSuggestChangeCard(
  requestId: string,
): Promise<{ cleared: boolean }> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "clear_retired_suggest_change_card",
    { p_request_id: requestId },
  );

  if (error) {
    throw new Error(
      `Failed to clear the retired suggest-change card: ${error.message}`,
    );
  }

  return z.object({ cleared: z.boolean() }).parse(data);
}

const reopenedSuggestChangeSchema = z.object({
  reopened: z.boolean(),
  previousStatus: z.string().nullable(),
  // Added by 202608070007, so the caller can put the stripped Approve button
  // back in the same breath as it reopens the request instead of waiting for
  // the cron. Optional throughout: a database still on the 202608070004
  // definition returns none of these keys, and a request that never got as far
  // as stripping a button returns them null.
  //
  // The SQL withholds the card coordinates when the request is 'completed',
  // because a completed redraft wrote a revision and its old Approve must stay
  // retired. Absent therefore means "nothing to restore", in both senses.
  targetKind: suggestChangeTargetKindSchema.nullable().optional(),
  targetId: z.string().uuid().nullable().optional(),
  retiredCardChatId: z.string().nullable().optional(),
  retiredCardMessageId: z.number().int().nullable().optional(),
});

/**
 * Roll a redraft that never finished back out of 'drafting'.
 *
 * The bind burns the Telegram update id, so a task that dies after binding
 * cannot re-bind on a retry: without this the request sits in 'drafting' until
 * it expires 24 hours later, and every voicenote Luke sends meanwhile is
 * answered "I'm still redrafting from your last note".
 *
 * It also hands back the card whose Approve button that dead redraft stripped,
 * so the caller can put the keyboard back immediately rather than waiting for
 * the reconcile sweep. Withheld when the request is 'completed', because then a
 * revision WAS written and the old Approve has to stay retired.
 */
export async function reopenSuggestChangeRequest(
  requestId: string,
): Promise<z.infer<typeof reopenedSuggestChangeSchema>> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "reopen_suggest_change_request",
    { p_request_id: requestId },
  );

  if (error) {
    throw new Error(`Failed to reopen suggest-change request: ${error.message}`);
  }

  return reopenedSuggestChangeSchema.parse(data);
}

export async function cancelSuggestChangeRequest(input: {
  requestId: string;
  requestedBy: string;
  telegramUpdateId: number;
}): Promise<{ duplicate: boolean; cancelled: boolean; status: string | null }> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "cancel_suggest_change_request",
    {
      p_request_id: input.requestId,
      p_requested_by: input.requestedBy,
      p_telegram_update_id: input.telegramUpdateId,
    },
  );

  if (error) {
    throw new Error(`Failed to cancel suggest-change request: ${error.message}`);
  }

  return z
    .object({
      duplicate: z.boolean(),
      cancelled: z.boolean(),
      status: z.string().nullable(),
    })
    .parse(data);
}

const openSuggestChangeRequestSchema = z.object({
  requestId: z.string().uuid(),
  targetKind: suggestChangeTargetKindSchema,
  targetId: z.string().uuid(),
  status: z.enum(["awaiting_instructions", "drafting"]),
  revision: z.number().int(),
  sourceDraft: z.string().nullable(),
  instructions: z.string().nullable(),
  instructionHistory: instructionHistorySchema,
  promptMessageId: z.number().int().nullable(),
  expiresAt: z.string(),
});

export type OpenSuggestChangeRequest = z.infer<
  typeof openSuggestChangeRequestSchema
>;

export async function getOpenSuggestChangeRequest(
  telegramChatId: number,
): Promise<OpenSuggestChangeRequest | null> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "get_open_suggest_change_request",
    { p_telegram_chat_id: telegramChatId },
  );

  if (error) {
    throw new Error(
      `Failed to load the open suggest-change request: ${error.message}`,
    );
  }

  return data === null ? null : openSuggestChangeRequestSchema.parse(data);
}

// The customer behind the draft being revised.
//
// Mirrors supabase/migrations/202608070006_redraft_safety_fixes.sql, which
// supersedes the 202608070005 definition.
// A pure read: it takes no claim and no lease, because the redraft already
// holds the only claim that matters (the request row is 'drafting') and the
// target itself is legitimately pending for whoever taps Approve next.
//
// `availabilityFact` on the approval branch is the reason this exists. Luke's
// answer to "Are you available on {date}?" is what licenses the draft to state
// availability at all; a redraft that loses it quietly rewrites his confirmed
// yes into "he'll check and come back to you".
const suggestChangeTargetContextSchema = z.union([
  z.object({
    found: z.literal(true),
    targetKind: z.literal("approval"),
    targetId: z.string().uuid(),
    targetName: z.string(),
    conversationId: z.string().uuid(),
    batchKey: z.string(),
    messageIds: z.array(z.string().uuid()),
    // The card whose Approve button is about to start offering the revision
    // instead of the text it prints. The caller retires that button before it
    // writes, so the three states have to stay distinguishable: a number is a
    // live card to retire, `null` is a target that carries no card at all
    // (nothing to retire), and `undefined` is a database still on the
    // 202608070005 definition, which does not return the key. Optional rather
    // than defaulted for that last case: silently reading "no card" off a
    // lagging database is how the button stays live.
    cardChatId: z.string().nullable().optional(),
    cardMessageId: z.number().int().nullable().optional(),
    // The intents the FIRST draft retrieved its learned corrections against,
    // so the revision retrieves the same ones. The SQL coalesces a run with no
    // stored intents to `[]`; the default here covers the same shape arriving
    // from a database still on the 202608070003 definition, where losing the
    // whole parse would also lose `availabilityFact` — a far worse trade than
    // redrafting with no examples.
    intents: z.array(z.string()).default([]),
    // The slugs still attached to this draft. A redraft rewrites the words
    // only, so these send when Approve is tapped on the revision card and the
    // card has to name them. Same default, same reason.
    proposedMediaSlugs: z.array(z.string()).default([]),
    availabilityFact: z
      .object({
        availability: z.enum(["available", "unavailable"]),
        dateText: z.string().nullable(),
      })
      .nullable(),
  }),
  z.object({
    found: z.literal(true),
    targetKind: z.literal("website_lead"),
    targetId: z.string().uuid(),
    targetName: z.string(),
    // Same three states as the approval branch above, for the same reason: the
    // lead's review card carries an Approve button that sends whatever the
    // lead row holds when it is tapped.
    cardChatId: z.string().nullable().optional(),
    cardMessageId: z.number().int().nullable().optional(),
    // Same object `claimWebsiteLeadDraft` parses, so the redraft prompt gets
    // the full form enquiry including the decided availability.
    lead: websiteLeadDetailsSchema,
  }),
  z.object({
    found: z.literal(false),
    // 'request_not_found' | 'target_not_found' | 'target_not_actionable'
    reason: z.string().nullable(),
  }),
]);

export type SuggestChangeTargetContext = z.infer<
  typeof suggestChangeTargetContextSchema
>;

export async function getSuggestChangeTargetContext(
  requestId: string,
): Promise<SuggestChangeTargetContext> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "get_suggest_change_target_context",
    { p_request_id: requestId },
  );

  if (error) {
    throw new Error(
      `Failed to load suggest-change target context: ${error.message}`,
    );
  }

  return suggestChangeTargetContextSchema.parse(data);
}
