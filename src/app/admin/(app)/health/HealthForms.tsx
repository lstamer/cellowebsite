"use client";

import { useActionState } from "react";

import { recheckHealthAction } from "@/app/admin/(app)/health/actions";
import { SubmitButton, idleAction } from "@/components/admin/controls";
import { cn } from "@/lib/utils";

export function HealthRecheckForm() {
  const [state, action, pending] = useActionState(recheckHealthAction, idleAction);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <SubmitButton variant="secondary" pending={pending}>
        Run checks now
      </SubmitButton>
      {state.message ? <p role="status" className={cn("font-sans text-sm", state.ok ? "text-primary" : "text-error")}>{state.message}</p> : null}
    </form>
  );
}
