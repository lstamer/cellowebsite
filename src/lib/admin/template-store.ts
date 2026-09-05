/**
 * Loads active template overrides from `inquiry_prompt_templates` into the
 * in-memory registry in `@/lib/admin/templates`.
 *
 * Fail-open by design: if the table is unreachable the code defaults stay in
 * force and an admin event is written. Drafting must never stall because the
 * prompt editor's table is having a bad minute.
 */
import { logAdminEvent, describeError } from "@/lib/admin/events";
import { setTemplateOverrides, TEMPLATE_BY_SLUG } from "@/lib/admin/templates";
import { getSupabaseAdmin } from "@/lib/inquiries/supabase";

const CACHE_TTL_MS = 60_000;

let loadedAt = 0;
let inflight: Promise<void> | null = null;

export async function loadTemplateOverrides(
  options: { force?: boolean } = {},
): Promise<void> {
  if (!process.env.SUPABASE_URL) return;
  if (!options.force && Date.now() - loadedAt < CACHE_TTL_MS) return;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from("inquiry_prompt_templates")
        .select("slug, content")
        .eq("active", true);

      if (error) throw new Error(error.message);

      const entries: Array<[string, string]> = [];
      for (const row of data ?? []) {
        if (
          typeof row.slug === "string" &&
          typeof row.content === "string" &&
          TEMPLATE_BY_SLUG.has(row.slug) &&
          row.content.trim() !== ""
        ) {
          entries.push([row.slug, row.content]);
        }
      }
      setTemplateOverrides(entries);
      loadedAt = Date.now();
    } catch (error) {
      // Keep whatever was loaded last time; just note the miss.
      loadedAt = Date.now();
      await logAdminEvent({
        level: "warning",
        source: "supabase",
        kind: "template_overrides_unavailable",
        message: `Prompt/card overrides could not be loaded; code defaults used. ${describeError(error)}`,
      });
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Test seam: forget the cache so the next call hits the database. */
export function resetTemplateOverrideCache(): void {
  loadedAt = 0;
  inflight = null;
}
