'use client';

import { useEffect, useRef, useState } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { Coordinates } from '@/types/station';
import { cn } from '@/lib/utils/formatters';

interface MapSearchProps {
  id: string;
  onSelectPlace: (location: Coordinates | null) => void;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  icon: string;
  lightMode?: boolean;
}

export default function MapSearch({
  id,
  onSelectPlace,
  placeholder,
  value,
  onValueChange,
  icon,
  lightMode = false,
}: MapSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasSelectedLocation, setHasSelectedLocation] = useState(
    Boolean(value)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    ready,
    suggestions: { status, data },
    setValue: setPlacesValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    callbackName: 'initMap',
    requestOptions: {
      componentRestrictions: { country: 'pk' },
    },
    debounce: 300,
  });

  useEffect(() => {
    if (value) {
      setPlacesValue(value, false);
      setHasSelectedLocation(true);
    } else {
      setHasSelectedLocation(false);
    }
  }, [value, setPlacesValue]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    onValueChange(newValue);
    setPlacesValue(newValue);

    if (newValue === '') {
      setHasSelectedLocation(false);
      onSelectPlace(null);
    }
  }

  function handleClear() {
    setPlacesValue('', false);
    setHasSelectedLocation(false);
    onValueChange('');
    onSelectPlace(null);
    clearSuggestions();

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  async function handleSelect(description: string) {
    setPlacesValue(description, false);
    onValueChange(description);
    clearSuggestions();

    try {
      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);

      setHasSelectedLocation(true);
      onSelectPlace({ lat, lng });

      if (inputRef.current) {
        inputRef.current.blur();

        if (id === 'from-location') {
          setTimeout(() => {
            document.getElementById('to-location')?.focus();
          }, 10);
        }
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      setHasSelectedLocation(false);
    }
  }

  return (
    <div className="relative w-full">
      <div
        className={cn(
          'absolute left-4 top-3.5',
          lightMode ? 'text-[color:var(--color-accent)]' : 'text-emerald-500'
        )}
      >
        <i className={icon}></i>
      </div>
      <input
        ref={inputRef}
        id={id}
        value={value}
        onChange={handleInputChange}
        disabled={!ready}
        className={cn(
          'w-full h-12 pl-12 pr-10 rounded-lg border',
          'transition-all duration-200 ease-in-out',
          'focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent focus:outline-none',
          isFocused
            ? 'border-[color:var(--color-accent)] bg-white shadow-md'
            : hasSelectedLocation
            ? lightMode
              ? 'border-gray-100 bg-white'
              : 'border-green-200 bg-white'
            : lightMode
            ? 'border-gray-100 bg-white'
            : 'border-gray-200 bg-gray-50'
        )}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setTimeout(() => setIsFocused(false), 150);
        }}
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-100"
          aria-label="Clear input"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
      )}

      {/* Fix for dropdown - use portal positioning */}
      {status === 'OK' && isFocused && (
        <div className="fixed inset-0 z-[999] pointer-events-none">
          <div
            className="pointer-events-auto absolute z-[1000] w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
            style={{
              top: inputRef.current
                ? inputRef.current.getBoundingClientRect().bottom + 4
                : 0,
              left: inputRef.current
                ? inputRef.current.getBoundingClientRect().left
                : 0,
              width: inputRef.current
                ? inputRef.current.getBoundingClientRect().width
                : '100%',
            }}
          >
            {data.map(
              ({
                place_id,
                description,
                structured_formatting: { main_text, secondary_text },
              }) => (
                <li
                  key={place_id}
                  className="cursor-pointer px-4 py-2 hover:bg-gray-100 transition-colors list-none"
                  onClick={() => handleSelect(description)}
                >
                  <div className="font-medium text-gray-800">{main_text}</div>
                  <div className="text-xs text-gray-500">{secondary_text}</div>
                </li>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
