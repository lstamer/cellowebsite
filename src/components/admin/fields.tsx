"use client";

import { ChevronDown } from "lucide-react";
import {
  Button,
  Checkbox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  TextArea,
  TextField,
} from "react-aria-components";

import { cn } from "@/lib/utils";

/**
 * React Aria form controls in the admin's light register. Every control
 * renders its own <Label> and carries the name so plain <form> submission and
 * Server Actions both work.
 */

export const labelClass = "font-jost text-xs font-semibold uppercase tracking-[0.14em] text-foreground/60";
export const inputClass =
  "min-h-11 w-full rounded-xl border border-foreground/15 bg-background px-[0.9em] font-sans text-sm text-foreground outline-none placeholder:text-foreground/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 data-[invalid]:border-error";

export function Field({
  name,
  label,
  defaultValue,
  type = "text",
  placeholder,
  isRequired,
  className,
  description,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
  isRequired?: boolean;
  className?: string;
  description?: string;
}) {
  return (
    <TextField
      name={name}
      type={type}
      defaultValue={defaultValue === null || defaultValue === undefined ? "" : String(defaultValue)}
      isRequired={isRequired}
      className={cn("flex flex-col gap-1.5", className)}
    >
      <Label className={labelClass}>{label}</Label>
      <Input placeholder={placeholder} className={inputClass} />
      {description ? <span className="font-sans text-xs text-foreground/50">{description}</span> : null}
    </TextField>
  );
}

export function AreaField({
  name,
  label,
  defaultValue,
  rows = 4,
  className,
  description,
  isRequired,
  mono,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  rows?: number;
  className?: string;
  description?: string;
  isRequired?: boolean;
  mono?: boolean;
}) {
  return (
    <TextField name={name} defaultValue={defaultValue ?? ""} isRequired={isRequired} className={cn("flex flex-col gap-1.5", className)}>
      <Label className={labelClass}>{label}</Label>
      <TextArea
        rows={rows}
        className={cn(inputClass, "min-h-0 py-2 leading-relaxed", mono && "font-mono text-sm")}
      />
      {description ? <span className="font-sans text-xs text-foreground/50">{description}</span> : null}
    </TextField>
  );
}

export interface Option {
  value: string;
  label: string;
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  className,
  onChange,
  placeholder = "Any",
}: {
  name: string;
  label: string;
  options: Option[];
  defaultValue?: string | null;
  className?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Select
      name={name}
      defaultSelectedKey={defaultValue ?? ""}
      onSelectionChange={(key) => onChange?.(String(key ?? ""))}
      className={cn("flex flex-col gap-1.5", className)}
      placeholder={placeholder}
    >
      <Label className={labelClass}>{label}</Label>
      <Button className={cn(inputClass, "flex items-center justify-between gap-2 text-left")}>
        <SelectValue className="truncate data-[placeholder]:text-foreground/50" />
        <ChevronDown className="h-[16px] w-[16px] shrink-0 text-foreground/60" strokeWidth={1.75} aria-hidden />
      </Button>
      <Popover className="w-[var(--trigger-width)] rounded-input border border-foreground/15 bg-background p-1 shadow-card">
        <ListBox className="max-h-72 overflow-auto outline-none">
          {options.map((option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              textValue={option.label}
              className="cursor-pointer rounded-input px-3 py-2 font-sans text-sm text-foreground outline-none data-[focused]:bg-cream data-[focused]:text-primary data-[selected]:font-semibold"
            >
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  );
}

export function CheckField({
  name,
  label,
  defaultSelected,
  className,
}: {
  name: string;
  label: string;
  defaultSelected?: boolean;
  className?: string;
}) {
  return (
    <Checkbox
      name={name}
      value="on"
      defaultSelected={defaultSelected}
      className={cn("group flex min-h-11 cursor-pointer items-center gap-3 font-sans text-sm text-foreground", className)}
    >
      <span
        aria-hidden
        className="flex h-[20px] w-[20px] items-center justify-center rounded-[4px] border border-foreground/15 bg-cream group-data-[selected]:border-primary group-data-[selected]:bg-primary group-data-[focus-visible]:outline group-data-[focus-visible]:outline-2 group-data-[focus-visible]:outline-offset-2 group-data-[focus-visible]:outline-accent"
      >
        <svg viewBox="0 0 12 12" className="hidden h-[12px] w-[12px] text-on-dark group-data-[selected]:block">
          <path d="M2 6.5 4.8 9 10 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {label}
    </Checkbox>
  );
}

export function SubmitButton({
  children,
  pending,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  pending?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Button
      type="submit"
      isDisabled={pending}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full px-[1.25em] py-[0.6em] font-sans text-sm font-medium transition-colors duration-300 data-[disabled]:opacity-60 data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-accent",
        variant === "primary" ? "bg-primary text-on-dark hover:bg-primary/90" : "border border-foreground/15 text-foreground hover:border-foreground/40",
        className,
      )}
    >
      {pending ? "Saving…" : children}
    </Button>
  );
}
