// Backfill the voice corpus from real WhatsApp threads.
//
//   node scripts/backfill-chats.mjs [--dry-run] [--limit=N] [--exports=dir]
//
// Sources:
//   1. Every WhatsApp conversation reachable through the Zernio API
//      (history only exists from when the number was connected).
//   2. Optional --exports=dir of WhatsApp "Export chat (without media)" .txt
//      files, which is the only way to recover pre-connection history.
//
// Each thread is screened by the LLM: threads with good replies from Luke
// yield up to 3 (customer message -> Luke's actual reply) pairs, inserted into
// inquiry_reply_examples with kind='past_chat' and active=FALSE — nothing
// influences drafting until Luke reviews and activates rows in Studio.
// Business observations (pricing patterns, deposit habits, travel) are
// collected into a markdown report for Luke to fold into brain docs, never
// auto-inserted.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { generateText, Output } from "ai";
import { z } from "zod";

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

const dryRun = Boolean(args["dry-run"]);
const conversationLimit = args.limit ? Number(args.limit) : Infinity;
const exportsDir = typeof args.exports === "string" ? args.exports : null;

const zernioKey = process.env.ZERNIO_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const model = process.env.AI_MODEL;

if (!zernioKey || !supabaseUrl || !supabaseKey || !model || !process.env.AI_GATEWAY_API_KEY) {
  console.error("Missing ZERNIO_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY, AI_MODEL or AI_GATEWAY_API_KEY");
  process.exit(1);
}

