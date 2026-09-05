"use client";

import { useState, useTransition } from "react";

import type { ActionResult } from "@/app/admin/(app)/actions";
import { SubmitButton } from "@/components/admin/fields";
import { cn } from "@/lib/utils";

interface ActionFormProps {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
  onSuccess?: (result: Extract<ActionResult, { ok: true }>) => void;
  secondary?: React.ReactNode;
}

/** A <form> bound to a Server Action with an inline status line. */
export function ActionForm({ action, children, submitLabel, className, onSuccess, secondary }: ActionFormProps) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const outcome = await action(formData);
          setResult(outcome);
          if (outcome.ok) onSuccess?.(outcome);
        });
      }}
    >
      {children}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
        {secondary}
        {result ? (
          <span role="status" className={cn("font-sans text-sm", result.ok ? "text-success" : "text-accent")}>
            {result.ok ? result.message ?? "Saved." : result.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
