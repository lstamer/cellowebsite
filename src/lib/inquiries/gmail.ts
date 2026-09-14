/**
 * Minimal Gmail REST client for the enquiry poller. Uses an OAuth refresh
 * token for Luke's Google Workspace mailbox (see scripts/gmail-auth.mjs) and
 * only ever reads: list recent messages, fetch one in full, mark nothing.
 */
import { z } from "zod";

import { requireEnv } from "@/lib/inquiries/env";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

export function gmailConfigured(): boolean {
  return Boolean(
    process.env.GMAIL_CLIENT_ID?.trim() &&
      process.env.GMAIL_CLIENT_SECRET?.trim() &&
      process.env.GMAIL_REFRESH_TOKEN?.trim(),
  );
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getGmailAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const body = new URLSearchParams({
    client_id: requireEnv("GMAIL_CLIENT_ID"),
    client_secret: requireEnv("GMAIL_CLIENT_SECRET"),
    refresh_token: requireEnv("GMAIL_REFRESH_TOKEN"),
    grant_type: "refresh_token",
  });
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Gmail token refresh failed (${response.status}): ${raw.slice(0, 300)}`);
  }
  const parsed = z.object({ access_token: z.string(), expires_in: z.number() }).parse(JSON.parse(raw));
  cachedToken = { value: parsed.access_token, expiresAt: Date.now() + parsed.expires_in * 1000 };
  return parsed.access_token;
}

async function gmailGet<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const token = await getGmailAccessToken();
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20_000),
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Gmail ${path.split("?")[0]} failed (${response.status}): ${raw.slice(0, 300)}`);
  }
  return schema.parse(JSON.parse(raw));
}

const listSchema = z.object({
  messages: z.array(z.object({ id: z.string(), threadId: z.string() })).default([]),
  nextPageToken: z.string().optional(),
});

/** Ids of messages matching a Gmail search, newest first, up to `max`. */
export async function listGmailMessageIds(query: string, max = 50): Promise<Array<{ id: string; threadId: string }>> {
  const ids: Array<{ id: string; threadId: string }> = [];
  let pageToken: string | undefined;
  while (ids.length < max) {
    const params = new URLSearchParams({ q: query, maxResults: String(Math.min(50, max - ids.length)) });
    if (pageToken) params.set("pageToken", pageToken);
    const page = await gmailGet(`/messages?${params}`, listSchema);
    ids.push(...page.messages);
    if (!page.nextPageToken || page.messages.length === 0) break;
    pageToken = page.nextPageToken;
  }
  return ids.slice(0, max);
}

const headerSchema = z.object({ name: z.string(), value: z.string() });

interface PartShape {
  mimeType?: string;
  body?: { data?: string; size?: number };
  parts?: PartShape[];
  headers?: Array<{ name: string; value: string }>;
}

const partSchema: z.ZodType<PartShape> = z.lazy(() =>
  z.object({
    mimeType: z.string().optional(),
    body: z.object({ data: z.string().optional(), size: z.number().optional() }).optional(),
    parts: z.array(partSchema).optional(),
    headers: z.array(headerSchema).optional(),
  }),
);

const messageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  labelIds: z.array(z.string()).default([]),
  snippet: z.string().default(""),
  internalDate: z.string(),
  payload: partSchema,
});

export interface GmailMessage {
  id: string;
  threadId: string;
  labels: string[];
  snippet: string;
  receivedAt: string;
  from: { email: string | null; name: string | null };
  to: string | null;
  subject: string | null;
  bodyText: string;
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function findBody(part: PartShape, mime: string): string | null {
  if (part.mimeType === mime && part.body?.data) return decodeBase64Url(part.body.data);
  for (const child of part.parts ?? []) {
    const found = findBody(child, mime);
    if (found) return found;
  }
  return null;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseAddress(value: string | null): { email: string | null; name: string | null } {
  if (!value) return { email: null, name: null };
  const match = value.match(/^\s*(?:"?([^"<]*)"?\s*)?<([^>]+)>\s*$/);
  if (match) {
    return { email: match[2].trim().toLowerCase(), name: match[1]?.trim() || null };
  }
  const bare = value.trim();
  return { email: bare.includes("@") ? bare.toLowerCase() : null, name: null };
}

/** Drops quoted replies and signatures so the classifier sees the new text. */
export function trimQuotedReply(text: string): string {
  const lines = text.split("\n");
  const cut = lines.findIndex(
    (line) => /^On .+ wrote:$/.test(line.trim()) || /^-{2,}\s*Original Message/i.test(line.trim()) || /^From: .+/.test(line.trim()) && lines.indexOf(line) > 0,
  );
  const kept = (cut > 0 ? lines.slice(0, cut) : lines).filter((line) => !line.startsWith(">"));
  return kept.join("\n").trim();
}

export async function getGmailMessage(id: string): Promise<GmailMessage> {
  const raw = await gmailGet(`/messages/${encodeURIComponent(id)}?format=full`, messageSchema);
  const headers = new Map((raw.payload.headers ?? []).map((header) => [header.name.toLowerCase(), header.value]));
  const plain = findBody(raw.payload, "text/plain");
  const html = plain ? null : findBody(raw.payload, "text/html");
  const bodyText = (plain ?? (html ? stripHtml(html) : raw.snippet)).slice(0, 20_000);
  return {
    id: raw.id,
    threadId: raw.threadId,
    labels: raw.labelIds,
    snippet: raw.snippet,
    receivedAt: new Date(Number(raw.internalDate)).toISOString(),
    from: parseAddress(headers.get("from") ?? null),
    to: headers.get("to") ?? null,
    subject: headers.get("subject") ?? null,
    bodyText,
  };
}
