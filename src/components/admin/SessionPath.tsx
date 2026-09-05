import { Empty, formatDateTime } from "@/components/admin/ui";
import type { SessionStep } from "@/lib/admin/queries";

/** The pages and funnel events one anonymous session went through, oldest first. */
export function SessionPath({ steps, sessionId }: { steps: SessionStep[]; sessionId: string | null }) {
  if (!sessionId) {
    return <Empty>No analytics session was attached to this enquiry.</Empty>;
  }
  if (steps.length === 0) {
    return <Empty>Session recorded, but no page views were captured (ad blocker or very old session).</Empty>;
  }

  const first = new Date(steps[0].at).getTime();
  const last = new Date(steps[steps.length - 1].at).getTime();
  const minutes = Math.max(0, Math.round((last - first) / 60_000));
  const referrer = steps.find((step) => step.kind === "view" && step.referrer)?.referrer ?? null;

  return (
    <div>
      <p className="mb-3 font-sans text-sm text-on-dark/70">
        {referrer ? `Came from ${referrer}` : "Direct or unknown referrer"} · {steps.length} steps over {minutes} min
      </p>
      <ol className="flex flex-col gap-1 border-l border-on-dark/15 pl-4 font-sans text-sm">
        {steps.map((step, index) => (
          <li key={`${step.at}-${index}`} className="relative py-1">
            <span aria-hidden className="absolute -left-[1.3rem] top-[0.85rem] h-[8px] w-[8px] rounded-full bg-cream" />
            <span className="text-on-dark">
              {step.kind === "view" ? step.path : (step.name ?? "").replace(/_/g, " ")}
            </span>
            <span className="ml-2 font-mono text-xs text-on-dark/45">{formatDateTime(step.at).split(", ").pop()}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
