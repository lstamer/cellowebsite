import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { getSupabaseSecret, requireEnv } from "@/lib/inquiries/env";
import type {
  InquiryAnalysis,
  InquiryMessageRow,
  OutboxRow,
  ZernioMessageReceived,
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
      p_phone_e164: sender.phoneNumber ?? null,
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

const staleWorkSchema = z.object({
  staleSends: z.array(
    z.object({
      approvalId: z.string().uuid(),
      telegramChatId: z.string().nullable(),
      telegramMessageId: z.number().int().nullable(),
    }),
  ),
  staleReviews: z.number().int(),
  staleOutbox: z.number().int(),
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
