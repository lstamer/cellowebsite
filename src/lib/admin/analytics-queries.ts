import { z } from "zod";

import { getAdminDb, isMissingRelation } from "@/lib/admin/db";

function rows<T>(schema: z.ZodType<T>, data: unknown, error: { code?: string; message: string } | null): T[] {
  if (error) {
    if (isMissingRelation(error)) return [];
    throw new Error(error.message);
  }
  return z.array(schema).parse(data ?? []);
}

export const dailyVisitSchema = z.object({ day: z.string(), views: z.number().int(), sessions: z.number().int() });
export type DailyVisit = z.infer<typeof dailyVisitSchema>;

export async function listDailyVisits(days = 30): Promise<DailyVisit[]> {
  const { data, error } = await getAdminDb().from("admin_daily_visits_v").select("*");
  const all = rows(dailyVisitSchema, data, error);
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  return all.filter((row) => row.day >= since);
}

export async function listTopPaths(): Promise<Array<{ path: string; views: number; sessions: number }>> {
  const { data, error } = await getAdminDb().from("admin_top_paths_v").select("*");
  return rows(z.object({ path: z.string(), views: z.number().int(), sessions: z.number().int() }), data, error);
}

export async function listTopReferrers(): Promise<Array<{ referrer_host: string; sessions: number }>> {
  const { data, error } = await getAdminDb().from("admin_top_referrers_v").select("*");
  return rows(z.object({ referrer_host: z.string(), sessions: z.number().int() }), data, error);
}

export interface VisitSummary {
  views30d: number;
  sessions30d: number;
  views7d: number;
  sessions7d: number;
  devices: Record<string, number>;
  countries: Array<{ country: string; sessions: number }>;
}

export async function getVisitSummary(): Promise<VisitSummary> {
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const since7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data, error } = await getAdminDb()
    .from("site_visits")
    .select("session_id, device, country, created_at")
    .gte("created_at", since30)
    .limit(20_000);
  const visits = rows(
    z.object({ session_id: z.string(), device: z.string(), country: z.string().nullable(), created_at: z.string() }),
    data,
    error,
  );

  const sessions30 = new Set<string>();
  const sessions7 = new Set<string>();
  let views7 = 0;
  const deviceSessions = new Map<string, Set<string>>();
  const countrySessions = new Map<string, Set<string>>();
  for (const visit of visits) {
    sessions30.add(visit.session_id);
    if (visit.created_at >= since7) {
      views7 += 1;
      sessions7.add(visit.session_id);
    }
    if (!deviceSessions.has(visit.device)) deviceSessions.set(visit.device, new Set());
    deviceSessions.get(visit.device)!.add(visit.session_id);
    const country = visit.country ?? "??";
    if (!countrySessions.has(country)) countrySessions.set(country, new Set());
    countrySessions.get(country)!.add(visit.session_id);
  }

  return {
    views30d: visits.length,
    sessions30d: sessions30.size,
    views7d: views7,
    sessions7d: sessions7.size,
    devices: Object.fromEntries([...deviceSessions.entries()].map(([device, set]) => [device, set.size])),
    countries: [...countrySessions.entries()]
      .map(([country, set]) => ({ country, sessions: set.size }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 8),
  };
}

export interface FunnelSummary {
  bookViews: number;
  step2: number;
  submitted: number;
  whatsappTaps: number;
}

export async function getBookingFunnel(days = 30): Promise<FunnelSummary> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const db = getAdminDb();
  const [views, events] = await Promise.all([
    db.from("site_visits").select("session_id").eq("path", "/book").gte("created_at", since).limit(20_000),
    db.from("site_events").select("session_id, name, props").gte("created_at", since).limit(20_000),
  ]);
  const viewRows = rows(z.object({ session_id: z.string() }), views.data, views.error);
  const eventRows = rows(z.object({ session_id: z.string(), name: z.string(), props: z.record(z.string(), z.unknown()) }), events.data, events.error);

  const bookSessions = new Set(viewRows.map((row) => row.session_id));
  const step2 = new Set<string>();
  const submitted = new Set<string>();
  const whatsapp = new Set<string>();
  for (const event of eventRows) {
    if (event.name === "book_step" && Number(event.props.step) >= 2) step2.add(event.session_id);
    if (event.name === "book_submitted") submitted.add(event.session_id);
    if (event.name === "whatsapp_tap") whatsapp.add(event.session_id);
  }
  return { bookViews: bookSessions.size, step2: step2.size, submitted: submitted.size, whatsappTaps: whatsapp.size };
}

export interface SessionPath {
  session_id: string;
  started_at: string;
  device: string;
  country: string | null;
  referrer_host: string | null;
  paths: string[];
  converted: boolean;
}

/** Recent sessions with the pages they visited, newest first. */
export async function listRecentSessions(limit = 40): Promise<SessionPath[]> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const db = getAdminDb();
  const { data, error } = await db
    .from("site_visits")
    .select("session_id, path, device, country, referrer_host, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5_000);
  const visits = rows(
    z.object({ session_id: z.string(), path: z.string(), device: z.string(), country: z.string().nullable(), referrer_host: z.string().nullable(), created_at: z.string() }),
    data,
    error,
  );
  const { data: leadData } = await db.from("inquiry_website_leads").select("session_id").gte("created_at", since).not("session_id", "is", null);
  const converted = new Set((leadData ?? []).map((row) => String(row.session_id)));

  const sessions = new Map<string, SessionPath>();
  for (const visit of visits) {
    const existing = sessions.get(visit.session_id);
    if (existing) {
      existing.paths.unshift(visit.path);
      existing.started_at = visit.created_at;
      existing.referrer_host = existing.referrer_host ?? visit.referrer_host;
    } else {
      sessions.set(visit.session_id, {
        session_id: visit.session_id,
        started_at: visit.created_at,
        device: visit.device,
        country: visit.country,
        referrer_host: visit.referrer_host,
        paths: [visit.path],
        converted: converted.has(visit.session_id),
      });
    }
  }
  return [...sessions.values()].slice(0, limit);
}

export async function listVisitsForSession(sessionId: string): Promise<Array<{ path: string; created_at: string }>> {
  const { data, error } = await getAdminDb()
    .from("site_visits")
    .select("path, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(200);
  return rows(z.object({ path: z.string(), created_at: z.string() }), data, error);
}

export const healthSummarySchema = z.object({
  target: z.string(),
  current_ok: z.boolean().nullable(),
  current_latency_ms: z.number().nullable(),
  current_detail: z.string().nullable(),
  checked_at: z.string().nullable(),
  uptime_24h: z.union([z.number(), z.string()]).nullable(),
  uptime_7d: z.union([z.number(), z.string()]).nullable(),
  avg_latency_24h: z.union([z.number(), z.string()]).nullable(),
});
export type HealthSummary = z.infer<typeof healthSummarySchema>;

export async function listHealthSummary(): Promise<HealthSummary[]> {
  const { data, error } = await getAdminDb().from("admin_health_summary_v").select("*");
  return rows(healthSummarySchema, data, error).sort((a, b) => a.target.localeCompare(b.target));
}

export async function listRecentHealthChecks(target: string, limit = 288): Promise<Array<{ ok: boolean; latency_ms: number | null; created_at: string }>> {
  const { data, error } = await getAdminDb()
    .from("health_checks")
    .select("ok, latency_ms, created_at")
    .eq("target", target)
    .order("created_at", { ascending: false })
    .limit(limit);
  return rows(z.object({ ok: z.boolean(), latency_ms: z.number().nullable(), created_at: z.string() }), data, error).reverse();
}
