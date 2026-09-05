"use client";

import { ChevronDown } from "lucide-react";
import { useActionState, type ReactNode } from "react";
import {
  Button as AriaButton,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  Switch,
  TextArea,
  TextField,
} from "react-aria-components";

import { cn } from "@/lib/utils";

/**
 * Interactive controls for the admin, built on react-aria-components so
 * keyboard and screen-reader behaviour is correct without custom work.
 */

export interface ActionResult {
  ok: boolean;
  message?: string;
  redirectTo?: string;
}

export const idleAction: ActionResult = { ok: true };

const fieldClass =
  "w-full rounded-xl border border-foreground/15 bg-background px-[0.9em] py-[0.6em] font-sans text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-60";

const labelClass = "mb-1.5 block font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60";

export function Field({
  name,
  label,
  defaultValue,
  type = "text",
  placeholder,
  required,
  hint,
  className,
  autoComplete,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  type?: "text" | "email" | "tel" | "date" | "number" | "url";
  placeholder?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  autoComplete?: string;
}) {
  return (
    <TextField name={name} type={type} defaultValue={defaultValue ?? ""} isRequired={required} className={cn("block", className)}>
      <Label className={labelClass}>{label}</Label>
      <Input className={fieldClass} placeholder={placeholder} autoComplete={autoComplete} />
      {hint ? <p className="mt-1 font-sans text-xs text-foreground/55">{hint}</p> : null}
    </TextField>
  );
}

export function TextAreaField({
  name,
  label,
  defaultValue,
  rows = 6,
  hint,
  className,
  mono,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  rows?: number;
  hint?: string;
  className?: string;
  mono?: boolean;
  required?: boolean;
}) {
  return (
    <TextField name={name} defaultValue={defaultValue ?? ""} isRequired={required} className={cn("block", className)}>
      <Label className={labelClass}>{label}</Label>
      <TextArea rows={rows} className={cn(fieldClass, "leading-relaxed", mono && "font-jakarta text-sm")} />
      {hint ? <p className="mt-1 font-sans text-xs text-foreground/55">{hint}</p> : null}
    </TextField>
  );
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  className,
  placeholder = "Choose",
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  defaultValue?: string | null;
  className?: string;
  placeholder?: string;
}) {
  return (
    <Select name={name} defaultSelectedKey={defaultValue ?? undefined} placeholder={placeholder} className={cn("block", className)}>
      <Label className={labelClass}>{label}</Label>
      <AriaButton className={cn(fieldClass, "flex items-center justify-between gap-2 text-left")}>
        <SelectValue className="truncate data-[placeholder]:text-foreground/40" />
        <ChevronDown className="h-[16px] w-[16px] shrink-0 text-foreground/50" aria-hidden />
      </AriaButton>
      <Popover className="w-[--trigger-width] rounded-xl border border-foreground/10 bg-background p-1 shadow-card">
        <ListBox className="max-h-[18rem] overflow-auto outline-none">
          {options.map((option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              textValue={option.label}
              className="cursor-pointer rounded-lg px-[0.8em] py-[0.5em] font-sans text-sm text-foreground outline-none data-[focused]:bg-cream data-[selected]:font-semibold"
            >
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  );
}

export function SwitchField({ name, label, defaultSelected, className }: { name: string; label: string; defaultSelected?: boolean; className?: string }) {
  return (
    <Switch name={name} value="on" defaultSelected={defaultSelected} className={cn("group inline-flex cursor-pointer items-center gap-3", className)}>
      <span className="h-[22px] w-[38px] rounded-full border border-foreground/20 bg-cream p-[2px] transition-colors group-data-[selected]:border-primary group-data-[selected]:bg-primary">
        <span className="block h-[16px] w-[16px] rounded-full bg-background shadow-card transition-transform group-data-[selected]:translate-x-[16px]" />
      </span>
      <span className="font-sans text-sm text-foreground">{label}</span>
    </Switch>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  className,
  pending,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
  pending?: boolean;
}) {
  return (
    <AriaButton
      type="submit"
      isDisabled={pending}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-[1.25em] py-[0.5em] font-sans text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-60",
        variant === "primary" && "bg-primary text-on-dark hover:bg-primary/90",
        variant === "secondary" && "border border-foreground/15 bg-background text-foreground hover:border-foreground/40",
        variant === "danger" && "border border-error/40 bg-background text-error hover:bg-error hover:text-on-dark",
        variant === "ghost" && "text-primary hover:bg-cream",
        className,
      )}
    >
      {pending ? "Working…" : children}
    </AriaButton>
  );
}

/**
 * A form bound to a Server Action, with a status line. Children render the
 * fields; the action's message is shown below them.
 */
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  submitVariant = "primary",
  className,
  confirm,
  inline,
}: {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>;
  children?: ReactNode;
  submitLabel?: ReactNode;
  submitVariant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
  confirm?: string;
  inline?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, idleAction);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        // A declined confirmation cancels the submit before the action runs.
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
      className={cn(inline ? "inline-flex flex-wrap items-center gap-2" : "space-y-4", className)}
    >
      {children}
      <div className={cn("flex flex-wrap items-center gap-3", !inline && "pt-1")}>
        <SubmitButton variant={submitVariant} pending={pending}>
          {submitLabel}
        </SubmitButton>
        {state.message ? (
          <p role="status" className={cn("font-sans text-sm", state.ok ? "text-primary" : "text-error")}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
