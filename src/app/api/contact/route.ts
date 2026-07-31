import {
  createAttioNote,
  patchAttioPersonOptional,
  upsertAttioPerson,
} from "@/lib/attio";
import { sendTelegramLeadAlert } from "@/lib/inquiries/telegram";
import { NextRequest, NextResponse } from "next/server";

interface ContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  inquiryType: string;
  message: string;
  phone?: string;
}

const INQUIRY_LABELS: Record<string, string> = {
  wedding: "Wedding",
  "private-event": "Private event",
  "corporate-event": "Corporate event",
  fundraiser: "Fundraiser or tribute",
  other: "Other event",
};

function getInquiryLabel(inquiryType: string) {
  return INQUIRY_LABELS[inquiryType] ?? (inquiryType || "General inquiry");
}

function buildNoteMarkdown(payload: ContactPayload) {
  const fullName = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();
  const inquiryLabel = getInquiryLabel(payload.inquiryType);

  return [
    "## Home page contact form",
    "",
    `**Submitted:** ${new Date().toISOString()}`,
    "",
    "### Contact",
    "",
    `- **Name:** ${fullName || "Not provided"}`,
    `- **Email:** ${payload.email.trim()}`,
    `- **Phone:** ${payload.phone?.trim() || "Not provided"}`,
    `- **Inquiry type:** ${inquiryLabel}`,
    "",
    "### Message",
    "",
    payload.message.trim() || "_Not provided_",
  ].join("\n");
}

function buildInquiryDetailsText(payload: ContactPayload) {
  const fullName = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();
  const lines = [
    `Home page inquiry — ${getInquiryLabel(payload.inquiryType)}`,
    `Submitted: ${new Date().toISOString()}`,
    ``,
    `Name: ${fullName || "Not provided"}`,
    `Email: ${payload.email.trim()}`,
    `Phone: ${payload.phone?.trim() || "Not provided"}`,
    `Inquiry type: ${getInquiryLabel(payload.inquiryType)}`,
    ``,
    `Message:`,
    payload.message.trim() || "Not provided",
  ];

  return lines.join("\n");
}

function buildAttioPersonValues(payload: ContactPayload): Record<string, unknown> {
  const firstName = payload.firstName.trim();
  const lastName = payload.lastName.trim();
  const fullName = `${firstName} ${lastName}`.trim();

  const values: Record<string, unknown> = {
    description: `Home page inquiry — ${getInquiryLabel(payload.inquiryType)}`,
    pipeline_stage: "inquired",
    from_website: "true",
  };

  if (firstName || lastName) {
    values.name = [
      {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName || firstName || lastName,
      },
    ];
  }

  if (payload.phone?.trim()) {
    values.phone_numbers = [payload.phone.trim()];
  }

  return values;
}

async function sendTelegramNotification(payload: ContactPayload) {
  const fullName =
    `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim() || "Unknown";
  const phone = payload.phone?.trim() ?? "";

  const lines = [
    "🎻 New inquiry from stamer.co.za (home page form)",
    "",
    `👤 Name: ${fullName}`,
    `🎉 Inquiry type: ${getInquiryLabel(payload.inquiryType)}`,
    `✉️ Email: ${payload.email.trim()}`,
  ];

  if (phone) {
    lines.push(`📞 Phone: ${phone}`);
  }
  if (payload.message.trim()) {
    lines.push("", `💬 Message: ${payload.message.trim()}`);
  }

  const replyDigits = phone.replace(/\D/g, "");

  await sendTelegramLeadAlert({
    text: lines.join("\n"),
    replyUrl: replyDigits ? `https://wa.me/${replyDigits}` : undefined,
    replyLabel: `Message ${payload.firstName.trim() || "them"} on WhatsApp`,
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ContactPayload;
  const { firstName, lastName, email, inquiryType, message, phone } = body;

  if (!firstName || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const attioApiKey = process.env.ATTIO_API_KEY ?? process.env.ATTIO_CRM_KEY;
  if (!attioApiKey) {
    console.error("ATTIO_API_KEY / ATTIO_CRM_KEY missing");
    return NextResponse.json({ error: "CRM not configured" }, { status: 500 });
  }

  let personId: string;
  try {
    personId = await upsertAttioPerson(
      buildAttioPersonValues({ firstName, lastName, email, inquiryType, message, phone }),
      email,
      attioApiKey,
    );
  } catch (error) {
    console.error("Attio person upsert error:", error);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }

  await patchAttioPersonOptional(
    personId,
    {
      inquiry_details: buildInquiryDetailsText({
        firstName,
        lastName,
        email,
        inquiryType,
        message,
        phone,
      }),
    },
    attioApiKey,
  );
  await createAttioNote(
    personId,
    `Home page inquiry — ${getInquiryLabel(inquiryType)}`,
    buildNoteMarkdown({ firstName, lastName, email, inquiryType, message, phone }),
    attioApiKey,
  );
  await sendTelegramNotification({
    firstName,
    lastName,
    email,
    inquiryType,
    message,
    phone,
  });

  return NextResponse.json({ success: true });
}
