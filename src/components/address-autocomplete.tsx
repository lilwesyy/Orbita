"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

interface PhotonFeature {
  type: "Feature";
  geometry: { type: string; coordinates: number[] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

interface PhotonResponse {
  type: "FeatureCollection";
  features: PhotonFeature[];
}

interface AddressAutocompleteProps {
  defaultValue?: string;
  name: string;
  placeholder?: string;
}

function formatAddress(props: PhotonFeature["properties"]): string {
  const parts: string[] = [];

  const streetWithNumber = [props.street, props.housenumber].filter(Boolean).join(" ");
  const streetLine = streetWithNumber || props.name;
  if (streetLine) parts.push(streetLine);

  const cityLine = [props.postcode, props.city].filter(Boolean).join(" ");
  if (cityLine) parts.push(cityLine);

  if (props.county) parts.push(props.county);
  if (props.state) parts.push(props.state);
  if (props.country) parts.push(props.country);

  return parts.join(", ");
}

export default function AddressAutocomplete({
  defaultValue = "",
  name,
  placeholder,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const skipFetchRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=default`
      );
      if (!res.ok) return;
      const data: PhotonResponse = await res.json();
      setSuggestions(data.features);
      setOpen(data.features.length > 0);
    } catch {
      // silently ignore network errors
    }
  }, []);

  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function buildSelectedAddress(typed: string, props: PhotonFeature["properties"]): string {
    // Remove location terms the user typed for searching (city, postcode, etc.)
    let street = typed.trim();
    const locationTerms = [props.city, props.postcode, props.county, props.state, props.country].filter((t): t is string => Boolean(t));
    for (const term of locationTerms) {
      const regex = new RegExp(`\\s*,?\\s*${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
      street = street.replace(regex, "");
    }
    street = street.replace(/,\s*$/, "").trim();

    const locationParts: string[] = [];
    const cityLine = [props.postcode, props.city].filter(Boolean).join(" ");
    if (cityLine) locationParts.push(cityLine);
    if (props.county) locationParts.push(props.county);
    if (props.state) locationParts.push(props.state);
    if (props.country) locationParts.push(props.country);

    const location = locationParts.join(", ");
    return location ? `${street}, ${location}` : street;
  }

  function handleSelect(feature: PhotonFeature) {
    const formatted = buildSelectedAddress(query, feature.properties);
    skipFetchRef.current = true;
    setQuery(formatted);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        name={name}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto py-1">
          {suggestions.map((feature, idx) => {
            const address = formatAddress(feature.properties);
            return (
              <li key={`${address}-${idx}`}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(feature);
                  }}
                >
                  {address}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
