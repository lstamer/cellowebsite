"use client";

import { useId, useMemo, useState } from "react";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumber,
  type CountryCode,
} from "libphonenumber-js";
import {
  Button,
  ComboBox,
  Group,
  Input,
  ListBox,
  ListBoxItem,
  Popover,
  useFilter,
  useLocale,
  type Key,
} from "react-aria-components";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (phone: string) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
  placeholder?: string;
}

interface CountryOption {
  id: CountryCode;
  flag: string;
  callingCode: string;
  /** Deterministic (no ICU): shown in the combobox input and used as the item's textValue. */
  textValue: string;
}

/** Regional-indicator flag emoji from an ISO 3166-1 alpha-2 code. Pure string maths, identical on Node and browsers. */
function flagEmoji(code: string) {
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

const COUNTRY_OPTIONS: CountryOption[] = getCountries().map((id) => {
  const callingCode = `+${getCountryCallingCode(id)}`;
  const flag = flagEmoji(id);
  return { id, flag, callingCode, textValue: `${flag} ${callingCode}` };
});

const OPTION_BY_ID = new Map(COUNTRY_OPTIONS.map((o) => [o.id, o]));
const OPTION_BY_TEXT = new Map(COUNTRY_OPTIONS.map((o) => [o.textValue, o.id]));

function isCountryCode(key: Key | null): key is CountryCode {
  return typeof key === "string" && OPTION_BY_ID.has(key as CountryCode);
}

/** E.164 for a country + free text, or "" when there are no digits. Mirrors the server's isValidPhoneNumber contract. */
function toE164(country: CountryCode, text: string) {
  const formatter = new AsYouType(country);
  formatter.input(text);
  const parsed = formatter.getNumber();
  if (parsed?.number) return parsed.number;
  const digits = text.replace(/\D/g, "").replace(/^0+/, "");
  return digits ? `+${getCountryCallingCode(country)}${digits}` : "";
}

/** Country + national display text for an externally supplied value; keeps the current country when it cannot be inferred. */
function parseExternal(
  value: string,
  fallbackCountry: CountryCode,
): { country: CountryCode; text: string } {
  if (!value) return { country: fallbackCountry, text: "" };
  try {
    const parsed = parsePhoneNumber(value);
    // Numbers libphonenumber cannot attribute to a region still carry a calling code; pick a country for it.
    const byCallingCode = COUNTRY_OPTIONS.find(
      (o) => o.callingCode === `+${parsed.countryCallingCode}`,
    )?.id;
    return {
      country: parsed.country ?? byCallingCode ?? fallbackCountry,
      text: parsed.formatNational(),
    };
  } catch {
    return { country: fallbackCountry, text: value };
  }
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  error,
  label = "Phone",
  placeholder = "082 123 4567",
}: PhoneInputProps) {
  const { locale } = useLocale();
  const { contains } = useFilter({ sensitivity: "base" });

  // Derive the initial country and display text from any value the parent already holds.
  const initial = useMemo(() => parseExternal(value, "ZA"), [value]);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    initial.country,
  );
  const [internalValue, setInternalValue] = useState(initial.text);
  const [countryInput, setCountryInput] = useState(
    OPTION_BY_ID.get(initial.country)?.textValue ?? "",
  );

  /** The last E.164 we emitted; an incoming `value` equal to it is our own echo and needs no re-sync. */
  const [lastEmitted, setLastEmitted] = useState(value);

  // Sync an externally supplied value (e.g. the parent restoring "+27821234567") into the field.
  // Done during render (React's "adjust state on prop change" pattern) instead of an effect.
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (value !== lastEmitted) {
      setLastEmitted(value);
      const next = parseExternal(value, selectedCountry);
      setInternalValue(next.text);
      if (next.country !== selectedCountry) {
        setSelectedCountry(next.country);
        setCountryInput(OPTION_BY_ID.get(next.country)?.textValue ?? "");
      }
    }
  }

  /** Localised country names. Only ever rendered inside the popover (client-only), so ICU differences cannot cause a hydration mismatch. */
  const countryNames = useMemo(() => {
    const names = new Map<CountryCode, string>();
    let display: Intl.DisplayNames | null = null;
    try {
      display = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      display = null;
    }
    for (const option of COUNTRY_OPTIONS) {
      let name: string | undefined;
      try {
        name = display?.of(option.id) ?? undefined;
      } catch {
        name = undefined;
      }
      names.set(option.id, name ?? option.id);
    }
    return names;
  }, [locale]);

  const sortedOptions = useMemo(
    () =>
      [...COUNTRY_OPTIONS].sort((a, b) =>
        (countryNames.get(a.id) ?? a.id).localeCompare(
          countryNames.get(b.id) ?? b.id,
          locale,
        ),
      ),
    [countryNames, locale],
  );

  const emit = (country: CountryCode, text: string) => {
    const next = toE164(country, text);
    setLastEmitted(next);
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInternalValue(text);
    emit(selectedCountry, text);
  };

  /** Typing over the closed "flag +27" display starts a fresh search instead of appending to it. */
  const handleCountryInputChange = (next: string) => {
    const current = OPTION_BY_ID.get(selectedCountry)?.textValue ?? "";
    const isAppendingToDisplay =
      countryInput === current &&
      next.length > current.length &&
      next.startsWith(current);
    setCountryInput(isAppendingToDisplay ? next.slice(current.length) : next);
  };

  const handleCountrySelection = (key: Key | null) => {
    // RAC hands back the current key on blur/Escape when the search text was left mid-edit; snap the input back.
    const country = isCountryCode(key) ? key : selectedCountry;
    setCountryInput(OPTION_BY_ID.get(country)?.textValue ?? "");
    if (country === selectedCountry) return;
    setSelectedCountry(country);
    emit(country, internalValue);
  };

  const formattedDisplay = useMemo(
    () => new AsYouType(selectedCountry).input(internalValue),
    [internalValue, selectedCountry],
  );
  const inputId = useId();
  const errorId = useId();

  return (
    <div className="flex w-full flex-col gap-2">
      <label
        htmlFor={inputId}
        className="font-jost text-xs uppercase tracking-wider text-foreground/70"
      >
        {label}
      </label>
      <ComboBox
        aria-label="Country code"
        defaultItems={sortedOptions}
        selectedKey={selectedCountry}
        onSelectionChange={handleCountrySelection}
        inputValue={countryInput}
        onInputChange={handleCountryInputChange}
        onOpenChange={(open, trigger) => {
          // Opened via ArrowDown or the chevron: clear the display so the whole list shows and typing filters it.
          if (open && trigger === "manual") setCountryInput("");
        }}
        defaultFilter={(textValue, input) =>
          contains(textValue, input) ||
          contains(
            countryNames.get(OPTION_BY_TEXT.get(textValue) ?? "ZA") ?? "",
            input,
          )
        }
        className="relative flex items-stretch"
      >
        {({ isOpen }) => (
          <>
            <Group
              className={cn(
                "flex shrink-0 items-stretch rounded-l-input border border-r-0 bg-transparent transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/40",
                error
                  ? "border-accent focus-within:border-accent"
                  : "border-foreground/20 hover:border-foreground/40",
                isOpen && !error ? "border-primary" : "",
              )}
            >
              <Input
                autoComplete="off"
                placeholder="Search"
                className="w-[5.75rem] bg-transparent py-3 pl-4 pr-1 font-sans text-foreground outline-none placeholder:text-foreground/60"
              />
              <Button
                aria-label="Choose country"
                className="flex cursor-pointer items-center pr-3 pl-1 text-foreground/50 outline-none transition-colors data-hovered:text-foreground data-focus-visible:text-primary"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    isOpen && "rotate-180",
                  )}
                />
              </Button>
            </Group>

            <input
              id={inputId}
              type="tel"
              value={formattedDisplay}
              onChange={handleInputChange}
              onBlur={onBlur}
              placeholder={placeholder}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className={cn(
                "w-full min-w-0 rounded-r-input border bg-transparent py-3 pr-4 pl-4 font-sans text-foreground transition-colors placeholder:text-foreground/60 focus:outline-none",
                error
                  ? "border-l-0 border-accent focus:border-accent"
                  : "border-l-0 border-foreground/20 focus:border-l focus:border-primary",
              )}
            />

            <Popover
              placement="bottom start"
              offset={8}
              className="w-[320px] max-w-[calc(100vw-2rem)] origin-top rounded-input border border-foreground/10 bg-background p-2 shadow-card transition duration-200 ease-out opacity-100 translate-y-0 data-entering:opacity-0 data-entering:-translate-y-2 data-exiting:opacity-0 data-exiting:-translate-y-2"
            >
              <ListBox
                aria-label="Countries"
                className="flex max-h-60 flex-col gap-1 overflow-y-auto outline-none"
                renderEmptyState={() => (
                  <div className="px-3 py-4 text-center font-sans text-sm text-foreground/50">
                    No countries found
                  </div>
                )}
              >
                {(option: CountryOption) => (
                  <ListBoxItem
                    id={option.id}
                    textValue={option.textValue}
                    className="flex w-full cursor-pointer items-center justify-between rounded-input px-3 py-2.5 text-left font-sans text-sm text-foreground outline-none transition-colors data-hovered:bg-cream data-focused:bg-cream data-selected:bg-primary/5 data-selected:text-primary"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="w-5 text-center">{option.flag}</span>
                      <span className="truncate">
                        {countryNames.get(option.id) ?? option.id}
                      </span>
                    </div>
                    <span className="shrink-0 text-foreground/50">
                      {option.callingCode}
                    </span>
                  </ListBoxItem>
                )}
              </ListBox>
            </Popover>
          </>
        )}
      </ComboBox>
      {error && (
        <p id={errorId} role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
