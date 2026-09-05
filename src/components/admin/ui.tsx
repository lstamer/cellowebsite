import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Small server-safe primitives for the admin: dense, dark, opaque. Colour is
 * used only for status; everything else is weight and spacing.
 */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="font-jost text-[0.6875rem] uppercase tracking-[0.22em] text-on-dark/50">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 font-serif text-4xl italic leading-none tracking-tight md:text-5xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl font-sans text-base leading-relaxed text-on-dark/70">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  children,
  className,
  actions,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-card border border-on-dark/10 bg-surface-dark p-5 md:p-6", className)}>
      {title || actions ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? (
            <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
          ) : (
            <span />
          )}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "good" | "bad" | "accent";
}) {
  return (
    <div className="rounded-card border border-on-dark/10 bg-surface-dark p-5">
      <p className="font-jost text-[0.6875rem] uppercase tracking-[0.18em] text-on-dark/50">{label}</p>
      <p
        className={cn(
          "mt-2 font-serif text-4xl italic leading-none tabular-nums",
          tone === "good" && "text-success",
          tone === "bad" && "text-accent",
          tone === "accent" && "text-cream",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 font-sans text-sm text-on-dark/60">{hint}</p> : null}
    </div>
  );
}

const PILL_TONES: Record<string, string> = {
  new: "bg-cream text-primary",
  contacted: "bg-on-dark/15 text-on-dark",
  quoted: "bg-on-dark/15 text-on-dark",
  booked: "bg-success text-foreground",
  played: "bg-success text-foreground",
  lost: "bg-on-dark/10 text-on-dark/60",
  drafting: "bg-on-dark/15 text-on-dark",
  draft_ready: "bg-cream text-primary",
  approved: "bg-success text-foreground",
  dismissed: "bg-on-dark/10 text-on-dark/60",
  expired: "bg-on-dark/10 text-on-dark/60",
  pending: "bg-on-dark/15 text-on-dark",
  sending: "bg-on-dark/15 text-on-dark",
  sent: "bg-success text-foreground",
  failed: "bg-accent text-on-dark",
  skipped: "bg-on-dark/10 text-on-dark/60",
  send_uncertain: "bg-accent text-on-dark",
  rejected: "bg-on-dark/10 text-on-dark/60",
  error: "bg-accent text-on-dark",
  warning: "bg-cream text-primary",
  info: "bg-on-dark/15 text-on-dark",
  website: "bg-on-dark/15 text-on-dark",
  whatsapp: "bg-whatsapp text-on-dark",
  ok: "bg-success text-foreground",
};

export function Pill({ value, label, className }: { value: string; label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-[0.75em] py-[0.2em] font-jost text-xs font-semibold uppercase tracking-[0.08em]",
        PILL_TONES[value] ?? "bg-on-dark/15 text-on-dark",
        className,
      )}
    >
      {label ?? value.replace(/_/g, " ")}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-input border border-dashed border-on-dark/15 px-4 py-8 text-center font-sans text-sm text-on-dark/60">
      {children}
    </p>
  );
}

export function KeyValue({ items }: { items: Array<[string, React.ReactNode]> }) {
  const visible = items.filter(([, value]) => value !== null && value !== undefined && value !== "");
  if (visible.length === 0) return <Empty>Nothing recorded.</Empty>;
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {visible.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="font-jost text-[0.6875rem] uppercase tracking-[0.18em] text-on-dark/50">{label}</dt>
          <dd className="mt-1 break-words font-sans text-base text-on-dark">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** True when an ISO timestamp is still ahead of now (plain helper; keeps Date.now out of render). */
export function isInFuture(value: string | null | undefined): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  return !Number.isNaN(time) && time > Date.now();
}

/**
 * Bucket samples into 48 half-hour slots covering the last 24 hours.
 * null = no sample, false = at least one failure, true = all ok.
 */
export function bucketHalfHours(samples: Array<{ ok: boolean; created_at: string }>): Array<boolean | null> {
  const buckets: Array<boolean | null> = new Array(48).fill(null);
  const now = Date.now();
  for (const sample of samples) {
    const age = now - new Date(sample.created_at).getTime();
    const index = 47 - Math.floor(age / (30 * 60 * 1000));
    if (index < 0 || index > 47) continue;
    buckets[index] = buckets[index] === false ? false : sample.ok;
  }
  return buckets;
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 60) return `${days} d ago`;
  return formatDateTime(value);
}

export function LinkButton({
  href,
  children,
  variant = "secondary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full px-[1.25em] py-[0.6em] font-sans text-sm font-medium transition-colors duration-300",
        variant === "primary"
          ? "bg-cream text-primary hover:bg-on-dark"
          : "border border-on-dark/25 text-on-dark hover:border-on-dark",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Table({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-card border border-on-dark/10">
      <table className="w-full min-w-[40rem] border-collapse text-left font-sans text-sm">
        <thead className="bg-surface-dark font-jost text-[0.6875rem] uppercase tracking-[0.16em] text-on-dark/50">
          {head}
        </thead>
        <tbody className="divide-y divide-on-dark/10 bg-surface-darker">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 font-semibold", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top text-on-dark/85", className)}>{children}</td>;
}

export function Pagination({
  page,
  pageSize,
  total,
  makeHref,
}: {
  page: number;
  pageSize: number;
  total: number;
  makeHref: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between font-sans text-sm text-on-dark/70">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        {page > 1 ? <LinkButton href={makeHref(page - 1)}>Previous</LinkButton> : null}
        {page < pages ? <LinkButton href={makeHref(page + 1)}>Next</LinkButton> : null}
      </div>
    </nav>
  );
}
