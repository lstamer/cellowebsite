import { NextRequest, NextResponse } from "next/server";

interface ContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  inquiryType: string;
  message: string;
  phone?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ContactPayload;
  const { firstName, lastName, email, inquiryType, message, phone } = body;

  if (!firstName || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const token = process.env.HUBSPOT_API_KEY;
  if (!token) {
    return NextResponse.json({ error: "HubSpot not configured" }, { status: 500 });
  }

  // Upsert contact in HubSpot
  const contactRes = await fetch(
    "https://api.hubapi.com/crm/v3/objects/contacts",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        properties: {
          firstname: firstName,
          lastname: lastName,
          email,
          phone: phone ?? "",
          // Store inquiry type in a custom or built-in property
          hs_lead_status: "NEW",
          message: `[${inquiryType.toUpperCase()}] ${message}`,
        },
      }),
    }
  );

  let contactId: string | null = null;

  if (contactRes.ok) {
    const contactData = await contactRes.json();
    contactId = contactData.id;
  } else if (contactRes.status === 409) {
    // Contact already exists — fetch their ID
    const existing = await contactRes.json();
    contactId = existing.message?.match(/ID: (\d+)/)?.[1] ?? null;
  } else {
    const err = await contactRes.json();
    console.error("HubSpot contact error:", err);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }

  // Create a Note on the contact
  if (contactId) {
    const noteBody = `Inquiry type: ${inquiryType}\n\n${message}`;
    await fetch("https://api.hubapi.com/crm/v3/objects/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        properties: {
          hs_note_body: noteBody,
          hs_timestamp: new Date().toISOString(),
        },
        associations: [
          {
            to: { id: contactId },
            types: [
              {
                associationCategory: "HUBSPOT_DEFINED",
                associationTypeId: 202, // Note → Contact
              },
            ],
          },
        ],
      }),
    });
  }

  return NextResponse.json({ success: true });
}
