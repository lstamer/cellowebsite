"use client";

import { RangeSlider } from "@/components/booking/RangeSlider";

interface GuestSliderProps {
  value: number;
  onChange: (count: number) => void;
  /** When true, label matches optional step-2 sliders (e.g. performance length). */
  optional?: boolean;
}

const MIN_GUESTS = 1;
const MAX_GUESTS = 200;

function formatGuests(value: number) {
  return value >= MAX_GUESTS ? `${MAX_GUESTS}+` : String(value);
}

function announceGuests(value: number) {
  return value >= MAX_GUESTS ? `${MAX_GUESTS} or more guests` : `${value} guests`;
}

export function GuestSlider({ value, onChange, optional }: GuestSliderProps) {
  return (
    <RangeSlider
      label="Guest count"
      value={value}
      min={MIN_GUESTS}
      max={MAX_GUESTS}
      step={1}
      minLabel={String(MIN_GUESTS)}
      maxLabel={`${MAX_GUESTS}+`}
      optional={optional}
      formatValue={formatGuests}
      formatAnnouncement={announceGuests}
      onChange={onChange}
    />
  );
}
