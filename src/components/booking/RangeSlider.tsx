"use client";

import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  Button,
  Input,
  Label,
  NumberField,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from "react-aria-components";
import { cn } from "@/lib/utils";

interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
  optional?: boolean;
  /** Text shown in the value chip, e.g. "105 min" or "200+". */
  formatValue: (value: number) => string;
  /** Announced on the value chip, e.g. "105 minutes" or "200 or more guests". */
  formatAnnouncement: (value: number) => string;
  /** Drives the slider thumb's screen-reader value announcement. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Static unit shown beside the input while typing, e.g. "min". */
  inputSuffix?: string;
  onChange: (value: number) => void;
}

const VALUE_CHIP = "shrink-0 rounded-input px-3 py-1 font-sans text-sm font-medium";

export function RangeSlider({
  label,
  value,
  min,
  max,
  step,
  minLabel,
  maxLabel,
  optional,
  formatValue,
  formatAnnouncement,
  formatOptions,
  inputSuffix,
  onChange,
}: RangeSliderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const valueButtonRef = useRef<HTMLButtonElement>(null);
  const valueOnOpenRef = useRef(value);
  const didCancelRef = useRef(false);

  function openEditor() {
    valueOnOpenRef.current = value;
    didCancelRef.current = false;
    setIsEditing(true);
  }

  // React Aria's NumberField commits on blur, so this runs after the new value lands.
  function closeEditor() {
    setIsEditing(false);
    if (didCancelRef.current) {
      didCancelRef.current = false;
      onChange(valueOnOpenRef.current);
    }
    requestAnimationFrame(() => valueButtonRef.current?.focus());
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" && event.key !== "Escape") return;
    didCancelRef.current = event.key === "Escape";
    const input = event.currentTarget;
    requestAnimationFrame(() => input.blur());
  }

  return (
    <Slider
      value={value}
      onChange={onChange}
      minValue={min}
      maxValue={max}
      step={step}
      formatOptions={formatOptions}
      className="flex w-full flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-4">
        <Label className="font-jost text-xs uppercase tracking-wider text-foreground/70">
          {label}
          {optional ? (
            <span className="normal-case tracking-normal text-foreground/60"> (optional)</span>
          ) : null}
        </Label>

        {isEditing ? (
          <div
            className={cn(
              VALUE_CHIP,
              "flex items-center gap-1 border border-primary bg-background text-foreground",
              "focus-within:ring-2 focus-within:ring-primary/40"
            )}
          >
            <NumberField
              aria-label={`${label}, type a value`}
              value={value}
              onChange={onChange}
              minValue={min}
              maxValue={max}
              step={step}
            >
              <Input
                autoFocus
                inputMode="numeric"
                onFocus={(event) => event.currentTarget.select()}
                onBlur={closeEditor}
                onKeyDown={handleInputKeyDown}
                className="w-10 bg-transparent text-right tabular-nums focus:outline-none"
              />
            </NumberField>
            {inputSuffix ? (
              <span aria-hidden="true">{inputSuffix}</span>
            ) : null}
          </div>
        ) : (
          <Button
            ref={valueButtonRef}
            onPress={openEditor}
            aria-label={`${label}: ${formatAnnouncement(value)}. Activate to type a value.`}
            className={cn(
              VALUE_CHIP,
              "border border-foreground/20 bg-background text-foreground transition-colors",
              "hover:border-primary focus:outline-none data-focus-visible:border-primary data-focus-visible:ring-2 data-focus-visible:ring-primary/40"
            )}
          >
            <SliderOutput>{formatValue(value)}</SliderOutput>
          </Button>
        )}
      </div>

      <SliderTrack className="relative flex h-6 w-full cursor-pointer items-center">
        {({ state }) => (
          <>
            <div className="absolute h-2 w-full rounded-full bg-foreground/10" />
            <div
              className="absolute h-2 rounded-full bg-primary"
              style={{ width: `${state.getThumbPercent(0) * 100}%` }}
            />
            <SliderThumb
              className={cn(
                "top-1/2 h-6 w-6 rounded-full border border-primary/20 bg-primary shadow-[0_0_0_0.25rem_color-mix(in_srgb,var(--color-primary)_14%,transparent)]",
                "focus:outline-none data-focus-visible:ring-2 data-focus-visible:ring-primary/40 data-focus-visible:ring-offset-2 data-focus-visible:ring-offset-background"
              )}
            />
          </>
        )}
      </SliderTrack>

      <div className="flex justify-between font-sans text-xs text-foreground/60">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </Slider>
  );
}
