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

export const inquiryExtractionSchema = z.object({
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
});

export type InquiryExtraction = z.infer<typeof inquiryExtractionSchema>;

export const inquiryDraftSchema = z.object({
  draft_messages: z.array(z.string().min(1).max(1_500)).min(1).max(3),
  proposed_media_slugs: z.array(z.string()).max(2),
});

export type InquiryDraft = z.infer<typeof inquiryDraftSchema>;

// Multi-bubble replies are stored as one string joined by a lone "---" line,
// so the approval tables, override flow, and exact-text guarantee stay
// unchanged. Overrides may use the same delimiter to split into bubbles.
export const BUBBLE_DELIMITER = "\n---\n";

export function splitReplyBubbles(reply: string): string[] {
  return reply
    .split(/\n\s*---\s*\n/)
    .map((bubble) => bubble.trim())
    .filter((bubble) => bubble.length > 0);
}

// Stored analysis = extraction + draft. proposed_media_slugs defaults so
// analyses recorded before the media feature still parse.
export const inquiryAnalysisSchema = inquiryExtractionSchema.extend({
  draft_reply: z.string().min(1).max(1_500),
  proposed_media_slugs: z.array(z.string()).default([]),
});

export type InquiryAnalysis = z.infer<typeof inquiryAnalysisSchema>;

export const brainDocRowSchema = z.object({
  slug: z.string(),
  title: z.string(),
  category: z.string(),
  content: z.string(),
});

export type BrainDocRow = z.infer<typeof brainDocRowSchema>;

export const replyExampleRowSchema = z.object({
  kind: z.enum(["past_chat", "override", "manual"]),
  customer_message: z.string(),
  situation_summary: z.string().nullable(),
  rejected_draft: z.string().nullable(),
  reply: z.string(),
});

export type ReplyExampleRow = z.infer<typeof replyExampleRowSchema>;

export const mediaAssetRowSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  media_type: z.enum(["image", "video", "document", "audio"]),
  url: z.string(),
  mime_type: z.string().nullable(),
});

export type MediaAssetRow = z.infer<typeof mediaAssetRowSchema>;

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

// message.sent: fired for API sends and, on Coexistence numbers, for replies
// typed in the WhatsApp Business app. Same envelope as message.received; the
// sender is the business so only its id is guaranteed.
export const zernioMessageSentSchema = z
  .object({
    id: z.string(),
    event: z.literal("message.sent"),
    message: z
      .object({
        id: z.string(),
        conversationId: z.string(),
        platform: z.literal("whatsapp"),
        platformMessageId: z.string(),
        direction: z.literal("outgoing"),
        text: z.string().nullable(),
        attachments: z.array(zernioAttachmentSchema).default([]),
        sentAt: z.string().nullable().optional(),
      })
      .passthrough(),
    conversation: z.object({ id: z.string() }).passthrough(),
    account: z
      .object({
        id: z.string(),
        accountId: z.string().nullish(),
      })
      .passthrough(),
    timestamp: z.string(),
  })
  .passthrough();

export type ZernioMessageSent = z.infer<typeof zernioMessageSentSchema>;

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

// A plain message in the approval group. Only replies to a review card from an
// authorised approver are acted on (reject-override flow); everything else is
// acknowledged with 200 and ignored so Telegram does not retry.
export const telegramMessageUpdateSchema = z.object({
  update_id: z.number().int(),
  message: z.object({
    message_id: z.number().int(),
    from: z.object({
      id: z.number().int(),
    }),
    chat: z.object({
      id: z.number().int(),
    }),
    text: z.string().optional(),
    // A voicenote arrives with no `text`, so without these it parses as an
    // empty message and is silently discarded. `mime_type` and `duration` are
    // set by the sending client and are not verified by Telegram, so they are
    // captured for logging only — never trusted for format decisions.
    voice: z
      .object({
        file_id: z.string(),
        duration: z.number().int(),
        mime_type: z.string().optional(),
        file_size: z.number().int().optional(),
      })
      .optional(),
    // Some clients send a held-mic recording as `audio` instead of `voice`.
    audio: z
      .object({
        file_id: z.string(),
        duration: z.number().int(),
        mime_type: z.string().optional(),
        file_size: z.number().int().optional(),
      })
      .optional(),
    // Round video messages carry the same speech; the Bot API's VideoNote has
    // no mime_type field.
    video_note: z
      .object({
        file_id: z.string(),
        duration: z.number().int(),
        file_size: z.number().int().optional(),
      })
      .optional(),
    reply_to_message: z
      .object({
        message_id: z.number().int(),
      })
      .optional(),
  }),
});

export type TelegramMessageUpdate = z.infer<
  typeof telegramMessageUpdateSchema
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

export const websiteLeadTaskPayloadSchema = z.object({
  leadId: z.string().uuid(),
});

export const availabilityQuestionTaskPayloadSchema = z.object({
  checkId: z.string().uuid(),
});

// Luke's tap on an Available / Unavailable button, injected into the drafting
// prompt as the one human-confirmed fact allowed to override the availability
// policy.
export type AvailabilityFact = {
  availability: "available" | "unavailable";
  dateText: string | null;
};

// A website-lead draft is a single WhatsApp message by construction: it is
// delivered as a prefilled wa.me link, which cannot carry bubbles or media,
// and long messages would blow Telegram's URL-button length budget.
export const websiteLeadDraftSchema = z.object({
  draft_message: z.string().min(1).max(700),
});

export type WebsiteLeadDraft = z.infer<typeof websiteLeadDraftSchema>;

// The lead fields the drafting prompt and review card render, as returned by
// the website-lead claim RPCs.
export const websiteLeadDetailsSchema = z.object({
  leadId: z.string().uuid(),
  source: z.enum(["lead_form", "contact_form"]),
  firstName: z.string(),
  lastName: z.string().nullable(),
  eventType: z.string().nullable(),
  eventDateText: z.string().nullable(),
  dateFlexible: z.boolean().nullable(),
  location: z.string().nullable(),
  guestCount: z.number().int().nullable(),
  performanceMinutes: z.number().int().nullable(),
  bookerRole: z.string().nullable(),
  message: z.string().nullable(),
  notes: z.string().nullable(),
  availability: z.enum(["available", "unavailable"]).nullable(),
  whatsappDigits: z.string().nullable(),
});

export type WebsiteLeadDetails = z.infer<typeof websiteLeadDetailsSchema>;

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
    | "inquiry.response_approved"
    | "inquiry.availability_requested"
    | "inquiry.availability_answered"
    | "inquiry.redraft_requested"
    | "website_lead.availability_decided";
  aggregateId: string;
  payload: Record<string, unknown>;
  claimToken: string;
};
