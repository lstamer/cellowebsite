"use client";

import { useState, useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface CalendarPickerProps {
  value: string;
  isUnsure: boolean;
  onChange: (date: string) => void;
  onUnsureChange: (unsure: boolean) => void;
  error?: string;
}

const PLACEHOLDER_GRID_KEYS = Array.from({ length: 42 }, (_, i) => `cal-ph-${i}`);

export function CalendarPicker({
  value,
  isUnsure,
  onChange,
  onUnsureChange,
  error,
}: CalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  /** Only set after mount so SSR and first client paint match (Node vs browser timezone). */
  const [calendarReady, setCalendarReady] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    // Anchor calendar to browser timezone after mount; SSR + first paint must match.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-only upgrade
    setCalendarReady(true);
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useGSAP(() => {
    if (!dropdownRef.current) return;
    if (isOpen) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, scaleY: 0.95, y: -8 },
        { opacity: 1, scaleY: 1, y: 0, duration: 0.25, ease: "power3.out", display: "block" }
      );
    } else {
      gsap.to(dropdownRef.current, {
        opacity: 0,
        scaleY: 0.95,
        y: -8,
        duration: 0.2,
        ease: "power2.in",
        display: "none",
      });
    }
  }, [isOpen]);

  const prevMonth = () => {
    if (!calendarReady || !currentDate) return;
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    if (!calendarReady || !currentDate) return;
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderDays = () => {
    if (!calendarReady || !currentDate) {
      return PLACEHOLDER_GRID_KEYS.map((key) => <div key={key} className="h-8 w-8" aria-hidden />);
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dateString = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const isSelected = !isUnsure && value === dateString;
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      days.push(
        <button
          key={i}
          type="button"
          disabled={isPast}
          onClick={() => {
            onChange(dateString);
            onUnsureChange(false);
            setIsOpen(false);
          }}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full font-sans text-sm transition-colors",
            isPast ? "cursor-not-allowed text-foreground/20" : "text-foreground hover:bg-foreground/10",
            isSelected && "bg-primary text-background hover:bg-primary/90",
            isToday && !isSelected && "border border-primary text-primary"
          )}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  const displayValue = isUnsure ? "Flexible / TBD" : value || "Select a date...";

  return (
    <div className="flex w-full flex-col gap-2" ref={containerRef}>
      <label className="font-jost text-xs uppercase tracking-wider text-foreground/50">Date(s)</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border bg-transparent px-4 py-3 text-left font-sans transition-colors focus:outline-none",
            error
              ? "border-accent focus:border-accent"
              : isOpen
                ? "border-primary"
                : "border-foreground/20 hover:border-foreground/40",
            !value && !isUnsure ? "text-foreground/30" : "text-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 opacity-50" />
            {displayValue}
          </span>
        </button>

        <div
          ref={dropdownRef}
          className="absolute top-full left-0 z-10 mt-2 hidden w-72 origin-top transform rounded-xl border border-foreground/10 bg-background p-4 shadow-lg"
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!calendarReady}
              className={cn(
                "rounded-md p-1 transition-colors hover:bg-foreground/5",
                !calendarReady && "pointer-events-none opacity-40"
              )}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5 text-foreground/70" />
            </button>
            <div className="min-h-[1.25rem] text-center font-sans text-sm font-medium text-foreground">
              {calendarReady && currentDate ? (
                currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
              ) : (
                <span className="inline-block min-w-[10rem] rounded bg-foreground/5" aria-hidden />
              )}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              disabled={!calendarReady}
              className={cn(
                "rounded-md p-1 transition-colors hover:bg-foreground/5",
                !calendarReady && "pointer-events-none opacity-40"
              )}
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5 text-foreground/70" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center font-jost text-xs text-foreground/50">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 place-items-center gap-1">{renderDays()}</div>

          <div className="mt-4 border-t border-foreground/10 pt-4">
            <label className="group flex w-fit cursor-pointer items-center gap-3">
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                  isUnsure ? "border-primary bg-primary" : "border-foreground/30 group-hover:border-foreground/50"
                )}
              >
                {isUnsure && <div className="h-2 w-2 rounded-sm bg-background" />}
              </div>
              <span className="select-none font-sans text-sm text-foreground/80">I&apos;m not sure yet</span>
              <input
                type="checkbox"
                className="hidden"
                checked={isUnsure}
                onChange={(e) => {
                  onUnsureChange(e.target.checked);
                  if (e.target.checked) setIsOpen(false);
                }}
              />
            </label>
          </div>
        </div>
      </div>
      {error && <p className="font-sans text-sm text-accent">{error}</p>}
    </div>
  );
}
