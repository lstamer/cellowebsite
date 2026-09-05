import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The admin's small, dense component kit. Server-safe: no hooks, no client
 * state. Interactive controls live in ./controls.tsx.
 */

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 font-jost text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl font-sans text-sm leading-relaxed text-foreground/70">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Card({
  children,
  className,
  title,
  eyebrow,
  actions,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
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
              <p className="font-jost text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h2>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "accent" | "danger" | "success";
  href?: string;
}) {
  const body = (
    <div
      className={cn(
        "flex h-full flex-col justify-between rounded-2xl border p-5 transition-colors",
        tone === "default" && "border-foreground/10 bg-background",
        tone === "accent" && "border-primary/20 bg-primary text-on-dark",
        tone === "danger" && "border-error/30 bg-background",
        tone === "success" && "border-success/40 bg-background",
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
          "mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl",
          tone === "danger" && "text-error",
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className={cn("mt-1 font-sans text-xs", tone === "accent" ? "text-on-dark/70" : "text-foreground/55")}>
          {hint}
        </p>
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

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-[0.6em] py-[0.15em] font-jost text-xs font-semibold uppercase tracking-[0.12em]",
        tone === "neutral" && "border-foreground/15 bg-cream text-foreground/70",
        tone === "success" && "border-success/50 bg-background text-primary",
        tone === "warning" && "border-accent/50 bg-background text-accent-ink",
        tone === "danger" && "border-error/50 bg-background text-error",
        tone === "info" && "border-primary/30 bg-background text-primary",
        tone === "accent" && "border-accent bg-accent text-on-dark",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string | null | undefined): BadgeTone {
  switch (status) {
    case "sent":
    case "approved":
    case "booked":
    case "played":
    case "completed":
    case "ok":
      return "success";
    case "failed":
    case "rejected":
    case "expired":
    case "lost":
    case "error":
    case "send_uncertain":
    case "uncertain":
      return "danger";
    case "pending":
    case "sending":
    case "drafting":
    case "draft_ready":
    case "quoted":
    case "warn":
    case "awaiting_instructions":
      return "warning";
    case "new":
    case "contacted":
    case "info":
      return "info";
    default:
      return "neutral";
  }
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-foreground/20 bg-cream/60 p-6">
      <p className="font-display text-lg font-semibold text-foreground">{title}</p>
      {body ? <p className="max-w-prose font-sans text-sm leading-relaxed text-foreground/70">{body}</p> : null}
      {action}
    </div>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-foreground/10 bg-background", className)}>
      <table className="w-full min-w-[40rem] border-collapse text-left font-sans text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
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

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("border-b border-foreground/5 px-4 py-3 align-top text-foreground/85", className)}>{children}</td>;
}

export function DefinitionList({ items }: { items: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">
            {item.label}
          </dt>
          <dd className="mt-1 break-words font-sans text-sm text-foreground/90">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Timeline({ items }: { items: Array<{ id: string; at: string; title: string; body?: ReactNode; tone?: BadgeTone }> }) {
  if (items.length === 0) return <p className="font-sans text-sm text-foreground/60">Nothing yet.</p>;
  return (
    <ol className="relative space-y-5 border-l border-foreground/10 pl-5">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            className={cn(
              "absolute -left-[26px] top-[0.35rem] h-[10px] w-[10px] rounded-full border-2 border-background",
              item.tone === "danger" ? "bg-error" : item.tone === "success" ? "bg-success" : item.tone === "warning" ? "bg-accent" : "bg-primary",
            )}
            aria-hidden
          />
          <p className="font-sans text-xs text-foreground/50">{formatDateTime(item.at)}</p>
          <p className="mt-0.5 font-sans text-sm font-semibold text-foreground">{item.title}</p>
          {item.body ? <div className="mt-1 font-sans text-sm leading-relaxed text-foreground/75">{item.body}</div> : null}
        </li>
      ))}
    </ol>
  );
}

export function Pre({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <pre className={cn("overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-foreground/10 bg-cream p-4 font-sans text-sm leading-relaxed text-foreground/85", className)}>
      {children}
    </pre>
  );
}

export function LinkButton({
  href,
  children,
  variant = "secondary",
  className,
  external,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  external?: boolean;
}) {
  const classes = cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-[1.25em] py-[0.5em] font-sans text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent",
    variant === "primary" && "bg-primary text-on-dark hover:bg-primary/90",
    variant === "secondary" && "border border-foreground/15 bg-background text-foreground hover:border-foreground/40",
    variant === "ghost" && "text-primary hover:bg-cream",
    className,
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
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

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return iso;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(iso);
}

export function humanise(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
