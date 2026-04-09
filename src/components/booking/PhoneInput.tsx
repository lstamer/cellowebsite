"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { AsYouType, getCountries, getCountryCallingCode, CountryCode, parsePhoneNumber } from "libphonenumber-js";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface PhoneInputProps {
  value: string;
  onChange: (phone: string) => void;
  onBlur?: () => void;
  error?: string;
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

const COUNTRY_OPTIONS = getCountries()
  .map((country) => ({
    value: country,
    label: getRegionName(country),
    callingCode: `+${getCountryCallingCode(country)}`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function PhoneInput({ value, onChange, onBlur, error }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("ZA");
  const [internalValue, setInternalValue] = useState("");
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const selectedOption = COUNTRY_OPTIONS.find((o) => o.value === selectedCountry);
  const filteredOptions = COUNTRY_OPTIONS.filter(
    (o) =>
      o.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.callingCode.includes(searchQuery)
  );

  return (
    <div className="flex flex-col gap-2 w-full" ref={containerRef}>
      <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
        Phone
      </label>
      <div className="relative flex items-stretch">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 border border-r-0 rounded-l-xl px-4 py-3 bg-transparent font-sans text-foreground transition-colors focus:outline-none shrink-0",
            error ? "border-accent focus:border-accent" : "border-foreground/20 hover:border-foreground/40",
            isOpen && !error ? "border-primary" : ""
          )}
        >
          <span className="w-6 text-center">{selectedCountry}</span>
          <span className="text-foreground/50">{selectedOption?.callingCode}</span>
          <ChevronDown className={cn("w-4 h-4 text-foreground/50 transition-transform duration-300", isOpen && "rotate-180")} />
        </button>

        <input
          type="tel"
          value={formattedDisplay}
          onChange={handleInputChange}
          onBlur={onBlur}
          placeholder="082 123 4567"
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full bg-transparent border rounded-r-xl py-3 pr-4 pl-4 font-sans text-foreground placeholder:text-foreground/30 focus:outline-none transition-colors",
            error ? "border-accent focus:border-accent border-l-0" : "border-foreground/20 focus:border-primary border-l-0 focus:border-l"
          )}
        />

        <div
          ref={dropdownRef}
          className="absolute z-20 top-full left-0 w-[320px] max-w-[calc(100vw-2rem)] mt-2 bg-background border border-foreground/10 rounded-xl shadow-lg hidden flex-col"
        >
          <div className="p-2 border-b border-foreground/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search countries..."
                className="w-full bg-foreground/5 border border-transparent rounded-lg py-2 pl-9 pr-4 font-sans text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-2 flex flex-col gap-1">
            {filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleCountryChange(opt.value as CountryCode)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-foreground/5 transition-colors text-left font-sans text-sm",
                  selectedCountry === opt.value ? "text-primary bg-primary/5" : "text-foreground"
                )}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="w-5 text-center font-medium opacity-70">{opt.value}</span>
                  <span className="truncate">{opt.label}</span>
                </div>
                <span className="text-foreground/50 shrink-0">{opt.callingCode}</span>
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-foreground/50 font-sans">
                No countries found
              </div>
            )}
          </div>
        </div>
      </div>
      {error && <p className="font-sans text-sm text-accent">{error}</p>}
    </div>
  );
}
