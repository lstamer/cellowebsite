import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The admin's small, dense component kit. Server-safe: no hooks, no client
 * state. Light register: white cards on the cream ground, hairline borders,
 * coral only for eyebrows and warnings, ebony green for the one accent card.
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
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 font-jost text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-foreground/70">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  eyebrow,
  children,
  className,
  actions,
  padded = true,
}: {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-foreground/10 bg-background shadow-card",
        padded && "p-5 md:p-6",
        className,
      )}
    >
      {title || actions ? (
        <div className={cn("mb-4 flex items-start justify-between gap-4", !padded && "px-5 pt-5 md:px-6 md:pt-6")}>
          <div>
            {eyebrow ? (
              <p className="font-jost text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">{eyebrow}</p>
            ) : null}
            {title ? (
              <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h2>
            ) : null}
          </div>
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
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "good" | "bad" | "accent";
  href?: string;
}) {
  const body = (
    <div
      className={cn(
        "flex h-full flex-col justify-between rounded-2xl border p-5 transition-colors",
        tone === "neutral" && "border-foreground/10 bg-background",
        tone === "accent" && "border-primary/20 bg-primary text-on-dark",
        tone === "bad" && "border-error/30 bg-background",
        tone === "good" && "border-success/40 bg-background",
        href && "hover:border-foreground/30",
      )}
    >
      <p
        className={cn(
          "font-jost text-xs font-semibold uppercase tracking-[0.18em]",
          tone === "accent" ? "text-on-dark/70" : "text-foreground/50",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-3 font-display text-3xl font-semibold tracking-tight tabular-nums md:text-4xl",
          tone === "bad" && "text-error",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className={cn("mt-1 font-sans text-xs", tone === "accent" ? "text-on-dark/70" : "text-foreground/55")}>{hint}</p>
      ) : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-accent">
      {body}
    </Link>
  ) : (
    body
  );
}

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent" | "whatsapp";

const BADGE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border-foreground/15 bg-cream text-foreground/70",
  success: "border-success/50 bg-background text-primary",
  warning: "border-accent/50 bg-background text-accent-ink",
  danger: "border-error/50 bg-background text-error",
  info: "border-primary/30 bg-background text-primary",
  accent: "border-accent bg-accent text-on-dark",
  whatsapp: "border-whatsapp/50 bg-background text-whatsapp",
};

export function statusTone(status: string | null | undefined): BadgeTone {
  switch (status) {
    case "sent":
    case "approved":
    case "booked":
    case "played":
    case "completed":
    case "ok":
    case "available":
      return "success";
    case "failed":
    case "rejected":
    case "expired":
    case "lost":
    case "error":
    case "send_uncertain":
    case "uncertain":
    case "unavailable":
      return "danger";
    case "pending":
    case "sending":
    case "drafting":
    case "draft_ready":
    case "quoted":
    case "warning":
    case "awaiting_instructions":
    case "awaiting_human":
    case "human_rejected":
      return "warning";
    case "new":
    case "contacted":
    case "info":
    case "website":
      return "info";
    case "whatsapp":
      return "whatsapp";
    default:
      return "neutral";
  }
}

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-[0.6em] py-[0.15em] font-jost text-xs font-semibold uppercase tracking-[0.12em]",
        BADGE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Status pill keyed by a raw status/channel/level string. */
export function Pill({ value, label, tone, className }: { value: string; label?: string; tone?: BadgeTone; className?: string }) {
  return (
    <Badge tone={tone ?? statusTone(value)} className={className}>
      {label ?? value.replace(/_/g, " ")}
    </Badge>
  );
}

export function Empty({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-foreground/20 bg-cream/60 p-6">
      {title ? <p className="font-display text-lg font-semibold text-foreground">{title}</p> : null}
      <p className="max-w-prose font-sans text-sm leading-relaxed text-foreground/70">{children}</p>
    </div>
  );
}

export function KeyValue({ items }: { items: Array<[string, React.ReactNode]> }) {
  const visible = items.filter(([, value]) => value !== null && value !== undefined && value !== "");
  if (visible.length === 0) return <Empty>Nothing recorded.</Empty>;
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {visible.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">{label}</dt>
          <dd className="mt-1 break-words font-sans text-sm text-foreground/90">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function humanise(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/^\w/, (character) => character.toUpperCase());
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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
  if (!Number.isFinite(diff)) return value;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(value);
}

export function LinkButton({
  href,
  children,
  variant = "secondary",
  className,
  external,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "whatsapp";
  className?: string;
  external?: boolean;
}) {
  const classes = cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-[1.25em] py-[0.5em] font-sans text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent",
    variant === "primary" && "bg-primary text-on-dark hover:bg-primary/90",
    variant === "secondary" && "border border-foreground/15 bg-background text-foreground hover:border-foreground/40",
    variant === "ghost" && "text-primary hover:bg-cream",
    variant === "whatsapp" && "bg-whatsapp text-on-dark hover:bg-whatsapp/90",
    className,
  );
  if (external || /^(https?:|mailto:|tel:)/.test(href)) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}

export function Table({ head, children, className }: { head: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-foreground/10 bg-background", className)}>
      <table className="w-full min-w-[40rem] border-collapse text-left font-sans text-sm">
        <thead>{head}</thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-foreground/10 bg-cream px-4 py-3 font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-foreground/5 px-4 py-3 align-top text-foreground/85", className)}>{children}</td>;
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
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between font-sans text-sm text-foreground/70">
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
