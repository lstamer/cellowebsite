"use client";

import { useId, useMemo, useState } from "react";
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Checkbox,
  DatePicker,
  Dialog,
  Group,
  Heading,
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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

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
          <Calendar className="w-full">
            <header className="mb-3 flex items-center justify-between">
              <Button
                slot="previous"
                className="rounded-input p-1 outline-none transition-colors data-hovered:bg-foreground/5 data-focus-visible:ring-2 data-focus-visible:ring-primary/40 data-disabled:opacity-40"
              >
                <ChevronLeft className="h-5 w-5 text-foreground/70" aria-hidden />
              </Button>
              <Heading className="text-center font-sans text-sm font-medium text-foreground" />
              <Button
                slot="next"
                className="rounded-input p-1 outline-none transition-colors data-hovered:bg-foreground/5 data-focus-visible:ring-2 data-focus-visible:ring-primary/40 data-disabled:opacity-40"
              >
                <ChevronRight className="h-5 w-5 text-foreground/70" aria-hidden />
              </Button>
            </header>

            <CalendarGrid weekdayStyle="short" className="w-full border-separate border-spacing-1">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="text-center font-jost text-xs font-normal text-foreground/50">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className={cn(
                      "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full font-sans text-sm text-foreground outline-none transition-colors sm:h-10 sm:w-10",
                      "data-hovered:bg-foreground/10",
                      "data-focus-visible:ring-2 data-focus-visible:ring-primary/40",
                      "data-selected:bg-primary data-selected:text-on-dark data-selected:data-hovered:bg-primary/90",
                      "data-disabled:cursor-not-allowed data-disabled:text-foreground/20 data-disabled:data-hovered:bg-transparent",
                      "data-outside-month:hidden"
                    )}
                  >
                    {({ formattedDate, isSelected, isDisabled, date: cellDate }) => (
                      <span
                        className={cn(
                          "flex h-full w-full items-center justify-center rounded-full",
                          !isSelected &&
                            !isDisabled &&
                            cellDate.compare(minValue) === 0 &&
                            "border border-primary text-primary"
                        )}
                      >
                        {formattedDate}
                      </span>
                    )}
                  </CalendarCell>
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>

          <div className="mt-3 border-t border-foreground/10 pt-3">
            <Checkbox
              isSelected={isUnsure}
              onChange={(checked) => {
                onUnsureChange(checked);
                if (checked) setIsOpen(false);
              }}
              className="group flex w-fit cursor-pointer items-center gap-3 py-1 outline-none"
            >
              {({ isSelected, isFocusVisible }) => (
                <>
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                      isSelected ? "border-primary bg-primary" : "border-foreground/30 group-data-hovered:border-foreground/50",
                      isFocusVisible && "ring-2 ring-primary/40"
                    )}
                  >
                    {isSelected && <span className="h-2 w-2 rounded-sm bg-background" />}
                  </span>
                  <span className="select-none font-sans text-sm text-foreground/80">I&apos;m not sure yet</span>
                </>
              )}
            </Checkbox>
          </div>
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
