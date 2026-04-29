"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { cn } from "@/lib/utils";

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: string) => void;
  onBlur?: () => void;
  error?: string;
}

type AutocompleteError = "missing-key" | "load-failed" | "suggestions-failed" | null;

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLEMAPS_JS_API_KEY;
const AUTOCOMPLETE_UNAVAILABLE_MESSAGE =
  "Place suggestions are unavailable right now. You can still enter the venue manually.";
let hasConfiguredMaps = false;

function logAutocompleteError(message: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[LocationAutocomplete] ${message}`, error);
  }
}

export function LocationAutocomplete({ value, onChange, onBlur, error }: LocationAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const requestIdRef = useRef(0);

  const [isAutocompleteReady, setIsAutocompleteReady] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [hasFetchedSuggestions, setHasFetchedSuggestions] = useState(false);
  const [predictions, setPredictions] = useState<google.maps.places.PlacePrediction[]>([]);
  const [autocompleteError, setAutocompleteError] = useState<AutocompleteError>(null);

  const trimmedValue = value.trim();
  const shouldShowDropdown =
    isInputFocused &&
    trimmedValue.length >= 2 &&
    (isFetchingSuggestions ||
      hasFetchedSuggestions ||
      predictions.length > 0 ||
      autocompleteError !== null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setAutocompleteError("missing-key");
      return;
    }

    let isMounted = true;

    async function initPlaces() {
      try {
        if (!hasConfiguredMaps) {
          setOptions({
            key: GOOGLE_MAPS_API_KEY,
            v: "weekly",
          });
          hasConfiguredMaps = true;
        }

        await importLibrary("places");

        if (isMounted) {
          setIsAutocompleteReady(true);
          setAutocompleteError(null);
        }
      } catch (error) {
        logAutocompleteError("Failed to load Google Maps Places library.", error);

        if (isMounted) {
          setIsAutocompleteReady(false);
          setAutocompleteError("load-failed");
        }
      }
    }

    initPlaces();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsInputFocused(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsInputFocused(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isAutocompleteReady || !isInputFocused || trimmedValue.length < 2) {
      setPredictions([]);
      setIsFetchingSuggestions(false);
      setHasFetchedSuggestions(false);
      setAutocompleteError((current) =>
        current === "suggestions-failed" ? null : current
      );

      if (trimmedValue.length === 0) {
        sessionTokenRef.current = null;
      }

      return;
    }

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }

    const currentRequestId = ++requestIdRef.current;
    const debounceId = window.setTimeout(async () => {
      try {
        setIsFetchingSuggestions(true);
        setHasFetchedSuggestions(false);
        setAutocompleteError(null);

        const { suggestions } =
          await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: value,
            sessionToken: sessionTokenRef.current ?? undefined,
          });

        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        setPredictions(
          suggestions.flatMap((suggestion) =>
            suggestion.placePrediction ? [suggestion.placePrediction] : []
          )
        );
        setAutocompleteError(null);
      } catch (error) {
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        logAutocompleteError("Failed to fetch Google Places autocomplete suggestions.", error);
        setPredictions([]);
        setAutocompleteError("suggestions-failed");
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setIsFetchingSuggestions(false);
          setHasFetchedSuggestions(true);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(debounceId);
    };
  }, [isAutocompleteReady, isInputFocused, trimmedValue, value]);

  const helperMessage = useMemo(() => {
    if (autocompleteError) {
      return AUTOCOMPLETE_UNAVAILABLE_MESSAGE;
    }

    if (isFetchingSuggestions) {
      return "Searching places...";
    }

    if (hasFetchedSuggestions && predictions.length === 0) {
      return "No matches found. Keep typing or enter the location manually.";
    }

    return "Start typing to see Google Maps suggestions.";
  }, [autocompleteError, hasFetchedSuggestions, isFetchingSuggestions, predictions.length]);

  async function handlePredictionSelect(prediction: google.maps.places.PlacePrediction) {
    const fallbackValue = prediction.text.text;

    setIsFetchingSuggestions(true);
    setPredictions([]);
    setIsInputFocused(false);
    onChangeRef.current(fallbackValue);

    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["formattedAddress", "displayName"] });
      onChangeRef.current(place.formattedAddress ?? place.displayName ?? fallbackValue);
    } catch (error) {
      logAutocompleteError("Failed to fetch Google Place details.", error);
      onChangeRef.current(fallbackValue);
    } finally {
      sessionTokenRef.current = null;
      setIsFetchingSuggestions(false);
      setHasFetchedSuggestions(false);
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
        Location / Venue
      </label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-foreground/35"
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setIsInputFocused(true);
            onChange(e.target.value);
          }}
          onFocus={() => setIsInputFocused(true)}
          onBlur={onBlur}
          placeholder="Search for a venue or city"
          aria-invalid={Boolean(error)}
          aria-autocomplete="list"
          autoComplete="off"
          className={cn(
            "w-full bg-transparent border rounded-xl py-3 pr-4 pl-11 font-sans text-foreground placeholder:text-foreground/30",
            "focus:outline-none transition-colors",
            error ? "border-accent focus:border-accent" : "border-foreground/20 focus:border-primary"
          )}
        />

        {shouldShowDropdown && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-card">
            <div className="max-h-72 overflow-y-auto py-2">
              {autocompleteError ? (
                <p className="px-4 py-3 font-sans text-sm text-foreground/55">
                  {AUTOCOMPLETE_UNAVAILABLE_MESSAGE}
                </p>
              ) : isFetchingSuggestions && predictions.length === 0 ? (
                <p className="px-4 py-3 font-sans text-sm text-foreground/55">
                  Searching places...
                </p>
              ) : predictions.length > 0 ? (
                predictions.map((prediction) => (
                  <button
                    key={prediction.placeId}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      void handlePredictionSelect(prediction);
                    }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/4"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/55">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-sans text-sm font-medium text-foreground">
                        {prediction.mainText?.text ?? prediction.text.text}
                      </span>
                      {prediction.secondaryText?.text && (
                        <span className="block truncate font-sans text-sm text-foreground/55">
                          {prediction.secondaryText.text}
                        </span>
                      )}
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-4 py-3 font-sans text-sm text-foreground/55">
                  No matches found. Keep typing or enter the location manually.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {!error && (isAutocompleteReady || autocompleteError) && (
        <p className="font-sans text-sm text-foreground/50">{helperMessage}</p>
      )}
      {error && <p className="font-sans text-sm text-accent">{error}</p>}
    </div>
  );
}
