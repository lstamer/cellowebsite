import { z } from "zod";

export const inquiryIntentSchema = z.enum([
  "availability",
  "pricing",
  "booking_process",
  "event_details",
  "repertoire",
  "media_request",
  "technical_requirements",
  "referral",
  "greeting",
  "existing_booking",
  "other",
]);

export const inquirySourceSchema = z.enum([
  "cavendish_busking",
  "referral",
  "website",
  "unknown",
]);

export const riskFlagSchema = z.enum([
  "availability_unverified",
  "pricing_unverified",
  "existing_booking_change",
  "complaint_or_refund",
  "sensitive_or_ambiguous",
  "none",
]);

export const extractedEventDetailsSchema = z.object({
  contact_name: z.string().nullable(),
  organisation: z.string().nullable(),
  event_type: z.string().nullable(),
  event_date_text: z.string().nullable(),
  event_date_iso: z.string().nullable(),
  date_flexible: z.boolean().nullable(),
  event_time_text: z.string().nullable(),
  location: z.string().nullable(),
  venue: z.string().nullable(),
  guest_count: z.number().int().nonnegative().nullable(),
  duration_minutes: z.number().int().positive().nullable(),
  budget_text: z.string().nullable(),
  referred_by: z.string().nullable(),
  requirements: z.array(z.string()),
  questions: z.array(z.string()),
});

export const inquiryAnalysisSchema = z.object({
  intents: z.array(inquiryIntentSchema).min(1),
  primary_intent: inquiryIntentSchema,
  source: inquirySourceSchema,
  lead_temperature: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
  completeness: z.number().min(0).max(1),
  event: extractedEventDetailsSchema,
  missing_fields: z.array(z.string()),
  risk_flags: z.array(riskFlagSchema),
  summary: z.string().min(1).max(800),
  draft_reply: z.string().min(1).max(1_500),
});

export type InquiryAnalysis = z.infer<typeof inquiryAnalysisSchema>;

const zernioAttachmentSchema = z
  .object({
    type: z.string(),
    url: z.string(),
    payload: z.unknown().optional(),
  })
  .passthrough();

const zernioSenderSchema = z
  .object({
    id: z.string(),
    name: z.string().nullish(),
    username: z.string().nullish(),
    phoneNumber: z.string().nullish(),
    businessScopedUserId: z.string().nullish(),
    whatsappUsername: z.string().nullish(),
    contactId: z.string().nullish(),
  })
  .passthrough();

export const zernioMessageReceivedSchema = z
  .object({
    id: z.string(),
    event: z.literal("message.received"),
    message: z
      .object({
        id: z.string(),
        conversationId: z.string(),
        platform: z.literal("whatsapp"),
        platformMessageId: z.string(),
        direction: z.literal("incoming"),
        text: z.string().nullable(),
        attachments: z.array(zernioAttachmentSchema),
        sender: zernioSenderSchema,
        sentAt: z.string(),
        isRead: z.boolean(),
      })
      .passthrough(),
    conversation: z
      .object({
        id: z.string(),
        platformConversationId: z.string(),
        status: z.enum(["active", "archived"]),
        participantId: z.string().nullish(),
        participantName: z.string().nullish(),
        contactId: z.string().nullish(),
      })
      .passthrough(),
    account: z
      .object({
        id: z.string(),
        accountId: z.string().nullish(),
        platform: z.literal("whatsapp"),
        username: z.string(),
      })
      .passthrough(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
    timestamp: z.string(),
  })
  .passthrough();

export type ZernioMessageReceived = z.infer<
  typeof zernioMessageReceivedSchema
>;

export const telegramCallbackUpdateSchema = z.object({
  update_id: z.number().int(),
  callback_query: z.object({
    id: z.string(),
    from: z.object({
      id: z.number().int(),
    }),
    data: z.string(),
    message: z.object({
      message_id: z.number().int(),
      chat: z.object({
        id: z.number().int(),
      }),
    }),
  }),
});

export type TelegramCallbackUpdate = z.infer<
  typeof telegramCallbackUpdateSchema
>;

export const inquiryTaskPayloadSchema = z.object({
  conversationId: z.string().uuid(),
});

export const approvedResponseTaskPayloadSchema = z.object({
  approvalId: z.string().uuid(),
});

export const reviewNotificationTaskPayloadSchema = z.object({
  approvalId: z.string().uuid(),
});

export type InquiryMessageRow = {
  id: string;
  body: string | null;
  attachments: Array<{ type?: string; url?: string }>;
  occurred_at: string;
  sender_snapshot: Record<string, unknown>;
};

export type OutboxRow = {
  id: string;
  eventType:
    | "inquiry.message_received"
    | "inquiry.review_requested"
    | "inquiry.response_approved";
  aggregateId: string;
  payload: Record<string, unknown>;
  claimToken: string;
};
