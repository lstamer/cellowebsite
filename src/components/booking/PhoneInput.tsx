"use client";

import { useState, useRef, useEffect, useMemo, useId } from "react";
import { AsYouType, getCountries, getCountryCallingCode, CountryCode, parsePhoneNumber } from "libphonenumber-js";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap-client";

interface PhoneInputProps {
  value: string;
  onChange: (phone: string) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
  placeholder?: string;
}

interface CountryOption {
  value: string;
  label: string;
  callingCode: string;
}

// Prepare country options using Intl.DisplayNames, fallback if not available
function getRegionName(country: string) {
  try {
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(country) || country;
  } catch {
    return country;
  }
}

/** ISO code as label — identical on Node vs browsers (avoids hydration mismatch from ICU differences). */
const BASE_COUNTRY_OPTIONS: CountryOption[] = getCountries()
  .map((country) => ({
    value: country,
    label: country,
    callingCode: `+${getCountryCallingCode(country)}`,
  }))
  .sort((a, b) => a.value.localeCompare(b.value, "en"));

export function PhoneInput({
  value,
  onChange,
  onBlur,
  error,
  label = "Phone",
  placeholder = "082 123 4567",
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("ZA");
  const [internalValue, setInternalValue] = useState("");

  /** After mount, swap ISO labels for Intl region names (ICU differs between Node and Chromium). */
  const [intlReady, setIntlReady] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intl labels differ Node vs browser ICU
    setIntlReady(true);
  }, []);

  const countryOptions = useMemo(() => {
    if (!intlReady) return BASE_COUNTRY_OPTIONS;
    return getCountries()
      .map((country) => ({
        value: country,
        label: getRegionName(country),
        callingCode: `+${getCountryCallingCode(country)}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "en"));
  }, [intlReady]);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputId = useId();
  const errorId = useId();
  const listboxId = useId();

  function getOptionId(countryValue: string) {
    return `${listboxId}-option-${countryValue}`;
  }

  // Sync external value -> internal state if we didn't generate it
  useEffect(() => {
    if (!value) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInternalValue("");
      return;
    }
    
    // Check what the current internalValue would generate as E.164
    const formatter = new AsYouType(selectedCountry);
    formatter.input(internalValue);
    const currentE164 = formatter.getNumber()?.number || "";

    // If external value matches what we'd already produce, no update needed
    if (value === currentE164) {
      return;
    }

    // Try parsing the incoming value to update country and text
    try {
      const parsed = parsePhoneNumber(value);
      if (parsed) {
        if (parsed.country && parsed.country !== selectedCountry) {
           
          setSelectedCountry(parsed.country);
        }
         
        setInternalValue(parsed.formatNational());
      } else {
        // Fallback if parsing didn't throw but returned undefined
         
        setInternalValue(value);
      }
    } catch {
      // Partial or invalid external string, we just dump it in
       
      setInternalValue(value);
    }
  }, [value, selectedCountry, internalValue]);

  // Handle typing in the input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInternalValue(text);
    
    const formatter = new AsYouType(selectedCountry);
    formatter.input(text);
    const parsedNumber = formatter.getNumber();
    
    if (parsedNumber && parsedNumber.number) {
      onChange(parsedNumber.number);
    } else {
      // Fallback: If no number could be extracted (e.g. empty or non-digits), clear or reconstruct
      const digits = text.replace(/\D/g, "").replace(/^0+/, "");
      if (digits) {
         onChange(`+${getCountryCallingCode(selectedCountry)}${digits}`);
      } else {
         onChange("");
      }
    }
  };

  const handleCountryChange = (country: CountryCode) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
    triggerRef.current?.focus();

    // Reformat existing internal value for the new country
    const formatter = new AsYouType(country);
    formatter.input(internalValue);
    const parsedNumber = formatter.getNumber();
    
    if (parsedNumber && parsedNumber.number) {
      onChange(parsedNumber.number);
    } else {
      const digits = internalValue.replace(/\D/g, "").replace(/^0+/, "");
      if (digits) {
         onChange(`+${getCountryCallingCode(country)}${digits}`);
      } else {
         onChange("");
      }
    }
  };

  // Close dropdown on outside click or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // GSAP animation for dropdown
  useGSAP(() => {
    if (!dropdownRef.current) return;
    if (isOpen) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, scaleY: 0.95, y: -8 },
        { opacity: 1, scaleY: 1, y: 0, duration: 0.25, ease: "power3.out", display: "flex" }
      );
    } else {
      gsap.to(dropdownRef.current, {
        opacity: 0, scaleY: 0.95, y: -8, duration: 0.2, ease: "power2.in", display: "none"
      });
    }
  }, [isOpen]);

  const formattedDisplay = useMemo(() => {
    const formatter = new AsYouType(selectedCountry);
    return formatter.input(internalValue);
  }, [internalValue, selectedCountry]);

  const selectedOption = countryOptions.find((o) => o.value === selectedCountry);
  const filteredOptions = useMemo(
    () =>
      countryOptions.filter(
        (o) =>
          o.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.callingCode.includes(searchQuery)
      ),
    [countryOptions, searchQuery]
  );

  useEffect(() => {
    if (highlightedIndex < 0) {
      return;
    }

    const highlightedOption = filteredOptions[highlightedIndex];
    if (highlightedOption) {
      document
        .getElementById(`${listboxId}-option-${highlightedOption.value}`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, filteredOptions, listboxId]);

  function moveHighlight(direction: 1 | -1) {
    if (filteredOptions.length === 0) {
      return;
    }

    const lastIndex = filteredOptions.length - 1;
    setHighlightedIndex((current) =>
      direction === 1
        ? current >= lastIndex
          ? 0
          : current + 1
        : current <= 0
          ? lastIndex
          : current - 1
    );
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();

      if (!isOpen) {
        setIsOpen(true);
        const selectedIndex = filteredOptions.findIndex((o) => o.value === selectedCountry);
        setHighlightedIndex(
          selectedIndex >= 0 ? selectedIndex : filteredOptions.length > 0 ? 0 : -1
        );
        return;
      }

      moveHighlight(event.key === "ArrowDown" ? 1 : -1);
      return;
    }

    if (isOpen && event.key === "Home") {
      event.preventDefault();
      setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
      return;
    }

    if (isOpen && event.key === "End") {
      event.preventDefault();
      setHighlightedIndex(filteredOptions.length - 1);
      return;
    }

    if (isOpen && event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      const highlighted = filteredOptions[highlightedIndex];
      if (highlighted) {
        handleCountryChange(highlighted.value as CountryCode);
      }
    }
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      moveHighlight(event.key === "ArrowDown" ? 1 : -1);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const highlighted = highlightedIndex >= 0 ? filteredOptions[highlightedIndex] : undefined;
      if (highlighted) {
        handleCountryChange(highlighted.value as CountryCode);
      }
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full" ref={containerRef}>
      <label htmlFor={inputId} className="font-jost text-xs uppercase tracking-wider text-foreground/70">
        {label}
      </label>
      <div className="relative flex items-stretch">
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          onClick={() => {
            if (isOpen) setHighlightedIndex(-1);
            setIsOpen(!isOpen);
          }}
          onKeyDown={handleTriggerKeyDown}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]
              ? getOptionId(filteredOptions[highlightedIndex].value)
              : undefined
          }
          aria-label={`Country code: ${selectedOption?.label ?? selectedCountry} ${selectedOption?.callingCode ?? ""}`}
          className={cn(
            "flex items-center gap-2 border border-r-0 rounded-l-input px-4 py-3 bg-transparent font-sans text-foreground transition-colors focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 shrink-0",
            error ? "border-accent focus:border-accent" : "border-foreground/20 hover:border-foreground/40",
            isOpen && !error ? "border-primary" : ""
          )}
        >
          <span className="w-6 text-center">{selectedCountry}</span>
          <span className="text-foreground/70">{selectedOption?.callingCode}</span>
          <ChevronDown className={cn("w-4 h-4 text-foreground/50 transition-transform duration-300", isOpen && "rotate-180")} />
        </button>

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
            "w-full bg-transparent border rounded-r-input py-3 pr-4 pl-4 font-sans text-foreground placeholder:text-foreground/60 focus:outline-none transition-colors",
            error ? "border-accent focus:border-accent border-l-0" : "border-foreground/20 focus:border-primary border-l-0 focus:border-l"
          )}
        />

        <div
          ref={dropdownRef}
          className="absolute z-20 top-full left-0 w-[320px] max-w-[calc(100vw-2rem)] mt-2 bg-background border border-foreground/10 rounded-input shadow-card hidden flex-col"
        >
          <div className="p-2 border-b border-foreground/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search countries..."
                aria-label="Search countries"
                aria-controls={listboxId}
                aria-activedescendant={
                  highlightedIndex >= 0 && filteredOptions[highlightedIndex]
                    ? getOptionId(filteredOptions[highlightedIndex].value)
                    : undefined
                }
                className="w-full bg-cream border border-transparent rounded-input py-2 pl-9 pr-4 font-sans text-sm text-foreground placeholder:text-foreground/70 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div id={listboxId} role="listbox" aria-label="Countries" className="max-h-60 overflow-y-auto p-2 flex flex-col gap-1">
            {filteredOptions.map((opt, index) => (
              <button
                key={opt.value}
                id={getOptionId(opt.value)}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={selectedCountry === opt.value}
                onClick={() => handleCountryChange(opt.value as CountryCode)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-input hover:bg-foreground/5 transition-colors text-left font-sans text-sm",
                  selectedCountry === opt.value ? "text-primary bg-cream" : "text-foreground",
                  index === highlightedIndex && "bg-foreground/5"
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="w-5 text-center font-medium opacity-70">{opt.value}</span>
                  <span className="truncate">{opt.label}</span>
                </div>
                <span className="text-foreground/70 shrink-0">{opt.callingCode}</span>
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-foreground/70 font-sans">
                No countries found
              </div>
            )}
          </div>
        </div>
      </div>
      {error && (
        <p id={errorId} role="alert" className="font-sans text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
