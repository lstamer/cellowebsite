/**
 * Health checks shared by the internal /api/health route and the scheduled
 * probe. Each check answers ok/latency/detail and never throws.
 */
import { getAdminDb } from "@/lib/admin/db";

export interface HealthCheckResult {
  target: string;
  ok: boolean;
  statusCode: number | null;
  latencyMs: number;
  detail: string | null;
}

async function timed(target: string, run: () => Promise<{ ok: boolean; statusCode?: number | null; detail?: string | null }>): Promise<HealthCheckResult> {
  const started = Date.now();
  try {
    const result = await run();
    return { target, ok: result.ok, statusCode: result.statusCode ?? null, latencyMs: Date.now() - started, detail: result.detail ?? null };
  } catch (error) {
    return {
      target,
      ok: false,
      statusCode: null,
      latencyMs: Date.now() - started,
      detail: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function checkSupabase(): Promise<HealthCheckResult> {
  return timed("supabase", async () => {
    const { error } = await getAdminDb().from("inquiry_website_leads").select("id", { head: true, count: "exact" }).limit(1);
    return { ok: !error, detail: error?.message ?? null };
  });
}

export async function checkTelegram(): Promise<HealthCheckResult> {
  return timed("telegram", async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!token) return { ok: false, detail: "TELEGRAM_BOT_TOKEN missing" };
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(8_000) });
    const body = (await response.json().catch(() => null)) as { ok?: boolean; result?: { username?: string } } | null;
    return { ok: response.ok && body?.ok === true, statusCode: response.status, detail: body?.result?.username ? `@${body.result.username}` : null };
  });
}

export async function checkZernio(): Promise<HealthCheckResult> {
  return timed("zernio", async () => {
    const key = process.env.ZERNIO_API_KEY?.trim();
    if (!key) return { ok: false, detail: "ZERNIO_API_KEY missing" };
    // A cheap authenticated read; any 2xx proves the key and the API are up.
    const response = await fetch("https://zernio.com/api/v1/inbox/conversations?limit=1", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8_000),
    });
    return { ok: response.ok, statusCode: response.status, detail: response.ok ? null : `HTTP ${response.status}` };
  });
}

export async function checkAiGateway(): Promise<HealthCheckResult> {
  return timed("ai_gateway", async () => {
    const key = process.env.AI_GATEWAY_API_KEY?.trim();
    if (!key) return { ok: false, detail: "AI_GATEWAY_API_KEY missing" };
    const response = await fetch("https://ai-gateway.vercel.sh/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8_000),
    });
    return { ok: response.ok, statusCode: response.status, detail: response.ok ? null : `HTTP ${response.status}` };
  });
}

export async function checkTriggerConfig(): Promise<HealthCheckResult> {
  return timed("trigger", async () => {
    const ok = Boolean(process.env.TRIGGER_SECRET_KEY?.trim());
    return { ok, detail: ok ? null : "TRIGGER_SECRET_KEY missing" };
  });
}

/** Data-derived checks: things that are not down, but are stuck. */
export async function checkQueues(): Promise<HealthCheckResult> {
  return timed("queues", async () => {
    const db = getAdminDb();
    const [failedAlerts, uncertainSends, failedOutbox, stalePending] = await Promise.all([
      db.from("inquiry_website_leads").select("id", { head: true, count: "exact" }).eq("alert_status", "failed"),
      db.from("inquiry_approval_requests").select("id", { head: true, count: "exact" }).eq("status", "send_uncertain"),
      db.from("inquiry_outbox_events").select("id", { head: true, count: "exact" }).eq("status", "failed"),
      db
        .from("inquiry_approval_requests")
        .select("id", { head: true, count: "exact" })
        .eq("status", "pending")
        .lt("created_at", new Date(Date.now() - 24 * 3_600_000).toISOString()),
    ]);
    const counts = {
      failedAlerts: failedAlerts.count ?? 0,
      uncertainSends: uncertainSends.count ?? 0,
      failedOutbox: failedOutbox.count ?? 0,
      pendingOver24h: stalePending.count ?? 0,
    };
    const problems = Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => `${key}=${value}`);
    return { ok: problems.length === 0, detail: problems.length ? problems.join(", ") : null };
  });
}

export async function runInternalChecks(): Promise<HealthCheckResult[]> {
  return Promise.all([checkSupabase(), checkTelegram(), checkZernio(), checkAiGateway(), checkTriggerConfig(), checkQueues()]);
}
