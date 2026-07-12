// Smoke test for the inbound WhatsApp inquiry pipeline.
//
//   node scripts/smoke-inquiry.mjs [--url=http://localhost:3000] [--wait=90] [--keep] [--text="..."]
//
// Sends an HMAC-signed synthetic Zernio message.received event to the webhook,
// verifies the Supabase side-effects (ingest, dedupe, outbox), optionally waits
// for the AI analysis + Telegram approval request, then deletes the synthetic
// rows unless --keep is passed. Requires ZERNIO_WEBHOOK_SECRET, SUPABASE_URL and
// SUPABASE_SECRET_KEY in .env.local (or the environment).

import { createHmac, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

function loadEnvLocal() {
  let text = "";
  try {
    text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^"|"$/g, "");
    }
  }
}

loadEnvLocal();

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, "").split("=");
    return [k, rest.length ? rest.join("=") : true];
  }),
);

const baseUrl = typeof args.url === "string" ? args.url : "http://localhost:3000";
const waitSeconds = args.wait !== undefined ? Number(args.wait) : 90;
const keep = Boolean(args.keep);
const text =
  typeof args.text === "string"
    ? args.text
    : "Hi Luke! I saw you playing at Cavendish. How much do you charge for a wedding in Stellenbosch on 12 September?";

const secret = process.env.ZERNIO_WEBHOOK_SECRET;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!secret || !supabaseUrl || !supabaseKey) {
  console.error(
    "Missing ZERNIO_WEBHOOK_SECRET, SUPABASE_URL or SUPABASE_SECRET_KEY",
  );
  process.exit(1);
}

const runId = randomUUID().slice(0, 8);
const now = new Date().toISOString();
const event = {
  id: `smoke-evt-${runId}`,
  event: "message.received",
  message: {
    id: `smoke-msg-${runId}`,
    conversationId: `smoke-conv-${runId}`,
    platform: "whatsapp",
    platformMessageId: `smoke-wamid-${runId}`,
    direction: "incoming",
    text,
    attachments: [],
    sender: {
      id: `smoke-sender-${runId}`,
      name: "Smoke Test",
      phoneNumber: "+27000000000",
      whatsappUsername: `smoke-${runId}`,
    },
    sentAt: now,
    isRead: false,
  },
  conversation: {
    id: `smoke-conv-${runId}`,
    platformConversationId: `smoke-pconv-${runId}`,
    status: "active",
    participantName: "Smoke Test",
  },
  account: {
    id: "smoke-account",
    platform: "whatsapp",
    username: "stamer",
  },
  timestamp: now,
};

const rawBody = JSON.stringify(event);
const signature = createHmac("sha256", secret).update(rawBody).digest("hex");

async function postEvent(label) {
  const response = await fetch(`${baseUrl}/api/webhooks/zernio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-zernio-signature": signature,
    },
    body: rawBody,
  });
  const body = await response.json().catch(() => ({}));
  console.log(`${label}: HTTP ${response.status} ${JSON.stringify(body)}`);
  return { status: response.status, body };
}

async function supabase(path) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase GET ${path} -> ${response.status}`);
  }
  return response.json();
}

async function supabaseDelete(path) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: "DELETE",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "return=representation",
    },
  });
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) ? rows.length : 0;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let failures = 0;
const check = (ok, label) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failures += 1;
};

// 1. First delivery
const first = await postEvent("first delivery");
check(
  first.status === 202 && first.body.duplicate === false,
  "webhook accepted the signed event (202, duplicate=false)",
);
const conversationId = first.body.conversationId;

// 2. Redelivery of the identical event must be a no-op
const second = await postEvent("redelivery");
check(
  second.status === 202 && second.body.duplicate === true,
  "redelivered event was deduplicated (duplicate=true)",
);

// 3. Ingest side-effects
await sleep(1500);
const messages = await supabase(
  `inquiry_messages?provider_event_id=eq.smoke-evt-${runId}&select=id,conversation_id,body,direction`,
);
check(messages.length === 1, `exactly one message row stored (${messages.length})`);

const outbox = await supabase(
  `inquiry_outbox_events?aggregate_id=eq.${conversationId}&select=id,event_type,status,last_error&order=created_at.desc`,
);
check(outbox.length >= 1, `outbox event recorded (${outbox.length})`);
if (outbox[0]) {
  console.log(
    `      outbox: ${outbox[0].event_type} status=${outbox[0].status}` +
      (outbox[0].last_error ? ` last_error=${outbox[0].last_error.slice(0, 80)}` : ""),
  );
}

// 4. Optional: wait for the AI analysis + approval request (requires deployed tasks)
if (waitSeconds > 0 && conversationId) {
  console.log(`waiting up to ${waitSeconds}s for response run + approval request…`);
  const deadline = Date.now() + waitSeconds * 1000;
  let run = null;
  let approval = null;
  while (Date.now() < deadline) {
    await sleep(5000);
    const runs = await supabase(
      `inquiry_response_runs?conversation_id=eq.${conversationId}&select=id,model,policy_decision,proposed_reply`,
    );
    if (runs.length > 0) {
      run = runs[0];
      const approvals = await supabase(
        `inquiry_approval_requests?conversation_id=eq.${conversationId}&select=id,status,telegram_notification_status,telegram_message_id`,
      );
      if (
        approvals.length > 0 &&
        approvals[0].telegram_notification_status !== "pending"
      ) {
        approval = approvals[0];
        break;
      }
    }
  }
  check(Boolean(run), "AI response run recorded");
  if (run) {
    console.log(
      `      model=${run.model} policy=${run.policy_decision}\n      draft: ${run.proposed_reply?.slice(0, 160)}…`,
    );
  }
  check(Boolean(approval), "approval request created and Telegram card sent");
  if (approval) {
    console.log(
      `      approval=${approval.id} status=${approval.status} telegram=${approval.telegram_notification_status} message_id=${approval.telegram_message_id}`,
    );
    console.log(
      "      → Tap REJECT on the Telegram card for this smoke conversation.",
    );
  }
}

// 5. Cleanup
if (!keep && conversationId) {
  const conversationRows = await supabase(
    `inquiry_conversations?id=eq.${conversationId}&select=id,contact_id`,
  );
  const contactId = conversationRows[0]?.contact_id;
  const approvals = await supabase(
    `inquiry_approval_requests?conversation_id=eq.${conversationId}&select=id`,
  );
  let deletedOutbox = await supabaseDelete(
    `inquiry_outbox_events?aggregate_id=eq.${conversationId}`,
  );
  for (const approval of approvals) {
    deletedOutbox += await supabaseDelete(
      `inquiry_outbox_events?aggregate_id=eq.${approval.id}`,
    );
  }
  const deletedConversations = await supabaseDelete(
    `inquiry_conversations?id=eq.${conversationId}`,
  );
  const deletedContacts = contactId
    ? await supabaseDelete(`inquiry_contacts?id=eq.${contactId}`)
    : 0;
  console.log(
    `cleanup: outbox=${deletedOutbox} conversations=${deletedConversations} (children cascade) contacts=${deletedContacts}`,
  );
} else if (keep) {
  console.log(`kept synthetic rows for conversation ${conversationId}`);
}

console.log(failures === 0 ? "SMOKE OK" : `SMOKE FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
