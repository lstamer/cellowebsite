import { useState, useRef, useEffect, useId } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export type EventType = "wedding" | "private-event" | "corporate-event" | "fundraiser" | "something-else" | "";

interface EventTypeDropdownProps {
  value: EventType;
  otherText: string;
  onChange: (type: EventType) => void;
  onOtherChange: (text: string) => void;
  error?: string;
  otherError?: string;
}

const OPTIONS: { value: EventType; label: string }[] = [
  { value: "wedding", label: "Wedding" },
  { value: "private-event", label: "Private Event" },
  { value: "corporate-event", label: "Corporate Event" },
  { value: "fundraiser", label: "Fundraiser" },
  { value: "something-else", label: "Something Else" },
];

export function EventTypeDropdown({
  value,
  otherText,
  onChange,
  onOtherChange,
  error,
  otherError,
}: EventTypeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const otherInputRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const triggerId = useId();
  const errorId = useId();
  const otherErrorId = useId();

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

  useGSAP(() => {
    if (!otherInputRef.current) return;
    if (value === "something-else") {
      gsap.fromTo(
        otherInputRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.35, ease: "power3.out" }
      );
    } else {
      gsap.to(otherInputRef.current, {
        height: 0, opacity: 0, duration: 0.3, ease: "power2.in"
      });
    }
  }, [value]);

  const selectedLabel = OPTIONS.find((o) => o.value === value)?.label || "Select event type...";

  return (
    <div className="flex flex-col gap-2 w-full" ref={containerRef}>
      <label id={labelId} className="font-jost text-xs uppercase tracking-wider text-foreground/70">
        Event Type
      </label>
      <div className="relative">
        <button
          type="button"
          id={triggerId}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={`${labelId} ${triggerId}`}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full flex items-center justify-between bg-transparent border rounded-xl px-4 py-3 font-sans text-left transition-colors focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40",
            error
              ? "border-accent focus:border-accent"
              : isOpen
                ? "border-primary"
                : "border-foreground/20 hover:border-foreground/40",
            !value ? "text-foreground/60" : "text-foreground"
          )}
        >
          {selectedLabel}
          <ChevronDown className={cn("w-5 h-5 text-foreground/50 transition-transform duration-300", isOpen && "rotate-180")} />
        </button>

        <div
          ref={dropdownRef}
          role="listbox"
          aria-labelledby={labelId}
          className="absolute z-50 top-full left-0 right-0 mt-2 p-2 bg-background border border-foreground/10 rounded-xl shadow-lg hidden transform-origin-top"
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-foreground/5 transition-colors text-left font-sans text-sm text-foreground"
            >
              <div className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                value === opt.value ? "border-primary" : "border-foreground/30"
              )}>
                {value === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p id={errorId} role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}

      <div
        ref={otherInputRef}
        aria-hidden={value !== "something-else"}
        className="overflow-hidden h-0 opacity-0"
      >
        <input
          type="text"
          value={otherText}
          onChange={(e) => onOtherChange(e.target.value)}
          placeholder="Please describe your event"
          aria-label="Please describe your event"
          aria-invalid={Boolean(otherError)}
          aria-describedby={otherError ? otherErrorId : undefined}
          tabIndex={value === "something-else" ? undefined : -1}
          className={cn(
            "mt-2 w-full bg-transparent border rounded-xl px-4 py-3 font-sans text-foreground placeholder:text-foreground/60 focus:outline-none transition-colors",
            otherError ? "border-accent focus:border-accent" : "border-foreground/20 focus:border-primary"
          )}
        />
        {otherError && (
          <p id={otherErrorId} role="alert" className="mt-2 font-sans text-sm text-error">
            {otherError}
          </p>
        )}
      </div>
    </div>
  );
}
