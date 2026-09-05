import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminDb } from "@/lib/admin/db";

/**
 * Analytics beacon. Accepts a page view or a named event from the
 * first-party tracker and stores it without any personal data. Always
 * answers 204 quickly; a storage failure is logged, never surfaced.
 */

const sessionId = z.string().regex(/^[a-f0-9]{16,64}$/);
const shortText = z.string().trim().max(200).nullable().optional();

const viewSchema = z.object({
  kind: z.literal("view"),
  sessionId,
  path: z.string().trim().min(1).max(512),
  referrerHost: shortText,
  utmSource: shortText,
  utmMedium: shortText,
  utmCampaign: shortText,
  device: z.enum(["mobile", "tablet", "desktop"]).default("desktop"),
  viewportWidth: z.number().int().min(0).max(10_000).nullable().optional(),
});

const eventSchema = z.object({
  kind: z.literal("event"),
  sessionId,
  name: z.string().trim().min(1).max(64),
  path: z.string().trim().max(512).nullable().optional(),
  props: z.record(z.string(), z.union([z.string().max(200), z.number(), z.boolean(), z.null()])).default({}),
});

const payloadSchema = z.discriminatedUnion("kind", [viewSchema, eventSchema]);

const BOT_PATTERN = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|monitor|preview|facebookexternalhit|whatsapp/i;

function looksLikeBot(userAgent: string | null): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

function cleanPath(path: string): string {
  // Strip query strings and hashes so the same page is one row.
  return path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
}

export async function POST(request: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) return new NextResponse(null, { status: 204 });
  if (looksLikeBot(request.headers.get("user-agent"))) return new NextResponse(null, { status: 204 });

  const payload = parsed.data;
  const country = request.headers.get("x-vercel-ip-country")?.slice(0, 2) ?? null;

  try {
    if (payload.kind === "view") {
      const path = cleanPath(payload.path);
      if (path.startsWith("/admin") || path.startsWith("/api")) return new NextResponse(null, { status: 204 });
      const { error } = await getAdminDb().from("site_visits").insert({
        session_id: payload.sessionId,
        path,
        referrer_host: payload.referrerHost ?? null,
        utm_source: payload.utmSource ?? null,
        utm_medium: payload.utmMedium ?? null,
        utm_campaign: payload.utmCampaign ?? null,
        device: payload.device,
        country,
        viewport_width: payload.viewportWidth ?? null,
      });
      if (error) console.error("site_visits insert failed:", error.message);
    } else {
      const { error } = await getAdminDb().from("site_events").insert({
        session_id: payload.sessionId,
        name: payload.name,
        path: payload.path ? cleanPath(payload.path) : null,
        props: payload.props,
      });
      if (error) console.error("site_events insert failed:", error.message);
    }
  } catch (error) {
    console.error("analytics beacon failed:", error);
  }

  return new NextResponse(null, { status: 204 });
}
