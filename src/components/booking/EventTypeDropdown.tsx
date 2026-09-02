import { useId, useRef } from "react";
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  type Key,
} from "react-aria-components";
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

const OPTIONS: { value: Exclude<EventType, "">; label: string }[] = [
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
  const otherInputRef = useRef<HTMLDivElement>(null);
  const errorId = useId();
  const otherErrorId = useId();

  const isOther = value === "something-else";

  useGSAP(
    () => {
      if (!otherInputRef.current) return;
      gsap.fromTo(
        otherInputRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.35, ease: "power3.out" }
      );
    },
    { dependencies: [isOther] }
  );

  function handleSelectionChange(key: Key | null) {
    onChange((key === null ? "" : String(key)) as EventType);
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Select
        selectedKey={value === "" ? null : value}
        onSelectionChange={handleSelectionChange}
        placeholder="Select event type..."
        isInvalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="flex w-full flex-col gap-2"
      >
        {({ isOpen }) => (
          <>
            <Label className="font-jost text-xs uppercase tracking-wider text-foreground/70">
              Event Type
            </Label>
            <Button
              className={cn(
                "w-full flex items-center justify-between bg-transparent border rounded-input px-4 py-3 font-sans text-left transition-colors focus:outline-none data-focus-visible:border-primary data-focus-visible:ring-2 data-focus-visible:ring-primary/40",
                error
                  ? "border-accent"
                  : isOpen
                    ? "border-primary"
                    : "border-foreground/20 data-hovered:border-foreground/40",
                !value ? "text-foreground/60" : "text-foreground"
              )}
            >
              <SelectValue className="truncate">
                {({ isPlaceholder, selectedText }) =>
                  isPlaceholder ? "Select event type..." : selectedText
                }
              </SelectValue>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "w-5 h-5 text-foreground/50 transition-transform duration-300",
                  isOpen && "rotate-180"
                )}
              />
            </Button>
            <Popover
              offset={8}
              className="w-(--trigger-width) origin-top p-2 bg-background border border-foreground/10 rounded-input shadow-card transition duration-200 ease-out opacity-100 scale-y-100 translate-y-0 data-entering:opacity-0 data-entering:scale-y-95 data-entering:-translate-y-2 data-exiting:opacity-0 data-exiting:scale-y-95 data-exiting:-translate-y-2"
            >
              <ListBox className="outline-none flex flex-col" items={OPTIONS}>
                {(opt) => (
                  <ListBoxItem
                    id={opt.value}
                    textValue={opt.label}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-input cursor-pointer outline-none transition-colors text-left font-sans text-sm text-foreground data-hovered:bg-cream data-focused:bg-cream"
                  >
                    {({ isSelected }) => (
                      <>
                        <span
                          className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                            isSelected ? "border-primary" : "border-foreground/30"
                          )}
                        >
                          {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
                        </span>
                        {opt.label}
                      </>
                    )}
                  </ListBoxItem>
                )}
              </ListBox>
            </Popover>
          </>
        )}
      </Select>

      {error && (
        <p id={errorId} role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}

      {isOther && (
        <div ref={otherInputRef} className="overflow-hidden">
          <input
            type="text"
            value={otherText}
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder="Please describe your event"
            aria-label="Please describe your event"
            aria-invalid={Boolean(otherError)}
            aria-describedby={otherError ? otherErrorId : undefined}
            className={cn(
              "mt-2 w-full bg-transparent border rounded-input px-4 py-3 font-sans text-foreground placeholder:text-foreground/60 focus:outline-none transition-colors",
              otherError ? "border-accent focus:border-accent" : "border-foreground/20 focus:border-primary"
            )}
          />
          {otherError && (
            <p id={otherErrorId} role="alert" className="mt-2 font-sans text-sm text-error">
              {otherError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
