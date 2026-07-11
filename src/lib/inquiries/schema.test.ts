import { describe, expect, it } from "vitest";

import {
  inquiryAnalysisSchema,
  zernioMessageReceivedSchema,
} from "./schema";

const baseEvent = {
  id: "event-1",
  event: "message.received",
  message: {
    id: "message-1",
    conversationId: "conversation-1",
    platform: "whatsapp",
    platformMessageId: "wamid.1",
    direction: "incoming",
    text: "Hi Luke, are you available on 14 November?",
    attachments: [],
    sender: {
      id: "27820000000",
      phoneNumber: "+27820000000",
      name: "Sam",
    },
    sentAt: "2026-07-11T09:00:00.000Z",
    isRead: false,
  },
  conversation: {
    id: "conversation-1",
    platformConversationId: "wa-conversation-1",
    status: "active",
    participantId: "27820000000",
  },
  account: {
    id: "account-1",
    accountId: "account-1",
    platform: "whatsapp",
    username: "stamer-cello",
  },
  timestamp: "2026-07-11T09:00:01.000Z",
};

describe("inquiry schemas", () => {
  it("accepts the documented Zernio WhatsApp inbound shape", () => {
    expect(zernioMessageReceivedSchema.parse(baseEvent).message.text).toContain(
      "14 November",
    );
  });

  it("rejects outgoing or non-WhatsApp events", () => {
    expect(
      zernioMessageReceivedSchema.safeParse({
        ...baseEvent,
        message: { ...baseEvent.message, direction: "outgoing" },
      }).success,
    ).toBe(false);
    expect(
      zernioMessageReceivedSchema.safeParse({
        ...baseEvent,
        message: { ...baseEvent.message, platform: "telegram" },
      }).success,
    ).toBe(false);
  });

  it("requires unknown event facts to remain nullable", () => {
    const result = inquiryAnalysisSchema.parse({
      intents: ["pricing"],
      primary_intent: "pricing",
      source: "unknown",
      lead_temperature: "medium",
      confidence: 0.8,
      completeness: 0.2,
      event: {
        contact_name: null,
        organisation: null,
        event_type: null,
        event_date_text: null,
        event_date_iso: null,
        date_flexible: null,
        event_time_text: null,
        location: null,
        venue: null,
        guest_count: null,
        duration_minutes: null,
        budget_text: null,
        referred_by: null,
        requirements: [],
        questions: ["How much do you charge?"],
      },
      missing_fields: ["event_date", "event_type", "location"],
      risk_flags: ["pricing_unverified"],
      summary: "A vague pricing enquiry with no event details yet.",
      draft_reply:
        "Thanks for reaching out. I can give you a proper figure once I know the event date, what you're planning, and where it will be.",
    });

    expect(result.event.event_date_iso).toBeNull();
    expect(result.event.location).toBeNull();
  });
});