async function zernio(path) {
  const response = await fetch(`https://zernio.com/api/v1${path}`, {
    headers: { Authorization: `Bearer ${zernioKey}` },
  });
  if (!response.ok) {
    throw new Error(`Zernio GET ${path} -> ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
  return response.json();
}

async function supabase(path, init = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase ${init.method ?? "GET"} ${path} -> ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
  return response.status === 204 ? null : response.json();
}

const screeningSchema = z.object({
  keep: z.boolean(),
  reason: z.string().max(300),
  examples: z
    .array(
      z.object({
        customer_message: z.string().min(1),
        reply: z.string().min(1),
        intents: z.array(
          z.enum([
            "availability", "pricing", "booking_process", "event_details",
            "repertoire", "media_request", "technical_requirements",
            "referral", "greeting", "existing_booking", "other",
          ]),
        ).min(1),
        summary: z.string().max(300),
      }),
    )
    .max(3),
  business_notes: z.array(z.string().max(300)).max(5),
});

const SCREEN_PROMPT = `You curate a voice-training corpus for Luke Stamer, a Cape Town cellist, from his real WhatsApp threads.

Given a transcript (Customer:/Luke: lines, oldest first), decide:
- keep=true only when Luke's replies are worth imitating: warm, personal, effective, and the thread went well (booked, positive, or a healthy ongoing exchange).
- keep=false for sour threads (complaints, ghosting after friction, disputes), junk/spam, or threads where Luke barely replied. Give the reason.

When keeping, extract up to 3 example pairs of the strongest exchanges:
- customer_message: the customer's message(s) that prompted the reply (verbatim; join consecutive customer bubbles with newlines).
- reply: Luke's ACTUAL reply, verbatim. If Luke answered in consecutive separate bubbles, join them with a line containing only --- (this teaches bubble-splitting).
- intents: classify the customer message.
- summary: one sentence of situation context.

Also record business_notes: concrete observations about how Luke handles pricing, deposits, travel, or booking mechanics (e.g. "quotes only after knowing date+duration", "asks for 50% deposit via EFT"). Facts only, no speculation.`;

async function screenThread(label, transcript) {
  const result = await generateText({
    model,
    system: SCREEN_PROMPT,
    output: Output.object({ schema: screeningSchema }),
    prompt: `Thread "${label}":\n${transcript.slice(0, 24_000)}`,
  });
  return result.output;
}

async function existingBackfillSources() {
  const rows = await supabase(
    "inquiry_reply_examples?select=source&or=(source.like.zernio_backfill%3A*,source.like.whatsapp_export%3A*)",
  );
  return new Set(rows.map((row) => row.source));
}

async function insertExamples(source, screening) {
  if (dryRun) return screening.examples.length;
  for (const example of screening.examples) {
    await supabase("inquiry_reply_examples", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        kind: "past_chat",
        intents: example.intents,
        customer_message: example.customer_message,
        situation_summary: example.summary,
        reply: example.reply,
        source,
        active: false,
      }),
    });
  }
  return screening.examples.length;
}

async function fetchZernioThreads() {
  const threads = [];
  let cursor = null;
  do {
    const query = new URLSearchParams({ platform: "whatsapp", limit: "100" });
    if (cursor) query.set("cursor", cursor);
    const page = await zernio(`/inbox/conversations?${query}`);
    for (const conversation of page.data ?? []) {
      threads.push(conversation);
    }
    cursor = page.pagination?.hasMore ? page.pagination?.nextCursor : null;
  } while (cursor);
  return threads;
}

async function fetchThreadTranscript(conversation) {
  const query = new URLSearchParams({
    accountId: conversation.accountId,
    limit: "100",
    sortOrder: "asc",
  });
  const page = await zernio(
    `/inbox/conversations/${encodeURIComponent(conversation.id)}/messages?${query}`,
  );
  const messages = page.messages ?? [];
  const outgoing = messages.filter((message) => message.direction === "outgoing").length;
  const transcript = messages
    .map((message) => {
      const text = message.message?.trim() || "[attachment]";
      return `${message.direction === "outgoing" ? "Luke" : "Customer"}: ${text}`;
    })
    .join("\n");
  return { transcript, total: messages.length, outgoing };
}

// WhatsApp export lines look like "2026/05/12, 14:03 - Luke Stamer: text" or
// "[2026/05/12, 14:03:22] Luke Stamer: text"; continuation lines have no
// timestamp prefix and belong to the previous message.
function parseWhatsAppExport(text) {
  const linePattern = /^\[?\d{1,4}[\/.]\d{1,2}[\/.]\d{1,4},? \d{1,2}:\d{2}(?::\d{2})?\]?\s*[-–]?\s*([^:]{1,60}):\s(.*)$/;
  const lines = [];
  for (const raw of text.split("\n")) {
    const match = raw.match(linePattern);
    if (match) {
      const sender = /luke|stamer/i.test(match[1]) ? "Luke" : "Customer";
      lines.push(`${sender}: ${match[2]}`);
    } else if (lines.length > 0 && raw.trim()) {
      lines[lines.length - 1] += `\n${raw.trim()}`;
    }
  }
  return lines.join("\n");
}

const report = [];
let inserted = 0;
let kept = 0;
let skipped = 0;

const seenSources = await existingBackfillSources();

const conversations = (await fetchZernioThreads()).slice(0, conversationLimit);
console.log(`Zernio: ${conversations.length} WhatsApp conversations to consider${dryRun ? " (dry run)" : ""}`);

for (const conversation of conversations) {
  const source = `zernio_backfill:${conversation.id}`;
  if (seenSources.has(source)) {
    console.log(`- ${conversation.participantName ?? conversation.id}: already backfilled, skipping`);
    continue;
  }
  const { transcript, total, outgoing } = await fetchThreadTranscript(conversation);
  if (outgoing === 0 || total < 2) {
    skipped += 1;
    continue;
  }
  const label = conversation.participantName ?? conversation.id;
  const screening = await screenThread(label, transcript);
  if (!screening.keep) {
    skipped += 1;
    report.push(`- SKIPPED "${label}": ${screening.reason}`);
    console.log(`- ${label}: skipped (${screening.reason})`);
    continue;
  }
  kept += 1;
  const count = await insertExamples(source, screening);
  inserted += count;
  report.push(
    `- KEPT "${label}" (${count} examples): ${screening.reason}` +
      screening.business_notes.map((note) => `\n  - note: ${note}`).join(""),
  );
  console.log(`- ${label}: kept, ${count} examples${screening.business_notes.length ? `, ${screening.business_notes.length} notes` : ""}`);
}

if (exportsDir) {
  const files = readdirSync(exportsDir).filter((file) => file.endsWith(".txt"));
  console.log(`Exports: ${files.length} .txt files in ${exportsDir}`);
  for (const file of files) {
    const source = `whatsapp_export:${file}`;
    if (seenSources.has(source)) {
      console.log(`- ${file}: already backfilled, skipping`);
      continue;
    }
    const transcript = parseWhatsAppExport(readFileSync(join(exportsDir, file), "utf8"));
    if (!transcript.includes("Luke:")) {
      console.log(`- ${file}: no Luke lines detected, skipping (check the export format)`);
      continue;
    }
    const screening = await screenThread(file, transcript);
    if (!screening.keep) {
      skipped += 1;
      report.push(`- SKIPPED export "${file}": ${screening.reason}`);
      console.log(`- ${file}: skipped (${screening.reason})`);
      continue;
    }
    kept += 1;
    const count = await insertExamples(source, screening);
    inserted += count;
    report.push(
      `- KEPT export "${file}" (${count} examples): ${screening.reason}` +
        screening.business_notes.map((note) => `\n  - note: ${note}`).join(""),
    );
    console.log(`- ${file}: kept, ${count} examples`);
  }
}

const reportPath = new URL("../.omc/research/backfill-report.md", import.meta.url).pathname;
writeFileSync(
  reportPath,
  `# Chat backfill report\n\nKept ${kept}, skipped ${skipped}, inserted ${inserted} examples (all active=false pending review).\n\nReview in Supabase Studio -> inquiry_reply_examples: flip active=true on the good ones, delete the rest. Fold the business notes below into inquiry_brain_docs yourself.\n\n${report.join("\n")}\n`,
);

console.log(`\nDone: kept ${kept}, skipped ${skipped}, inserted ${inserted} examples (active=false).`);
console.log(`Report: ${reportPath}`);
