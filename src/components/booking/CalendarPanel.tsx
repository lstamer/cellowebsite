"use client";

import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Checkbox,
  Heading,
} from "react-aria-components";
import type { CalendarDate } from "@internationalized/date";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CalendarPanel({
  minValue,
  isUnsure,
  onUnsureChange,
}: {
  minValue: CalendarDate;
  isUnsure: boolean;
  onUnsureChange: (unsure: boolean) => void;
}) {
  return (
    <>
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
          onChange={onUnsureChange}
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
    </>
  );
}
