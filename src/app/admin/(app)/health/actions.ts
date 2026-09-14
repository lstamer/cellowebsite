"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/components/admin/controls";
import { requireAdmin } from "@/lib/admin/auth";
import { recordAudit } from "@/lib/admin/audit";
import { runInternalChecks } from "@/lib/admin/health";
import { recordHealthChecks } from "@/lib/admin/health-store";

/** Runs the integration checks now, from this deployment, and records them. */
export async function recheckHealthAction(): Promise<ActionResult> {
  const session = await requireAdmin();
  const results = await runInternalChecks();
  try {
    await recordHealthChecks(results);
  } catch (error) {
    return { ok: false, message: `Checks ran but could not be stored: ${error instanceof Error ? error.message : "unknown error"}` };
  }
  await recordAudit({ actor: session.email, table: "health_checks", rowId: "*", action: "action", note: "Manual recheck" });
  revalidatePath("/admin/health");
  const failing = results.filter((result) => !result.ok);
  return failing.length === 0
    ? { ok: true, message: "All checks passed." }
    : { ok: false, message: `${failing.length} failing: ${failing.map((result) => result.target).join(", ")}` };
}
