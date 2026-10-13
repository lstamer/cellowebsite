import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/inquiries/supabase";

/**
 * The analytics beacon. Accepts a page view or a funnel event and stores it
 * with no cookie, no IP and no user agent string: just the path, referrer
 * host, UTM tags, a device class derived from viewport width, and the
 * country Vercel already resolved at the edge.
 */

const sessionId = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);

const viewSchema = z.object({
  t: z.literal("view"),
  sid: sessionId,
  path: z.string().min(1).max(200),
  ref: z.string().max(500).nullable().optional(),
  utm_source: z.string().max(80).nullable().optional(),
  utm_medium: z.string().max(80).nullable().optional(),
  utm_campaign: z.string().max(120).nullable().optional(),
  w: z.number().int().min(0).max(10_000).optional(),
});

const eventSchema = z.object({
  t: z.literal("event"),
  sid: sessionId,
  name: z.string().regex(/^[a-z][a-z0-9_]{1,40}$/),
  path: z.string().max(200).nullable().optional(),
  props: z.record(z.string(), z.union([z.string().max(200), z.number(), z.boolean(), z.null()])).optional(),
});

const beaconSchema = z.discriminatedUnion("t", [viewSchema, eventSchema]);

function deviceClass(width: number | undefined): "mobile" | "tablet" | "desktop" | null {
  if (width === undefined) return null;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function referrerHost(ref: string | null | undefined, ownHost: string | null): string | null {
  if (!ref) return null;
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "").toLowerCase();
    if (!host || (ownHost && host === ownHost)) return null;
    return host.slice(0, 120);
  } catch {
    return null;
  }
}

function normalisePath(path: string): string {
  // Strip query strings and trailing slashes so /book?type=wedding and /book/
  // aggregate together. Cap length to keep the table tidy.
  const clean = path.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  return clean.slice(0, 200);
}

export async function POST(request: NextRequest) {
  if (!process.env.SUPABASE_URL) {
    return new NextResponse(null, { status: 204 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const parsed = beaconSchema.safeParse(payload);
  if (!parsed.success) {
    return new NextResponse(null, { status: 204 });
  }

  const country = request.headers.get("x-vercel-ip-country")?.slice(0, 2) ?? null;
  const ownHost = request.headers.get("host")?.replace(/^www\./, "").split(":")[0].toLowerCase() ?? null;
  const supabase = getSupabaseAdmin();

  try {
    if (parsed.data.t === "view") {
      await supabase.from("site_visits").insert({
        session_id: parsed.data.sid,
        path: normalisePath(parsed.data.path),
        referrer_host: referrerHost(parsed.data.ref, ownHost),
        utm_source: parsed.data.utm_source?.slice(0, 80) ?? null,
        utm_medium: parsed.data.utm_medium?.slice(0, 80) ?? null,
        utm_campaign: parsed.data.utm_campaign?.slice(0, 120) ?? null,
        device: deviceClass(parsed.data.w),
        country,
      });
    } else {
      await supabase.from("site_events").insert({
        session_id: parsed.data.sid,
        name: parsed.data.name,
        path: parsed.data.path ? normalisePath(parsed.data.path) : null,
        props: parsed.data.props ?? {},
      });
    }
  } catch {
    // Analytics is best-effort; the visitor never sees a failure.
  }

  return new NextResponse(null, { status: 204 });
}
