import { formatDateTime, Panel } from "@/components/admin/ui";
import {
  RECENT_BOOKING_EVENTS_LIMIT,
  type BookingAnalytics,
  type BookingDraftEvent,
  type RecentBookingAttempt,
} from "@/lib/admin/booking-analytics";
import { BOOKER_ROLES, formatDateForHumans, getEventLabel } from "@/lib/booking/build-message";
import { cn } from "@/lib/utils";

const actionLabels: Record<BookingDraftEvent["action"], string> = {
  whatsapp: "Open WhatsApp clicked",
  email: "Email draft opened",
  email_app: "Open email app clicked",
  gmail: "Open Gmail clicked",
  email_copy: "Copy email clicked",
};

function RecentAttempt({ attempt }: { attempt: RecentBookingAttempt }) {
  const { snapshot, draft_events: drafts } = attempt;
  const eventLabel = getEventLabel(snapshot);
  const date = snapshot.dateUnsure ? "Date flexible" : formatDateForHumans(snapshot.date);
  const role = snapshot.bookerRole === "other"
    ? snapshot.bookerRoleOther
    : BOOKER_ROLES.find(({ value }) => value === snapshot.bookerRole)?.label;
  const guestCount = snapshot.guestCount === 200 ? "200+" : snapshot.guestCount?.toString();
  const fields = [
    ["Email", attempt.email],
    ["Phone", snapshot.phone],
    ["WhatsApp", snapshot.whatsappSameAsPhone ? snapshot.phone : snapshot.whatsapp],
    ["Venue", snapshot.location],
    ["Event date", date],
    ...(attempt.step === 2 ? [
      ["Role", role],
      ["Organisation", snapshot.bookingOnBehalf ? snapshot.organisation : ""],
      ["Guests", guestCount],
      ["Performance", `${snapshot.performanceMinutes} minutes`],
    ] : []),
  ].filter(([, value]) => value?.trim());

  return (
    <details className="min-w-0 rounded-xl border border-foreground/15 bg-background">
      <summary className="cursor-pointer rounded-xl px-3 py-3 font-sans text-sm leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <span className="font-semibold [overflow-wrap:anywhere]">{snapshot.fullName}</span>
        <span className="text-foreground/75 [overflow-wrap:anywhere]"> · {eventLabel}</span>
        <span className="ml-4 block text-xs text-foreground/75">
          {attempt.step === 2 ? "Details saved" : "Contact saved"}
          {drafts.length > 0 ? " · Draft opened" : null} ·{" "}
          <time dateTime={attempt.updated_at}>{formatDateTime(attempt.updated_at)}</time>
        </span>
      </summary>
      <div className="border-t border-foreground/15 px-4 py-4 font-sans text-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          {fields.map(([label, value]) => (
            <div key={label} className={cn("min-w-0", label === "Email" && "col-span-2 sm:col-span-1")}>
              <dt className="text-xs font-medium text-foreground/75">{label}</dt>
              <dd className="mt-1 [overflow-wrap:anywhere]">{value}</dd>
            </div>
          ))}
        </dl>
        {attempt.step === 2 && snapshot.message.trim() ? (
          <div className="mt-4">
            <h4 className="text-xs font-medium text-foreground/75">Notes entered in the form</h4>
            <p className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{snapshot.message}</p>
          </div>
        ) : null}
        <div className="mt-4 border-t border-foreground/15 pt-3">
          <h4 className="text-sm font-semibold">Draft actions</h4>
          {drafts.length ? (
            <>
              {drafts.length === RECENT_BOOKING_EVENTS_LIMIT ? (
                <p className="mt-1 text-xs text-foreground/75">Showing the latest {RECENT_BOOKING_EVENTS_LIMIT} actions.</p>
              ) : null}
              <ul className="mt-2 space-y-2">
                {drafts.map((draft) => (
                  <li key={draft.id}>
                    <details className="rounded-lg bg-cream">
                      <summary className="cursor-pointer rounded-lg px-3 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                        <span className="font-medium">{actionLabels[draft.action]}</span>
                        <span className="ml-4 block text-xs text-foreground/75">
                          {draft.source === "ai" ? "AI draft" : "Template draft"} ·{" "}
                          <time dateTime={draft.created_at}>{formatDateTime(draft.created_at)}</time>
                        </span>
                      </summary>
                      <div className="border-t border-foreground/15 px-3 py-3 [overflow-wrap:anywhere]">
                        {draft.subject ? (
                          <dl className="mb-3">
                            <dt className="text-xs font-medium text-foreground/75">Subject</dt>
                            <dd className="mt-1 font-medium">{draft.subject}</dd>
                          </dl>
                        ) : null}
                        <p className="whitespace-pre-wrap leading-relaxed">{draft.body}</p>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-1 text-foreground/75">No draft actions recorded.</p>
          )}
        </div>
      </div>
    </details>
  );
}

export function BookingFunnel({ analytics }: { analytics: BookingAnalytics | null }) {
  const counts = analytics ? [
    { label: "Contact saved", value: analytics.saved },
    { label: "Details completed", value: analytics.completed },
    { label: "Draft opened", value: analytics.opened },
    { label: "Email or WhatsApp clicked", value: analytics.choseApp },
  ] : [];

  return (
    <Panel title="Booking enquiry funnel" eyebrow="Attempts started in the last 30 days" className="mt-6">
      {analytics ? (
        <>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-4">
            {counts.map(({ label, value }) => (
              <div key={label} className="flex flex-col justify-between gap-1 rounded-xl bg-cream px-3 py-3">
                <dt className="font-sans text-xs font-semibold text-foreground/80">{label}</dt>
                <dd className="font-display text-2xl font-semibold tabular-nums">{value.toLocaleString("en-ZA")}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 font-sans text-xs leading-relaxed text-foreground/75">
            Each stage counts attempts once. Visitors send the message from their own app. Compare saved drafts with messages you receive.
          </p>
          <div className="mt-5 border-t border-foreground/15 pt-4">
            <h3 className="font-display text-base font-semibold">Recent booking attempts</h3>
            {analytics.recent.length ? (
              <ul className="mt-3 space-y-2">
                {analytics.recent.map((attempt) => <li key={attempt.id}><RecentAttempt attempt={attempt} /></li>)}
              </ul>
            ) : (
              <p className="mt-2 font-sans text-sm text-foreground/75">No booking attempts recorded yet.</p>
            )}
          </div>
        </>
      ) : (
        <p className="font-sans text-sm text-foreground/75">Booking attempt data is currently unavailable.</p>
      )}
    </Panel>
  );
}
