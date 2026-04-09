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
  const [currentDate, setCurrentDate] = useState(new Date());

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
        opacity: 0, scaleY: 0.95, y: -8, duration: 0.2, ease: "power2.in", display: "none"
      });
    }
  }, [isOpen]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const dateString = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const isSelected = !isUnsure && value === dateString;
      const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

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
            "w-8 h-8 flex items-center justify-center rounded-full text-sm font-sans transition-colors",
            isPast ? "text-foreground/20 cursor-not-allowed" : "hover:bg-foreground/10 text-foreground",
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
    <div className="flex flex-col gap-2 w-full" ref={containerRef}>
      <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
        Date(s)
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between bg-transparent border rounded-xl px-4 py-3 font-sans text-left transition-colors focus:outline-none",
            error
              ? "border-accent focus:border-accent"
              : isOpen
                ? "border-primary"
                : "border-foreground/20 hover:border-foreground/40",
            (!value && !isUnsure) ? "text-foreground/30" : "text-foreground"
          )}
        >
          <span className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 opacity-50" />
            {displayValue}
          </span>
        </button>

        <div
          ref={dropdownRef}
          className="absolute z-10 top-full left-0 mt-2 p-4 bg-background border border-foreground/10 rounded-xl shadow-lg hidden transform-origin-top w-72"
        >
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={prevMonth} className="p-1 hover:bg-foreground/5 rounded-md transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground/70" />
            </button>
            <div className="font-sans font-medium text-sm text-foreground">
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
            <button type="button" onClick={nextMonth} className="p-1 hover:bg-foreground/5 rounded-md transition-colors">
              <ChevronRight className="w-5 h-5 text-foreground/70" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-mono text-foreground/50">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d}>{d}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-1 place-items-center">
            {renderDays()}
          </div>

          <div className="mt-4 pt-4 border-t border-foreground/10">
            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <div className={cn(
                "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                isUnsure ? "bg-primary border-primary" : "border-foreground/30 group-hover:border-foreground/50"
              )}>
                {isUnsure && <div className="w-2 h-2 rounded-sm bg-background" />}
              </div>
              <span className="font-sans text-sm text-foreground/80 select-none">I&apos;m not sure yet</span>
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
