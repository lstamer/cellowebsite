import { cn } from "@/lib/utils";

interface GuestSliderProps {
  value: number;
  onChange: (count: number) => void;
  /** When true, label matches optional step-2 sliders (e.g. performance length). */
  optional?: boolean;
}

const MIN_GUESTS = 1;
const MAX_GUESTS = 200;
const THUMB_SIZE_REM = 1.5;

export function GuestSlider({ value, onChange, optional }: GuestSliderProps) {
  const percent = ((value - MIN_GUESTS) / (MAX_GUESTS - MIN_GUESTS)) * 100;
  const thumbOffset = (0.5 - percent / 100) * THUMB_SIZE_REM;
  const bubblePosition = `calc(${percent}% + ${thumbOffset.toFixed(4)}rem)`;

  return (
    <div className="flex flex-col gap-4 w-full">
      <label
        htmlFor="book-guest-count"
        className="font-jost text-xs uppercase tracking-wider text-foreground/70"
      >
        Guest count
        {optional ? (
          <span className="normal-case tracking-normal text-foreground/60"> (optional)</span>
        ) : null}
      </label>
      
      <div className="relative pt-6 pb-2 w-full">
        <div
          className="pointer-events-none absolute top-0 w-12 -translate-x-1/2 rounded-input border border-foreground/10 bg-background py-1 text-center font-sans text-sm font-medium text-foreground shadow-card"
          style={{ left: bubblePosition }}
        >
          {value >= MAX_GUESTS ? "200+" : value}
        </div>
        
        <input
          id="book-guest-count"
          type="range"
          min={MIN_GUESTS}
          max={MAX_GUESTS}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className={cn(
            "guest-slider-range h-6 w-full cursor-pointer appearance-none rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20"
          )}
        />
        
        <div className="flex justify-between text-xs font-sans text-foreground/50 mt-2">
          <span>{MIN_GUESTS}</span>
          <span>200+</span>
        </div>
      </div>
    </div>
  );
}
