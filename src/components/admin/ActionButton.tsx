"use client";

import { useState, useTransition } from "react";
import { Button } from "react-aria-components";

import type { ActionResult } from "@/app/admin/(app)/actions";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  action: (formData: FormData) => Promise<ActionResult>;
  fields: Record<string, string>;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  confirm?: string;
  className?: string;
}

/**
 * A one-click Server Action with inline feedback. `confirm` asks for a second
 * press instead of a window.confirm, which would block browser automation.
 */
export function ActionButton({ action, fields, children, variant = "secondary", confirm, className }: ActionButtonProps) {
  const [pending, startTransition] = useTransition();
  const [armed, setArmed] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  function run() {
    if (confirm && !armed) {
      setArmed(true);
      window.setTimeout(() => setArmed(false), 4000);
      return;
    }
    setArmed(false);
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) formData.set(key, value);
    startTransition(async () => {
      setResult(await action(formData));
    });
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        onPress={run}
        isDisabled={pending}
        className={cn(
          "inline-flex min-h-11 items-center justify-center rounded-full px-[1.25em] py-[0.6em] font-sans text-sm font-medium transition-colors duration-300 data-[disabled]:opacity-60 data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-accent",
          variant === "primary" && "bg-primary text-on-dark hover:bg-primary/90",
          variant === "secondary" && "border border-foreground/15 text-foreground hover:border-foreground/40",
          variant === "danger" && "border border-accent text-foreground hover:bg-accent hover:text-on-dark",
          armed && "bg-accent text-on-dark",
          className,
        )}
      >
        {pending ? "Working…" : armed ? confirm : children}
      </Button>
      {result ? (
        <span role="status" className={cn("font-sans text-xs", result.ok ? "text-primary" : "text-accent")}>
          {result.ok ? result.message ?? "Done." : result.error}
        </span>
      ) : null}
    </span>
  );
}
