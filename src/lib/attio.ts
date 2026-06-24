const ATTIO_BASE = "https://api.attio.com/v2";

interface AttioRecordResponse {
  data?: { id?: { record_id?: string } };
}

interface AttioErrorJson {
  code?: string;
  message?: string;
}

export function normalizeAttioEmail(email: string): string {
  return email.trim().toLowerCase();
}

function attioHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function extractConflictRecordId(errorBody: string): string | null {
  let message = errorBody;
  try {
    const parsed = JSON.parse(errorBody) as AttioErrorJson;
    if (parsed.message) message = parsed.message;
    if (parsed.code !== "uniqueness_conflict") return null;
  } catch {
    // Plain-text error body
  }

  const match = message.match(/Conflicting record IDs:\s*([a-f0-9-]+)/i);
  return match?.[1] ?? null;
}

async function readRecordId(res: Response): Promise<string> {
  const json = (await res.json()) as AttioRecordResponse;
  const recordId = json.data?.id?.record_id;
  if (!recordId) {
    throw new Error("Attio response returned no record_id");
  }
  return recordId;
}

async function patchAttioPerson(
  recordId: string,
  values: Record<string, unknown>,
  apiKey: string,
): Promise<string> {
  const res = await fetch(`${ATTIO_BASE}/objects/people/records/${recordId}`, {
    method: "PATCH",
    headers: attioHeaders(apiKey),
    body: JSON.stringify({ data: { values } }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Attio patch failed: ${res.status} ${errorBody}`);
  }

  return readRecordId(res);
}

/**
 * Create or update a person in Attio, matched on email.
 * Falls back to patching the conflicting record when upsert matching misses.
 */
export async function upsertAttioPerson(
  values: Record<string, unknown>,
  email: string,
  apiKey: string,
): Promise<string> {
  const normalizedEmail = normalizeAttioEmail(email);
  const upsertValues: Record<string, unknown> = {
    ...values,
    email_addresses: [normalizedEmail],
  };

  const res = await fetch(
    `${ATTIO_BASE}/objects/people/records?matching_attribute=email_addresses`,
    {
      method: "POST",
      headers: attioHeaders(apiKey),
      body: JSON.stringify({ data: { values: upsertValues } }),
    },
  );

  if (res.ok) {
    return readRecordId(res);
  }

  const errorBody = await res.text();
  const conflictRecordId = extractConflictRecordId(errorBody);

  if (res.status === 400 && conflictRecordId) {
    const { email_addresses: _email, ...updateValues } = upsertValues;
    return patchAttioPerson(conflictRecordId, updateValues, apiKey);
  }

  throw new Error(`Attio upsert failed: ${res.status} ${errorBody}`);
}

/**
 * Best-effort attribute write that never throws. Use for optional attributes
 * (e.g. custom fields that may not exist in every workspace, such as
 * `inquiry_details`) so a failure can't break lead capture.
 */
export async function patchAttioPersonOptional(
  recordId: string,
  values: Record<string, unknown>,
  apiKey: string,
): Promise<void> {
  try {
    await patchAttioPerson(recordId, values, apiKey);
  } catch (error) {
    console.error("Attio optional patch failed:", error);
  }
}

export async function createAttioNote(
  personId: string,
  title: string,
  content: string,
  apiKey: string,
): Promise<void> {
  const res = await fetch(`${ATTIO_BASE}/notes`, {
    method: "POST",
    headers: attioHeaders(apiKey),
    body: JSON.stringify({
      data: {
        parent_object: "people",
        parent_record_id: personId,
        title,
        format: "markdown",
        content,
      },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Attio note creation failed:", res.status, errorBody);
  }
}
