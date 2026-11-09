"use client";

import { useId, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Button,
  DatePicker,
  Dialog,
  Group,
  Label,
  Popover,
  useLocale,
} from "react-aria-components";
import {
  CalendarDate,
  DateFormatter,
  getLocalTimeZone,
  parseDate,
  today,
} from "@internationalized/date";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";

const CalendarPanel = dynamic(
  () => import("@/components/booking/CalendarPanel").then((mod) => mod.CalendarPanel),
  { loading: () => <p role="status" className="p-3 font-sans text-sm">Loading dates…</p> },
);

interface CalendarPickerProps {
  value: string;
  isUnsure: boolean;
  onChange: (date: string) => void;
  onUnsureChange: (unsure: boolean) => void;
  error?: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDate(value: string): CalendarDate | null {
  if (!ISO_DATE.test(value)) return null;
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

export function CalendarPicker({
  value,
  isUnsure,
  onChange,
  onUnsureChange,
  error,
}: CalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const errorId = useId();
  const { locale } = useLocale();

  const selected = useMemo(() => parseIsoDate(value), [value]);
  const formatter = useMemo(
    () => new DateFormatter(locale, { day: "numeric", month: "long", year: "numeric" }),
    [locale]
  );
  const minValue = useMemo(() => today(getLocalTimeZone()), []);

  const displayValue = isUnsure
    ? "Flexible / TBD"
    : selected
      ? formatter.format(selected.toDate(getLocalTimeZone()))
      : "Select a date...";

  return (
    <DatePicker
      value={isUnsure ? null : selected}
      minValue={minValue}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      onChange={(date) => {
        if (!date) return;
        onChange(date.toString());
        onUnsureChange(false);
      }}
      aria-describedby={error ? errorId : undefined}
      className="flex w-full flex-col gap-2"
    >
      <Label className="font-jost text-xs uppercase tracking-wider text-foreground/70">Date(s)</Label>
      <Group className="relative">
        <Button
          className={cn(
            "flex w-full items-center justify-between rounded-input border bg-transparent px-4 py-3 text-left font-sans transition-colors outline-none data-focus-visible:border-primary data-focus-visible:ring-2 data-focus-visible:ring-primary/40",
            error
              ? "border-accent"
              : isOpen
                ? "border-primary"
                : "border-foreground/20 data-hovered:border-foreground/40",
            !selected && !isUnsure ? "text-foreground/60" : "text-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 opacity-50" aria-hidden />
            {displayValue}
          </span>
        </Button>
      </Group>

      <Popover
        offset={8}
        placement="bottom start"
        className="w-84 max-w-[calc(100vw-2rem)] origin-top overflow-y-auto rounded-input border border-foreground/10 bg-background p-4 shadow-card transition-[opacity,transform] duration-200 ease-out data-entering:-translate-y-2 data-entering:opacity-0 data-exiting:-translate-y-2 data-exiting:opacity-0"
      >
        <Dialog aria-label="Choose a date" className="outline-none">
          <CalendarPanel
            minValue={minValue}
            isUnsure={isUnsure}
            onUnsureChange={(checked) => {
              onUnsureChange(checked);
              if (checked) setIsOpen(false);
            }}
          />
        </Dialog>
      </Popover>

      {error && (
        <p id={errorId} role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
    </DatePicker>
  );
}
