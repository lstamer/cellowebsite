import { requireAdmin } from "@/lib/admin/auth";
import type { BookingDraftEvent as SavedBookingDraftEvent, BookingSnapshot } from "@/lib/booking/progress";
import { getSupabaseAdmin } from "@/lib/inquiries/supabase";

const ATTEMPTS = "inquiry_booking_attempts";
const DRAFT_EVENTS = "inquiry_booking_draft_events";
const APP_ACTIONS = ["whatsapp", "email_app", "gmail"];
export const RECENT_BOOKING_EVENTS_LIMIT = 10;

export interface BookingDraftEvent extends SavedBookingDraftEvent {
  created_at: string;
}

export interface RecentBookingAttempt {
  id: string;
  step: 1 | 2;
  snapshot: BookingSnapshot;
  email: string;
  updated_at: string;
  draft_events: BookingDraftEvent[];
}

export interface BookingAnalytics {
  saved: number;
  completed: number;
  opened: number;
  choseApp: number;
  recent: RecentBookingAttempt[];
}

/** Counts form attempts that started in the last 30 days, regardless of repeat clicks. */
export async function getBookingAnalytics(): Promise<BookingAnalytics | null> {
  await requireAdmin();
  const db = getSupabaseAdmin();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1_000).toISOString();
  const exactCount = { count: "exact", head: true } as const;
  const countAttempts = () => db.from(ATTEMPTS).select("id", exactCount).gte("created_at", since);
  const countWithDraftEvents = () =>
    db.from(ATTEMPTS)
      .select(`id,${DRAFT_EVENTS}!inner(id)`, exactCount)
      .gte("created_at", since);

  const [saved, completed, opened, choseApp, recent] = await Promise.all([
    countAttempts(),
    countAttempts().not("step_two_at", "is", null),
    countWithDraftEvents(),
    countWithDraftEvents().in(`${DRAFT_EVENTS}.action`, APP_ACTIONS),
    db.from(ATTEMPTS)
      .select(`id,step,snapshot,email,updated_at,draft_events:${DRAFT_EVENTS}(id,action,source,subject,body,created_at)`)
      .gte("created_at", since)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false, referencedTable: "draft_events" })
      .limit(RECENT_BOOKING_EVENTS_LIMIT, { referencedTable: "draft_events" })
      .limit(15),
  ]);

  const error = [saved, completed, opened, choseApp, recent].find((result) => result.error)?.error;
  if (error) {
    // Deploying the page before PostgREST sees the tables must leave traffic analytics available.
    if (["42P01", "PGRST200", "PGRST205"].includes(error.code)) return null;
    console.error("Could not read booking analytics", error.code);
    return null;
  }

  return {
    saved: saved.count ?? 0,
    completed: completed.count ?? 0,
    opened: opened.count ?? 0,
    choseApp: choseApp.count ?? 0,
    recent: (recent.data ?? []) as RecentBookingAttempt[],
  };
}
