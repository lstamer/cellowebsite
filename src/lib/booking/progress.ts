import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

import { BOOKER_ROLES, EVENT_TYPES } from "@/lib/booking/build-message";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function storedText(max: number) {
  // PostgreSQL text and JSONB cannot represent a NUL or an unpaired surrogate.
  return z.string().max(max).refine((text) => !text.includes("\0") && text.isWellFormed());
}

function hasBookerRole(snapshot: BookingSnapshot): boolean {
  return snapshot.bookerRole !== "" &&
    (snapshot.bookerRole !== "other" || Boolean(snapshot.bookerRoleOther.trim()));
}

export const bookingSnapshotSchema = z.strictObject({
  eventType: z.enum(["", ...EVENT_TYPES]),
  eventTypeOther: storedText(100),
  date: z.union([z.literal(""), z.iso.date()]),
  dateUnsure: z.boolean(),
  // Google Places may return a longer address than the manual input allows.
  location: storedText(300).refine((text) => Boolean(text.trim())),
  fullName: storedText(200).refine((text) => Boolean(text.trim())),
  email: storedText(254).refine((text) => emailPattern.test(text.trim())),
  phone: storedText(40),
  whatsappSameAsPhone: z.boolean(),
  whatsapp: storedText(40),
  guestCount: z.number().int().min(1).max(200).nullable(),
  performanceMinutes: z.number().int().min(30).max(180),
  message: storedText(2_000),
  bookingOnBehalf: z.boolean(),
  organisation: storedText(150),
  bookerRole: z.enum(["", ...BOOKER_ROLES.map(({ value }) => value)]),
  bookerRoleOther: storedText(100),
}).superRefine((snapshot, ctx) => {
  if (!snapshot.eventType || (snapshot.eventType === "other" && !snapshot.eventTypeOther.trim())) {
    ctx.addIssue({ code: "custom", path: ["eventType"], message: "Choose an event type" });
  }
  if (!snapshot.dateUnsure && !snapshot.date) {
    ctx.addIssue({ code: "custom", path: ["date"], message: "Choose an event date" });
  }
  const phone = snapshot.phone.trim();
  if (phone && !isValidPhoneNumber(phone)) {
    ctx.addIssue({ code: "custom", path: ["phone"], message: "Invalid phone number" });
  }
  const whatsapp = snapshot.whatsapp.trim();
  if (!snapshot.whatsappSameAsPhone && whatsapp && !isValidPhoneNumber(whatsapp)) {
    ctx.addIssue({ code: "custom", path: ["whatsapp"], message: "Invalid WhatsApp number" });
  }
});

export type BookingSnapshot = z.infer<typeof bookingSnapshotSchema>;

export const completedBookingSnapshotSchema = bookingSnapshotSchema.refine(hasBookerRole, {
  path: ["bookerRole"],
  message: "Choose a role",
});

const bookingDraftEventSchema = z.strictObject({
  id: z.uuidv4(),
  action: z.enum(["whatsapp", "email", "email_app", "gmail", "email_copy"]),
  source: z.enum(["ai", "template"]),
  subject: storedText(200).refine((text) => Boolean(text.trim()) && !/[\r\n]/.test(text)).nullable(),
  body: storedText(6_000).refine((text) => Boolean(text.trim())),
}).refine(
  ({ action, subject }) => action === "whatsapp" ? subject === null : subject !== null,
  { path: ["subject"], message: "Invalid subject for the selected channel" },
);

export type BookingDraftEvent = z.infer<typeof bookingDraftEventSchema>;

export const bookingProgressSchema = z.strictObject({
  attemptId: z.uuidv4(),
  revision: z.number().int().min(1).max(2_147_483_647),
  step: z.union([z.literal(1), z.literal(2)]),
  snapshot: bookingSnapshotSchema,
  sessionId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).nullable(),
  event: bookingDraftEventSchema.optional(),
}).superRefine(({ step, snapshot, event }, ctx) => {
  if (step === 1 && event) {
    ctx.addIssue({ code: "custom", path: ["event"], message: "Draft actions require a completed form" });
  }
  if (step === 2 && !hasBookerRole(snapshot)) {
    ctx.addIssue({ code: "custom", path: ["snapshot", "bookerRole"], message: "Choose a role" });
  }
});

export type BookingProgress = z.infer<typeof bookingProgressSchema>;
