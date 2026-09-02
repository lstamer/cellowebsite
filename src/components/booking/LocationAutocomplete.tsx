"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import {
  ComboBox,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Text,
  type Key,
} from "react-aria-components";
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
const SEARCHING_MESSAGE = "Searching places...";
const NO_MATCHES_MESSAGE = "No matches found. Keep typing or enter the location manually.";
let hasConfiguredMaps = false;

function logAutocompleteError(message: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[LocationAutocomplete] ${message}`, error);
  }
}

export function LocationAutocomplete({ value, onChange, onBlur, error }: LocationAutocompleteProps) {
  const onChangeRef = useRef(onChange);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const requestIdRef = useRef(0);

  const [shouldLoadMaps, setShouldLoadMaps] = useState(false);
  const [isAutocompleteReady, setIsAutocompleteReady] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [hasFetchedSuggestions, setHasFetchedSuggestions] = useState(false);
  const [predictions, setPredictions] = useState<google.maps.places.PlacePrediction[]>([]);
  const [selectedKey, setSelectedKey] = useState<Key | null>(null);
  const [autocompleteError, setAutocompleteError] = useState<AutocompleteError>(null);

  const trimmedValue = value.trim();
  const isQueryActive = trimmedValue.length >= 2 && selectedKey === null;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setAutocompleteError("missing-key");
      return;
    }

    if (!shouldLoadMaps || isAutocompleteReady) {
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
  }, [shouldLoadMaps, isAutocompleteReady]);

  useEffect(() => {
    if (!isAutocompleteReady || !isInputFocused || !isQueryActive) {
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
            includedRegionCodes: ["za"],
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
  }, [isAutocompleteReady, isInputFocused, isQueryActive, trimmedValue, value]);

  const statusMessage = useMemo(() => {
    if (autocompleteError) {
      return AUTOCOMPLETE_UNAVAILABLE_MESSAGE;
    }

    if (isFetchingSuggestions || (isQueryActive && !hasFetchedSuggestions)) {
      return SEARCHING_MESSAGE;
    }

    if (hasFetchedSuggestions && predictions.length === 0) {
      return NO_MATCHES_MESSAGE;
    }

    return null;
  }, [autocompleteError, hasFetchedSuggestions, isFetchingSuggestions, isQueryActive, predictions.length]);

  // The visible hint stays fixed while a query runs. Live status text is announced
  // via the sr-only live region and shown inside the popover; changing the hint
  // under the input would resize the document and close the non-modal popover.
  const helperMessage = error
    ? null
    : autocompleteError === "missing-key" || autocompleteError === "load-failed"
      ? AUTOCOMPLETE_UNAVAILABLE_MESSAGE
      : "Start typing to see Google Maps suggestions.";

  async function handlePredictionSelect(prediction: google.maps.places.PlacePrediction) {
    const fallbackValue = prediction.text.text;

    setIsFetchingSuggestions(true);
    setPredictions([]);
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
    <ComboBox<google.maps.places.PlacePrediction>
      className="flex flex-col gap-2"
      items={predictions}
      inputValue={value}
      onInputChange={(nextValue) => {
        setSelectedKey(null);
        onChange(nextValue);
      }}
      value={selectedKey}
      onChange={(key) => {
        if (key === null) {
          return;
        }

        const prediction = predictions.find((candidate) => candidate.placeId === key);
        if (!prediction) {
          return;
        }

        setSelectedKey(key);
        void handlePredictionSelect(prediction);
      }}
      allowsCustomValue
      allowsEmptyCollection={isQueryActive}
      menuTrigger="input"
      isInvalid={Boolean(error)}
      onFocus={() => {
        setShouldLoadMaps(true);
        setIsInputFocused(true);
      }}
      onBlur={() => {
        setIsInputFocused(false);
        onBlur?.();
      }}
    >
      <Label className="font-jost text-xs uppercase tracking-wider text-foreground/70">
        Location / Venue
      </Label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40"
          aria-hidden="true"
        />

        <Input
          placeholder="Search for a venue or city"
          autoComplete="off"
          className={cn(
            "w-full bg-transparent border rounded-xl py-3 pr-4 pl-11 font-sans text-foreground placeholder:text-foreground/60",
            "focus:outline-none transition-colors",
            error ? "border-accent focus:border-accent" : "border-foreground/20 focus:border-primary"
          )}
        />

        <Popover
          offset={8}
          placement="bottom start"
          className={cn(
            "z-30 w-(--trigger-width) overflow-hidden rounded-xl border border-foreground/10 bg-background shadow-card",
            "transition-[opacity,transform] duration-200 ease-out",
            "data-entering:-translate-y-1 data-entering:opacity-0",
            "data-exiting:-translate-y-1 data-exiting:opacity-0"
          )}
        >
          <ListBox<google.maps.places.PlacePrediction>
            className="max-h-72 overflow-y-auto py-2 outline-none"
            renderEmptyState={() =>
              statusMessage ? (
                <p className="px-4 py-3 font-sans text-sm text-foreground/60">{statusMessage}</p>
              ) : null
            }
          >
            {(prediction) => (
              <ListBoxItem
                id={prediction.placeId}
                textValue={prediction.text.text}
                className={cn(
                  "group flex w-full cursor-default items-start gap-3 px-4 py-3 text-left outline-none transition-colors",
                  "data-hovered:bg-foreground/5 data-focused:bg-foreground/5 data-selected:bg-foreground/5"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-foreground/60 transition-colors",
                    "group-data-selected:bg-primary/10 group-data-selected:text-primary"
                  )}
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-sans text-sm font-medium text-foreground">
                    {prediction.mainText?.text ?? prediction.text.text}
                  </span>
                  {prediction.secondaryText?.text && (
                    <span className="block truncate font-sans text-sm text-foreground/60">
                      {prediction.secondaryText.text}
                    </span>
                  )}
                </span>
              </ListBoxItem>
            )}
          </ListBox>
        </Popover>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>

      {helperMessage && (
        <p aria-hidden="true" className="font-sans text-sm text-foreground/50">
          {helperMessage}
        </p>
      )}

      {error && (
        <Text slot="errorMessage" role="alert" className="font-sans text-sm text-error">
          {error}
        </Text>
      )}
    </ComboBox>
  );
}
