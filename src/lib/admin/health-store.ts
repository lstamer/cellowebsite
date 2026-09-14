import { z } from "zod";

import { getAdminDb, isMissingRelation } from "@/lib/admin/db";
import type { HealthCheckResult } from "@/lib/admin/health";

export async function recordHealthChecks(results: HealthCheckResult[]): Promise<void> {
  if (results.length === 0) return;
  const { error } = await getAdminDb().from("health_checks").insert(
    results.map((result) => ({
      target: result.target,
      ok: result.ok,
      status_code: result.statusCode,
      latency_ms: Math.min(result.latencyMs, 2_147_483_647),
      detail: result.detail?.slice(0, 1000) ?? null,
    })),
  );
  if (error && !isMissingRelation(error)) {
    throw new Error(`Failed to record health checks: ${error.message}`);
  }
}

/** Most recent ok/failed state per target, for transition detection. */
export async function getLatestHealthStates(targets: string[]): Promise<Map<string, boolean>> {
  const states = new Map<string, boolean>();
  if (targets.length === 0) return states;
  const { data, error } = await getAdminDb()
    .from("health_checks")
    .select("target, ok, created_at")
    .in("target", targets)
    .order("created_at", { ascending: false })
    .limit(targets.length * 5);
  if (error) {
    if (isMissingRelation(error)) return states;
    throw new Error(error.message);
  }
  for (const row of z.array(z.object({ target: z.string(), ok: z.boolean() })).parse(data ?? [])) {
    if (!states.has(row.target)) states.set(row.target, row.ok);
  }
  return states;
}

export async function pruneAnalyticsAndHealth(): Promise<{ visits: number; events: number; health: number }> {
  const { data, error } = await getAdminDb().rpc("prune_analytics_and_health");
  if (error) {
    if (isMissingRelation(error)) return { visits: 0, events: 0, health: 0 };
    throw new Error(error.message);
  }
  return z.object({ visits: z.number(), events: z.number(), health: z.number() }).parse(data);
}
